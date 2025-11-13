require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Sécurité
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Trop de requêtes depuis cette IP, réessayez plus tard.'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
const postsRouter = require('./routes/posts');
const predictionsRouter = require('./routes/predictions');
const debugRouter = require('./routes/debug');

app.use('/api/posts', postsRouter);
app.use('/api/predictions', predictionsRouter);
app.use('/api/debug', debugRouter);

// Log des routes disponibles
console.log('📡 Routes API disponibles:');
console.log('   POST /api/posts/generate');
console.log('   POST /api/posts/improve');
console.log('   POST /api/posts/check');
console.log('   GET  /api/posts/history');
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

    // Test DB (si DATABASE_URL configurée)
    try {
        if (process.env.DATABASE_URL) {
            const result = await db.query('SELECT 1 as ok');
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

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM reçu, arrêt gracieux...');
    server.close(() => {
        console.log('Serveur fermé');
        process.exit(0);
    });
});

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