const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;
if (process.env.NODE_ENV === 'production' && !JWT_SECRET) {
  throw new Error('JWT_SECRET manquant en production');
}
const EFFECTIVE_JWT_SECRET = JWT_SECRET || 'change-me-in-prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

async function verifyGoogleToken(idToken) {
  if (!googleClient) {
    throw new Error('GOOGLE_CLIENT_ID manquant côté serveur');
  }
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Jeton Google invalide');
  }
  return {
    email: payload.email,
    name: payload.name || payload.given_name || 'Utilisateur',
    avatar: payload.picture,
    sub: payload.sub,
  };
}

async function upsertUser(profile) {
  if (!profile.email) {
    throw new Error('Email absent dans le profil Google');
  }

  const { rows } = await db.query(
    `INSERT INTO users (email, name, linkedin_profile, updated_at)
     VALUES ($1, $2, NULL, NOW())
     ON CONFLICT (email)
     DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
     RETURNING id, email, name, linkedin_profile`,
    [profile.email, profile.name]
  );

  return rows[0];
}

async function findUserBySupabaseId(supabaseId) {
  if (!supabaseId) {
    return null;
  }
  const { rows } = await db.query(
    'SELECT id, email, name, linkedin_profile, supabase_id FROM users WHERE supabase_id = $1',
    [supabaseId]
  );
  return rows[0] || null;
}

async function findUserByEmail(email) {
  if (!email) {
    return null;
  }
  const { rows } = await db.query(
    'SELECT id, email, name, linkedin_profile, supabase_id FROM users WHERE email = $1',
    [email]
  );
  return rows[0] || null;
}

function resolveNameFromPayload(payload) {
  const meta = payload.user_metadata || payload.app_metadata || {};
  return (
    meta.full_name ||
    meta.name ||
    payload.name ||
    (payload.email ? payload.email.split('@')[0] : 'Utilisateur')
  );
}

async function upsertSupabaseUser(payload) {
  if (!payload?.sub) {
    throw new Error('Token Supabase invalide (sub manquant)');
  }

  const email = payload.email || payload?.user_metadata?.email;
  if (!email) {
    throw new Error('Email absent dans le token Supabase');
  }
  const existingBySupabase = await findUserBySupabaseId(payload.sub);

  if (existingBySupabase) {
    const { rows } = await db.query(
      `UPDATE users
       SET email = COALESCE($2, email),
           name = COALESCE($3, name),
           updated_at = NOW()
       WHERE supabase_id = $1
       RETURNING id, email, name, linkedin_profile, supabase_id`,
      [payload.sub, email, resolveNameFromPayload(payload)]
    );
    return rows[0];
  }

  const existingByEmail = await findUserByEmail(email);
  if (existingByEmail) {
    const { rows } = await db.query(
      `UPDATE users
       SET supabase_id = $1,
           name = COALESCE($3, name),
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, name, linkedin_profile, supabase_id`,
      [payload.sub, existingByEmail.id, resolveNameFromPayload(payload)]
    );
    return rows[0];
  }

  const { rows } = await db.query(
    `INSERT INTO users (supabase_id, email, name, linkedin_profile, updated_at)
     VALUES ($1, $2, $3, NULL, NOW())
     RETURNING id, email, name, linkedin_profile, supabase_id`,
    [payload.sub, email, resolveNameFromPayload(payload)]
  );

  return rows[0];
}

// Cache en mémoire des clés JWKS (rotation Supabase possible)
let jwksCache = { keys: null, fetchedAt: 0 };
const JWKS_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function fetchSupabaseJWKS() {
  const now = Date.now();
  if (jwksCache.keys && now - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }
  const url = `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Impossible de récupérer JWKS Supabase (${res.status})`);
  }
  const data = await res.json();
  jwksCache = { keys: data.keys || [], fetchedAt: now };
  return jwksCache.keys;
}

async function verifySupabaseToken(token) {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || !decoded.header) {
    throw new Error('Token Supabase invalide (header manquant)');
  }
  const { alg, kid } = decoded.header;
  if (alg === 'HS256') {
    if (!SUPABASE_JWT_SECRET) {
      throw new Error('SUPABASE_JWT_SECRET non configuré côté serveur');
    }
    return jwt.verify(token, SUPABASE_JWT_SECRET, { algorithms: ['HS256'] });
  }
  if (alg === 'ES256') {
    const keys = await fetchSupabaseJWKS();
    const jwks = keys.find(k => k.kid === kid);
    if (!jwks) throw new Error('kid non correspondant dans JWKS');
    try {
      const { importJWK, jwtVerify } = require('jose');
      const keyLike = await importJWK(jwks, 'ES256');
      const verifyResult = await jwtVerify(token, keyLike, {});
      return verifyResult.payload;
    } catch (e) {
      // On remonte la VRAIE erreur de vérification (au lieu d'un message trompeur sur "jose").
      throw new Error(`Vérification ES256 échouée: ${e.message}`);
    }
  }
  throw new Error(`Algorithme JWT Supabase non supporté: ${alg}`);
}

function createJwt(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      provider: 'google',
    },
    EFFECTIVE_JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function resendConfirmationEmail(email) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Configuration Supabase manquante');
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/resend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify({
      type: 'signup',
      email: email,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors du renvoi de l\'email');
  }

  return await response.json();
}

module.exports = {
  verifyGoogleToken,
  upsertUser,
  createJwt,
  verifySupabaseToken,
  upsertSupabaseUser,
  findUserBySupabaseId,
  findUserByEmail,
  resendConfirmationEmail,
};
