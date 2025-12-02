# 🗄️ Guide des Migrations - LinkedIn AI Writer

Voir le fichier complet dans la version précédente. Résumé:

## Tables Créées
- users
- generations_history
- prompts_templates
- predictions_analytics
- fact_checks_detailed
- post_variants_comparison
- posting_timing_analysis

## Commandes

```bash
# Vérifier l'état des migrations
node test/check-migrations.js

# Exécuter les migrations
npm run db:migrate

# Vérifier après migration
node test-db.js
```

## Workflow

1. Vérif: `node test/check-migrations.js`
2. Exécute: `npm run db:migrate`
3. Valide: `node test-db.js`

Consulte la documentation complète pour les détails des tables et index.
