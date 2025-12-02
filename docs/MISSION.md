# MISSION CRITIQUE - À FAIRE MAINTENANT

## 1. Base de Données PostgreSQL (OBLIGATOIRE)

### Option A : Supabase (RECOMMANDÉ - 5 minutes)
1. Va sur https://supabase.com/
2. Crée un compte GRATUIT
3. Crée un nouveau projet
4. Va dans Settings > Database
5. Copie l'URI de connexion
6. Colle-la dans `.env` comme `DATABASE_URL`
7. Exécute les migrations: `npm run db:migrate`

### Option B : ElephantSQL (Alternative)
1. Va sur https://www.elephantsql.com/
2. Crée un compte GRATUIT
3. Crée une instance "Tiny Turtle"
4. Copie l'URL dans `.env`

## 2. OpenAI API Key (OBLIGATOIRE)

1. Va sur https://platform.openai.com/api-keys
2. Crée une nouvelle clé API
3. Copie-la dans `.env` comme `OPENAI_API_KEY`

## 3. Google Fact Check API (OPTIONNEL)

1. Va sur https://console.cloud.google.com/
2. Crée un projet
3. Active "Fact Check Tools API"
4. Crée une clé API
5. Copie-la dans `.env`

## 4. Démarrer le serveur

```bash
node start-dev.js
```

## 5. Tester l'API

```bash
# Health check
curl http://localhost:3000/health

# Générer un post
curl -X POST http://localhost:3000/api/posts/generate \
  -H "Content-Type: application/json" \
  -d '{"resume":"Développeur","objectif":"Partager","ton":"professionnel"}'
```

---

**DEADLINE : 24H pour avoir l'API fonctionnelle.**

Pas d'excuses. Tu fais. Point.
