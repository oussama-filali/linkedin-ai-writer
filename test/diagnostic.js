/**
 * Diagnostic complet du projet
 * Vérifie tous les composants critiques
 */
const fs = require('fs');
const path = require('path');

console.log(`
╔═══════════════════════════════════════════════╗
║   LinkedIn AI Writer - Diagnostic Complet   ║
╚═══════════════════════════════════════════════╝
`);

const checks = {
    passed: [],
    warnings: [],
    errors: []
};

// 1. Vérification fichiers critiques
console.log('📁 Vérification des fichiers critiques...');
const criticalFiles = [
    '.env',
    'package.json',
    'start-dev.js',
    'src/backend/app.js',
    'src/backend/routes/posts.js',
    'src/backend/routes/predictions.js',
    'src/backend/controllers/post-controller.js',
    'src/backend/controllers/prediction-controller.js',
    'src/backend/middlewares/validate-request.js',
    'src/config/database.js',
    'src/config/openai.js',
    'src/ia/ai-service.js',
    'src/ia/ai-predictive-service.js',
    'src/ia/content-filter.js',
    'src/ia/fact-checking/fact-checker.js',
    'src/ia/prompts/linkedin-prompts.js'
];

criticalFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, '..', file))) {
        checks.passed.push(`✓ ${file}`);
    } else {
        checks.errors.push(`✗ ${file} MANQUANT`);
    }
});

// 2. Vérification .env
console.log('\n🔐 Vérification variables d\'environnement...');
require('dotenv').config();

const requiredEnvVars = [
    { name: 'DATABASE_URL', critical: true },
    { name: 'OPENAI_API_KEY', critical: true },
    { name: 'GOOGLE_FACT_CHECK_API_KEY', critical: false },
    { name: 'PORT', critical: false },
    { name: 'JWT_SECRET', critical: false }
];

requiredEnvVars.forEach(({ name, critical }) => {
    if (process.env[name]) {
        const value = name.includes('KEY') || name.includes('SECRET') || name.includes('URL')
            ? '***' + process.env[name].slice(-4)
            : process.env[name];
        checks.passed.push(`✓ ${name}: ${value}`);
    } else {
        if (critical) {
            checks.errors.push(`✗ ${name} MANQUANTE (critique)`);
        } else {
            checks.warnings.push(`⚠ ${name} manquante (optionnel)`);
        }
    }
});

// 3. Vérification node_modules
console.log('\n📦 Vérification dépendances...');
const requiredDeps = [
    'express',
    'dotenv',
    'pg',
    'openai',
    'axios',
    'cors',
    'helmet',
    'express-validator',
    'express-rate-limit',
    'body-parser'
];

requiredDeps.forEach(dep => {
    try {
        require.resolve(dep);
        checks.passed.push(`✓ ${dep}`);
    } catch {
        checks.errors.push(`✗ ${dep} NON INSTALLÉ`);
    }
});

// 4. Test de syntaxe basique
console.log('\n🔍 Validation syntaxe modules...');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const modules = [
    { name: 'database', path: '../src/config/database' },
    { name: 'openai', path: '../src/config/openai' },
    { name: 'ai-service', path: '../src/ia/ai-service' },
    { name: 'content-filter', path: '../src/ia/content-filter' },
    { name: 'linkedin-prompts', path: '../src/ia/prompts/linkedin-prompts' }
];

modules.forEach(({ name, path: modulePath }) => {
    try {
        require(modulePath);
        checks.passed.push(`✓ ${name} syntaxe OK`);
    } catch (error) {
        checks.errors.push(`✗ ${name} ERREUR: ${error.message}`);
    }
});

// Affichage résumé
console.log('\n╔═══════════════════════════════════════════════╗');
console.log('║              RÉSULTATS DIAGNOSTIC             ║');
console.log('╚═══════════════════════════════════════════════╝\n');

if (checks.errors.length === 0 && checks.warnings.length === 0) {
    console.log('✅ TOUS LES TESTS SONT PASSÉS!\n');
    checks.passed.slice(0, 5).forEach(msg => console.log(`   ${msg}`));
    console.log(`   ... et ${checks.passed.length - 5} autres vérifications OK\n`);
    console.log('🚀 Le serveur est prêt à démarrer:');
    console.log('   node start-dev.js');
    console.log('   OU');
    console.log('   npm run dev\n');
} else {
    if (checks.errors.length > 0) {
        console.log('❌ ERREURS CRITIQUES:\n');
        checks.errors.forEach(msg => console.log(`   ${msg}`));
        console.log('');
    }
    
    if (checks.warnings.length > 0) {
        console.log('⚠️  AVERTISSEMENTS:\n');
        checks.warnings.forEach(msg => console.log(`   ${msg}`));
        console.log('');
    }
    
    if (checks.errors.length > 0) {
        console.log('💡 ACTIONS REQUISES:');
        console.log('   1. Exécute: npm install');
        console.log('   2. Vérifie le fichier .env');
        console.log('   3. Relance ce diagnostic\n');
        process.exit(1);
    }
}

console.log(`📊 Score: ${checks.passed.length} réussis | ${checks.warnings.length} warnings | ${checks.errors.length} erreurs`);
process.exit(checks.errors.length > 0 ? 1 : 0);
