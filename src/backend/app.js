require('dotenv').config();

// Désactiver la vérification SSL stricte en développement (pour éviter les erreurs de certificat)
if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.warn('⚠️  SSL verification disabled in development mode');
}

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de sécurité
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'"],
        },
    },
}));

// Configuration CORS - AUTORISER TOUT EN DEV
app.use(cors({
    origin: true, // Accepte toutes les origines en dev
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Body parsers (AVANT le rate limiter pour parser les requêtes)
app.use(bodyParser.json({ extended: true, limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (APRES CORS pour ne pas bloquer les preflight)
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
    skip: (req) => req.method === 'OPTIONS' // Skip rate limit pour preflight
});
app.use('/api/', limiter);

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
const postsRouter = require('./routes/posts');
const predictionsRouter = require('./routes/predictions');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/predictions', predictionsRouter);

// Route pour gérer les redirections Supabase (Email confirmation / OAuth)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>LinkedIn AI Writer - Authentification</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; text-align: center; color: #333; background: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                h1 { color: #0077b5; margin-bottom: 10px; }
                p { margin-bottom: 20px; line-height: 1.5; }
                .btn { display: inline-block; background: #0077b5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 24px; font-weight: bold; margin-top: 10px; cursor: pointer; border: none; }
                .btn:hover { background: #005885; }
                .btn-secondary { background: #6c757d; }
                .btn-secondary:hover { background: #5a6268; }
                .error { background: #fee; padding: 15px; border-radius: 8px; color: #c00; margin: 20px 0; }
                .success { background: #efe; padding: 15px; border-radius: 8px; color: #0a0; margin: 20px 0; }
                #status { margin-top: 20px; font-weight: bold; }
                .actions { margin-top: 20px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🔐 LinkedIn AI Writer</h1>
                <div id="content"></div>
                <div id="status"></div>
                <div class="actions" id="actions"></div>
            </div>

            <script>
                const contentDiv = document.getElementById('content');
                const statusDiv = document.getElementById('status');
                const actionsDiv = document.getElementById('actions');

                // Récupérer le hash (#access_token=... ou #error=...)
                const hash = window.location.hash.substring(1);
                const params = new URLSearchParams(hash);
                
                const error = params.get('error');
                const errorDescription = params.get('error_description');
                const accessToken = params.get('access_token');

                if (error) {
                    // Gestion des erreurs
                    contentDiv.innerHTML = '<div class="error"><strong>❌ Erreur d\\'authentification</strong></div>';
                    
                    if (error === 'access_denied' && errorDescription?.includes('expired')) {
                        contentDiv.innerHTML += '<p>Le lien de confirmation a expiré. Veuillez demander un nouveau lien.</p>';
                        actionsDiv.innerHTML = \`
                            <button class="btn" onclick="showResendForm()">📧 Renvoyer l'email</button>
                            <a href="linkedinaiwritermobile://auth/login" class="btn btn-secondary">Retour à l'app</a>
                        \`;
                    } else {
                        contentDiv.innerHTML += \`<p>\${decodeURIComponent(errorDescription || 'Erreur inconnue')}</p>\`;
                        actionsDiv.innerHTML = '<a href="linkedinaiwritermobile://auth/login" class="btn">Retour à l\\'app</a>';
                    }
                } else if (accessToken) {
                    // Succès
                    contentDiv.innerHTML = '<div class="success"><strong>✅ Authentification réussie !</strong></div>';
                    contentDiv.innerHTML += '<p>Redirection vers l\\'application mobile...</p>';
                    
                    const deepLink = \`linkedinaiwritermobile://auth/callback?\${hash}\`;
                    statusDiv.textContent = "Ouverture de l'application...";
                    
                    // Tentative de redirection automatique
                    window.location.href = deepLink;
                    
                    setTimeout(() => {
                        statusDiv.textContent = "Si l'application ne s'ouvre pas automatiquement :";
                        actionsDiv.innerHTML = \`<a href="\${deepLink}" class="btn">📱 Ouvrir l'application</a>\`;
                    }, 2000);
                } else {
                    // Aucun access_token: probable lien de CONFIRMATION email (type=signup / type=magiclink)
                    const type = params.get('type');
                    if (type === 'signup' || type === 'email') {
                        contentDiv.innerHTML = '<div class="success"><strong>✅ Email confirmé.</strong></div>';
                        contentDiv.innerHTML += '<p>Aucun token dans l\'URL car Supabase ne renvoie pas de session après simple confirmation.</p>';
                        contentDiv.innerHTML += '<p><strong>Étape suivante :</strong> Ouvre l\'application et connecte-toi avec ton email et mot de passe.</p>';
                        actionsDiv.innerHTML = '<a href="linkedinaiwritermobile://auth/login" class="btn">📱 Aller à la connexion</a>';
                    } else {
                        // Page d'accueil par défaut
                        contentDiv.innerHTML = '<p>Bienvenue sur le backend de LinkedIn AI Writer</p>';
                        actionsDiv.innerHTML = '<a href="linkedinaiwritermobile://auth/login" class="btn">Ouvrir l\'application</a>';
                    }
                }

                function showResendForm() {
                    contentDiv.innerHTML = \`
                        <h2>📧 Renvoyer l'email de confirmation</h2>
                        <input type="email" id="email" placeholder="votre@email.com" style="padding: 10px; width: 80%; max-width: 300px; border: 1px solid #ccc; border-radius: 4px; margin: 10px 0;">
                        <div id="resend-status" style="margin-top: 10px;"></div>
                    \`;
                    actionsDiv.innerHTML = \`
                        <button class="btn" onclick="resendEmail()">Envoyer</button>
                        <button class="btn btn-secondary" onclick="location.reload()">Annuler</button>
                    \`;
                }

                async function resendEmail() {
                    const email = document.getElementById('email').value;
                    const resendStatus = document.getElementById('resend-status');
                    
                    if (!email || !email.includes('@')) {
                        resendStatus.innerHTML = '<div class="error">Veuillez entrer une adresse email valide</div>';
                        return;
                    }

                    resendStatus.textContent = '⏳ Envoi en cours...';

                    try {
                        const response = await fetch('/api/auth/resend-confirmation', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email })
                        });

                        const data = await response.json();

                        if (data.success) {
                            resendStatus.innerHTML = '<div class="success">✅ Email envoyé ! Vérifiez votre boîte de réception.</div>';
                            setTimeout(() => location.reload(), 3000);
                        } else {
                            resendStatus.innerHTML = \`<div class="error">❌ \${data.error}</div>\`;
                        }
                    } catch (error) {
                        resendStatus.innerHTML = '<div class="error">❌ Erreur réseau. Réessayez.</div>';
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// Log des routes disponibles
console.log('📡 Routes API disponibles:');
console.log('   POST /api/posts/generate');
console.log('   POST /api/posts/improve');
console.log('   POST /api/posts/check');
console.log('   GET  /api/posts/history');
console.log('   GET  /api/posts/:id');
console.log('   POST /api/auth/supabase');
console.log('   POST /api/auth/google');
console.log('   POST /api/auth/resend-confirmation');
console.log('   GET  /api/auth/me');
console.log('   POST /api/auth/logout');
console.log('   GET  /api/users/preferences');
console.log('   PATCH /api/users/preferences');
console.log('   POST /api/predictions/analyze');
console.log('   POST /api/predictions/verify');
console.log('   POST /api/predictions/compare');
console.log('   POST /api/predictions/timing');
console.log('   GET  /health');

// Health check (avec diagnostics)
const db = require('../config/database');
app.get('/health', async (req, res) => {
    const start = Date.now();
    const diagnostics = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            api: 'up',
            db: 'unknown',
            openaiKeyPresent: Boolean(process.env.OPENAI_API_KEY),
            googleFactCheckKeyPresent: Boolean(process.env.GOOGLE_FACT_CHECK_API_KEY)
        }
    };

    // Test DB (si DATABASE_URL configurée) - async timeout protection
    try {
        if (process.env.DATABASE_URL) {
            // Utiliser un timeout court pour ne pas bloquer
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('DB query timeout')), 2000)
            );
            const queryPromise = db.query('SELECT 1 as ok');
            const result = await Promise.race([queryPromise, timeoutPromise]);
            diagnostics.services.db = result?.rows?.[0]?.ok === 1 ? 'up' : 'degraded';
        } else {
            diagnostics.services.db = 'not-configured';
        }
    } catch (err) {
        diagnostics.services.db = 'down';
        diagnostics.dbError = err.message;
    } finally {
        diagnostics.latencyMs = Date.now() - start;
    }

    const httpCode = diagnostics.services.api === 'up' && diagnostics.services.db !== 'down' ? 200 : 503;
    res.status(httpCode).json(diagnostics);
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route non trouvée'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Erreur serveur interne',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Démarrage du serveur
const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║  LinkedIn AI Writer - Backend Server  ║
╠════════════════════════════════════════╣
║  Port: ${PORT.toString().padEnd(33)}║
║  Env:  ${(process.env.NODE_ENV || 'development').padEnd(33)}║
║  URL:  http://localhost:${PORT.toString().padEnd(22)}║
╚════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM reçu, arrêt gracieux...');
    server.close(() => {
        console.log('Serveur fermé');
        process.exit(0);
    });
});

module.exports = app;