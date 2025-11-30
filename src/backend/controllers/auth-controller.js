const authService = require('../services/auth-service');

exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, error: 'idToken requis' });
    }

    const googleProfile = await authService.verifyGoogleToken(idToken);
    const user = await authService.upsertUser(googleProfile);
    const token = authService.createJwt(user);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          headline: user.linkedin_profile,
          provider: 'google',
          lastSync: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Erreur auth Google:', error.message);
    res.status(401).json({ success: false, error: error.message || 'Connexion impossible' });
  }
};

exports.supabaseLogin = async (req, res) => {
  try {
    const header = req.headers.authorization || '';
    const [, bearerToken] = header.split(' ');
    const accessToken = bearerToken || req.body?.accessToken;

    if (!accessToken) {
      return res.status(400).json({ success: false, error: 'Token Supabase manquant' });
    }

    const payload = await authService.verifySupabaseToken(accessToken);
    const user = await authService.upsertSupabaseUser(payload);

    res.json({
      success: true,
      data: {
        token: accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          headline: user.linkedin_profile,
          provider: 'supabase',
          lastSync: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    const status = error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' ? 401 : 500;
    console.error('Erreur auth Supabase:', error.message);
    res.status(status).json({ success: false, error: error.message || 'Connexion Supabase impossible' });
  }
};

exports.getProfile = async (req, res) => {
  res.json({ success: true, data: req.user });
};

exports.logout = async (_req, res) => {
  // JWT stateless: le client détruit simplement son token
  res.json({ success: true });
};

exports.resendConfirmation = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email requis' });
    }

    await authService.resendConfirmationEmail(email);
    
    res.json({
      success: true,
      message: 'Email de confirmation renvoyé avec succès. Vérifiez votre boîte de réception.'
    });
  } catch (error) {
    console.error('Erreur resend confirmation:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Impossible de renvoyer l\'email de confirmation' 
    });
  }
};
