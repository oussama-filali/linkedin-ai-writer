const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const {
  verifySupabaseToken,
  findUserBySupabaseId,
  upsertSupabaseUser,
} = require('../services/auth-service');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-prod';
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

async function fetchUserById(userId) {
  const { rows } = await db.query(
    'SELECT id, email, name, linkedin_profile, supabase_id FROM users WHERE id = $1',
    [userId]
  );
  return rows[0] || null;
}

function buildUserResponse(user, provider, issuedAt) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    headline: user.linkedin_profile || null,
    provider,
    lastSync: issuedAt ? new Date(issuedAt * 1000).toISOString() : new Date().toISOString(),
  };
}

module.exports = async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');

    if (!token) {
      return res.status(401).json({ success: false, error: 'Token manquant' });
    }

    if (SUPABASE_JWT_SECRET) {
      try {
        const payload = verifySupabaseToken(token);
        let user = await findUserBySupabaseId(payload.sub);

        if (!user) {
          user = await upsertSupabaseUser(payload);
        }

        if (!user) {
          return res.status(401).json({ success: false, error: 'Utilisateur Supabase introuvable' });
        }

        req.auth = {
          provider: 'supabase',
          supabaseId: payload.sub,
          email: payload.email,
        };
        req.user = buildUserResponse(user, 'supabase', payload.iat);
        return next();
      } catch (err) {
        if (err.name !== 'JsonWebTokenError' && err.name !== 'TokenExpiredError') {
          console.error('Erreur validation Supabase JWT:', err.message);
          return res.status(401).json({ success: false, error: 'Token Supabase invalide' });
        }
        // Sinon, on tente le fallback JWT interne
      }
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await fetchUserById(payload.sub);

      if (!user) {
        return res.status(401).json({ success: false, error: 'Utilisateur introuvable' });
      }

      req.auth = payload;
      req.user = buildUserResponse(user, payload.provider, payload.iat);
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Token invalide ou expiré' });
    }
  } catch (error) {
    console.error('Erreur middleware auth:', error.message);
    res.status(500).json({ success: false, error: 'Erreur authentification' });
  }
};
