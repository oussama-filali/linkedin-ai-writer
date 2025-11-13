const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase') 
        ? { rejectUnauthorized: false } 
        : false
});

pool.on('error', (err) => {
    console.error('⚠️  Erreur pool PostgreSQL (non-fatal):', err.message);
    // Ne pas tuer le serveur - laisser les requêtes individuelles gérer leurs erreurs
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
