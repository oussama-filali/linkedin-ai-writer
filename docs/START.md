# 🚀 DÉMARRAGE RAPIDE - LinkedIn AI Writer

## TL;DR

Le serveur Express est prêt. Démarre-le:

```bash
node start-dev.js
```

ou

```bash
npm run dev
```

## Tests Disponibles

```bash
# 1. Diagnostic complet
node test/diagnostic.js

# 2. Test connexion DB
node test/check-migrations.js

# 3. Quick check
node test/quick-check.js
```

## Endpoints API

Une fois démarré:

```bash
# Health check
curl http://localhost:3000/health

# Générer un post
curl -X POST http://localhost:3000/api/posts/generate \
  -H "Content-Type: application/json" \
  -d '{"resume":"Expert IA","objectif":"Partager","ton":"professionnel"}'
```

## Variables d'environnement

Vérifiées et présentes dans `.env`:
- ✅ `DATABASE_URL` - Supabase PostgreSQL
- ✅ `OPENAI_API_KEY` - OpenAI GPT-3.5-turbo
- ✅ `GOOGLE_FACT_CHECK_API_KEY` - Google Fact Check API
- ✅ `PORT` - 3000
- ✅ `JWT_SECRET` - Pour auth future

## Prochaines étapes

1. ✅ Backend opérationnel → `node start-dev.js`
2. ⏳ Exécuter migrations DB → `npm run db:migrate`
3. ⏳ Tester endpoints
4. ⏳ Développer le frontend React

---

**Le serveur EST prêt. Lance maintenant!**
