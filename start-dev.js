#!/usr/bin/env node
/**
 * Dev server wrapper with TLS bypass for Supabase pooler self-signed certs
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Catch errors
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

// Charger les variables d'env
require('dotenv').config();

console.log('✅ Démarrage du serveur...');

// Démarrer le serveur (app.js s'occupe de app.listen)
require('./src/backend/app.js');
