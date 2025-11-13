#!/usr/bin/env node
/*
  Simple migration runner for PostgreSQL using pg and SQL files.
  Runs all *.sql files in src/database/migrations in lexicographic order.
*/
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config();

(async () => {
  const migrationsDir = path.resolve(__dirname, '../src/database/migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL manquante dans .env');
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });

  try {
    await client.connect();
    console.log(`Connecté à la base de données: ${process.env.DATABASE_URL.split('@').pop()}`);

    // Create migrations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get already executed migrations
    const executed = new Set((await client.query('SELECT filename FROM _migrations')).rows.map((r) => r.filename));

    for (const file of files) {
      if (executed.has(file)) {
        console.log(`- Skipping ${file} (déjà exécutée)`);
        continue;
      }
      const fullPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(fullPath, 'utf8');
      console.log(`▶ Exécution de ${file}...`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✔ Migration ${file} OK`);
      } catch (e) {
        await client.query('ROLLBACK');
        console.error(`✖ Échec migration ${file}:`, e.message);
        process.exit(1);
      }
    }

    console.log('Toutes les migrations sont à jour.');
  } catch (err) {
    console.error('Erreur migrations:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
