/**
 * Script pour nettoyer complètement la base de données
 * ⚠️ ATTENTION : Supprime TOUTES les tables !
 */
require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Client } = require('pg');

async function cleanDatabase() {
    console.log('⚠️  NETTOYAGE COMPLET DE LA BASE DE DONNÉES\n');
    console.log('Ce script va supprimer TOUTES les tables.\n');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase')
            ? { rejectUnauthorized: false, checkServerIdentity: () => {} }
            : false
    });
    
    try {
        await client.connect();
        console.log('✅ Connecté à PostgreSQL\n');
        
        // Lister les tables existantes
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        
        if (tables.rows.length === 0) {
            console.log('✅ Aucune table à supprimer\n');
            await client.end();
            process.exit(0);
        }
        
        console.log('📊 Tables trouvées:');
        tables.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        console.log('');
        
        // Suppression en cascade
        console.log('🗑️  Suppression des tables en cours...\n');
        
        const tablesToDrop = tables.rows.map(r => r.table_name);
        
        for (const table of tablesToDrop) {
            try {
                console.log(`   Suppression: ${table}...`);
                await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
                console.log(`   ✓ ${table} supprimée`);
            } catch (err) {
                console.log(`   ⚠ ${table}: ${err.message}`);
            }
        }
        
        // Supprimer les vues
        console.log('\n🗑️  Suppression des vues...');
        const views = await client.query(`
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public'
        `);
        
        for (const view of views.rows) {
            try {
                await client.query(`DROP VIEW IF EXISTS ${view.table_name} CASCADE`);
                console.log(`   ✓ Vue ${view.table_name} supprimée`);
            } catch (err) {
                console.log(`   ⚠ ${view.table_name}: ${err.message}`);
            }
        }
        
        // Supprimer les fonctions
        console.log('\n🗑️  Suppression des fonctions...');
        try {
            await client.query(`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE`);
            console.log('   ✓ Fonction update_updated_at_column() supprimée');
        } catch (err) {
            console.log(`   ⚠ ${err.message}`);
        }
        
        console.log('\n✅ BASE DE DONNÉES NETTOYÉE!\n');
        console.log('Maintenant tu peux relancer:');
        console.log('   npm run db:migrate\n');
        
        await client.end();
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
        process.exit(1);
    }
}

// Confirmation de sécurité
console.log('═'.repeat(60));
console.log('⚠️  ATTENTION - SUPPRESSION TOTALE DE LA BASE DE DONNÉES');
console.log('═'.repeat(60));
console.log('\nCe script va supprimer:');
console.log('  • Toutes les tables');
console.log('  • Toutes les vues');
console.log('  • Toutes les fonctions');
console.log('  • Toutes les données\n');

cleanDatabase();
