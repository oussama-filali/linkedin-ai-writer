/**
 * Script de vérification avant migration
 * Affiche l'état actuel de la DB et ce qui va être migré
 */
require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function checkMigrations() {
    console.log('🔍 Vérification des migrations...\n');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase')
            ? { rejectUnauthorized: false, checkServerIdentity: () => {} }
            : false
    });
    
    try {
        await client.connect();
        console.log('✅ Connecté à PostgreSQL\n');
        
        // Vérifier si table _migrations existe
        const migTableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = '_migrations'
            );
        `);
        
        if (!migTableExists.rows[0].exists) {
            console.log('📋 Table _migrations n\'existe pas encore (première migration)');
        } else {
            console.log('📋 Migrations déjà exécutées:');
            const executed = await client.query('SELECT filename, executed_at FROM _migrations ORDER BY id');
            if (executed.rows.length === 0) {
                console.log('   Aucune migration exécutée\n');
            } else {
                executed.rows.forEach(row => {
                    console.log(`   ✓ ${row.filename} (${new Date(row.executed_at).toLocaleString()})`);
                });
                console.log('');
            }
        }
        
        // Lister les fichiers de migration disponibles
        const migrationsDir = path.resolve(__dirname, '../src/database/migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();
        
        console.log('📁 Fichiers de migration disponibles:');
        files.forEach(file => {
            console.log(`   - ${file}`);
        });
        console.log('');
        
        // Vérifier les tables existantes
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            AND table_name != '_migrations'
            ORDER BY table_name
        `);
        
        if (tables.rows.length === 0) {
            console.log('⚠️  Aucune table n\'existe encore dans la base de données\n');
        } else {
            console.log('📊 Tables existantes:');
            tables.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });
            console.log('');
        }
        
        // Résumé
        console.log('═'.repeat(60));
        console.log('RÉSUMÉ:');
        console.log('═'.repeat(60));
        
        if (!migTableExists.rows[0].exists || tables.rows.length === 0) {
            console.log('🆕 Première migration');
            console.log(`   ${files.length} fichier(s) SQL seront exécutés`);
            console.log('\n   Tables qui seront créées:');
            console.log('   • users');
            console.log('   • generations_history');
            console.log('   • prompts_templates');
            console.log('   • predictions_analytics');
            console.log('   • fact_checks_detailed');
            console.log('   • post_variants_comparison');
            console.log('   • posting_timing_analysis');
        } else {
            const executed = await client.query('SELECT filename FROM _migrations');
            const executedSet = new Set(executed.rows.map(r => r.filename));
            const pending = files.filter(f => !executedSet.has(f));
            
            if (pending.length === 0) {
                console.log('✅ Toutes les migrations sont déjà appliquées');
                console.log('   Rien à faire!');
            } else {
                console.log(`⏳ ${pending.length} migration(s) en attente:`);
                pending.forEach(file => {
                    console.log(`   → ${file}`);
                });
            }
        }
        
        console.log('\n' + '═'.repeat(60));
        console.log('Pour exécuter les migrations:');
        console.log('   npm run db:migrate');
        console.log('   OU');
        console.log('   node scripts/migrate.js');
        console.log('═'.repeat(60) + '\n');
        
        await client.end();
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ ERREUR:');
        console.error(error.message);
        console.error('\nVérifie:');
        console.error('  1. DATABASE_URL dans .env est correct');
        console.error('  2. La base de données est accessible');
        console.error('  3. Les permissions sont correctes\n');
        process.exit(1);
    }
}

checkMigrations();
