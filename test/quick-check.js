/**
 * Quick Check - Vérifie que le serveur démarre sans erreur
 */
console.log('🔍 Vérification rapide du serveur...\n');

try {
    // 1. Charger l'environnement
    require('dotenv').config();
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // 2. Tester le chargement de app.js
    console.log('⏳ Chargement de app.js...');
    const app = require('../src/backend/app');
    
    // Si on arrive ici, c'est que app.js charge sans erreur
    console.log('✅ app.js charge correctement!\n');
    
    // 3. Vérifier les variables critiques
    console.log('📋 Variables d\'environnement:');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✓' : '✗'}`);
    console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✓' : '✗'}`);
    console.log(`   PORT: ${process.env.PORT || 3000}`);
    
    console.log('\n✅ QUICK CHECK PASSED!');
    console.log('\n🚀 Pour démarrer le serveur:');
    console.log('   node start-dev.js');
    console.log('   OU');
    console.log('   npm run dev\n');
    
    process.exit(0);
    
} catch (error) {
    console.error('\n❌ ERREUR:');
    console.error(error.message);
    console.error('\n📋 Stack trace:');
    console.error(error.stack);
    console.error('\n💡 Lance: node test/diagnostic.js pour plus de détails\n');
    process.exit(1);
}
