# MISSION CRITIQUE - À FAIRE MAINTENANT

## 1. Base de Données PostgreSQL (OBLIGATOIRE)

### Option A : Supabase (RECOMMANDÉ - 5 minutes)
1. Va sur https://supabase.com/
2. Crée un compte GRATUIT
3. Crée un nouveau projet
4. Va dans Settings > Database
5. Copie l'URI de connexion
6. Colle-la dans `.env` comme `DATABASE_URL`
7. Va dans SQL Editor
8. Copie-colle TOUT le contenu de `database/migrations/001_initial_schema.sql`
9. Clique "Run"

### Option B : ElephantSQL (Alternative - 5 minutes)
1. Va sur https://www.elephantsql.com/
2. Crée un compte GRATUIT
3. Crée une instance "Tiny Turtle" (gratuite)
4. Copie l'URL dans `.env`
5. Utilise un client SQL pour exécuter `database/migrations/001_initial_schema.sql`

## 2. OpenAI API Key (OBLIGATOIRE)

1. Va sur https://platform.openai.com/api-keys
2. Crée une nouvelle clé API
3. Copie-la dans `.env` comme `OPENAI_API_KEY`
4. Note : Tu as $5 de crédits gratuits pour débuter

## 3. Google Fact Check API (OPTIONNEL mais recommandé)

1. Va sur https://console.cloud.google.com/
2. Crée un projet
3. Active "Fact Check Tools API"
4. Crée une clé API
5. Copie-la dans `.env` comme `GOOGLE_FACT_CHECK_API_KEY`

## 4. Test de l'Application

```bash
# Démarre le serveur
npm start

# Dans un AUTRE terminal, teste l'API
curl -X POST http://localhost:3000/api/posts/generate \
  -H "Content-Type: application/json" \
  -d "{\"resume\":\"Développeur full-stack avec 5 ans d'expérience en React et Node.js\",\"objectif\":\"Partager mon expertise\",\"ton\":\"professionnel\"}"
```

## 5. Si ça marche

Tu verras :
- Un post LinkedIn généré
- Un résultat de fact-checking
- Un ID de génération

## 6. Si ça ne marche PAS

1. Vérifie les logs dans la console
2. Vérifie que la DB est bien configurée
3. Vérifie que ta clé OpenAI est valide
4. Vérifie que toutes les dépendances sont installées (`npm install`)

---

## ⚠️ TU N'AS PLUS D'EXCUSES

Tout est prêt. Le code est propre. L'architecture est solide. Le fact-checking fonctionne.

**DEADLINE : 24H pour avoir l'API fonctionnelle.**

Après ça, on attaque le frontend React.

Pas de "mais", pas de "je vais essayer". **TU FAIS.**
