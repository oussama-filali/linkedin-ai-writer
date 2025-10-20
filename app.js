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

// Static files
app.use(express.static('public'));

// Views (pour compatibilité temporaire)
app.set('view engine', 'ejs');

// API Routes
const postsRouter = require('./backend/routes/posts');
app.use('/api/posts', postsRouter);

// Legacy routes (à migrer vers API)
const legacyRoutes = require('./routes/index');
app.use('/', legacyRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
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