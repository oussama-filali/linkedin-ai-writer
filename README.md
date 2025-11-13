# LinkedIn AI Writer - Générateur Intelligent de Posts LinkedIn

 Génère des posts LinkedIn professionnels avec **fact-checking automatique**, prédictions de performance, et filtrage de contenu.

## ⚡ Démarrage Rapide (5 min)

```bash
# 1. Diagnostic du système
node test/diagnostic.js

# 2. Démarrer le serveur
node start-dev.js

# 3. Tester l'API
curl http://localhost:3000/health
```

## 📁 Structure du Projet

```
linkedin-ai-writer/
├── README.md ← TU ES ICI (doc publique)
├── .env (secrets - ignoré)
│
├── src/ ← CODE SOURCE
│   ├── backend/ (Express server)
│   ├── config/ (DB, OpenAI)
│   ├── ia/ (Predictive, Fact-checking)
│   └── database/ (migrations SQL)
│
├── test/ ← TESTS
│   ├── diagnostic.js
│   ├── check-migrations.js
│   └── quick-check.js
│
├── docs/ ← DOCUMENTATION
│   ├── START.md (démarrage)
│   ├── TESTING.md (tests)
│   ├── DATABASE.md (structure DB)
│   └── ... autres docs
│
├── scripts/ (migrate.js)
├── start-dev.js (serveur wrapper)
└── package.json
```

## 🎯 Fonctionnalités

- ✅ **Génération IA** : Posts LinkedIn via GPT-3.5-turbo
- ✅ **Fact-Checking** : Vérification automatique (Google + IA)
- ✅ **Prédictions** : Estime engagement, viralité, timing optimal
- ✅ **Filtre Contenu** : Bloque emojis, ASCII art, mentions IA
- ✅ **API RESTful** : Endpoints POST /generate, /analyze, /verify
- ✅ **Sécurité** : Rate limiting, CORS, Helmet

## 🚀 Installation

### 1. Variables d'Environnement

Copie `.env.example` → `.env` et configure:

```bash
DATABASE_URL=postgresql://...  # Supabase pooler
OPENAI_API_KEY=sk-proj-...     # OpenAI API
GOOGLE_FACT_CHECK_API_KEY=...  # Google Fact Check (optional)
```

### 2. Dépendances

```bash
npm install
```

### 3. Base de Données

```bash
npm run db:migrate
```

### 4. Démarrer

```bash
npm run dev
# OU
node start-dev.js
```

## 📡 Endpoints API

### Générer un Post

```bash
POST /api/posts/generate
{
  "resume": "Expert IA avec 5 ans exp",
  "objectif": "Partager expertise",
  "ton": "professionnel"
}
```

### Analyser Prédictions

```bash
POST /api/predictions/analyze
{
  "content": "Post LinkedIn texte...",
  "context": { "industry": "Tech" }
}
```

### Vérifier Fact-Check

```bash
POST /api/predictions/verify
{
  "content": "La France a 68M habitants..."
}
```

### Health Check

```bash
GET /health
```

## 📚 Documentation Complète

| Fichier | Contenu |
|---------|---------|
| `/docs/START.md` | Démarrage détaillé |
| `/docs/TESTING.md` | Scripts de test |
| `/docs/DATABASE.md` | Structure DB |
| `/docs/MISSION.md` | TODO critique |
| `/docs/CORRECTIFS.md` | Problèmes résolus |

## 🧪 Tests

```bash
# Diagnostic complet
node test/diagnostic.js

# Migrations check
node test/check-migrations.js

# DB connection
node test-db.js

# Quick check
node test/quick-check.js
```

## ✅ État du Projet

**Phase 1: Backend** ✅ COMPLÈTE
- Express server
- Routes API
- OpenAI intégration
- Fact-checking
- Prédictions

**Phase 2: Database** ⏳ EN COURS
- Migrations à exécuter
- Tables à créer
- Indexes optimisation

**Phase 3: Frontend** ⏸️ TODO
- React + Tailwind
- Dashboard
- Auth JWT

## 🔒 Sécurité

- ✅ .env avec secrets ignoré
- ✅ Rate limiting: 100 req/15min
- ✅ CORS configuré
- ✅ Helmet protection
- ✅ Validation des inputs

## 📦 Stack Technique

- **Runtime**: Node.js 18+
- **Framework**: Express 5.1.0
- **DB**: PostgreSQL (Supabase)
- **AI**: OpenAI GPT-3.5-turbo
- **API**: Google Fact Check
- **Sécurité**: Helmet, CORS, Rate Limit
- **Validation**: express-validator

## 🐛 Troubleshooting

**Serveur ne démarre pas?**
```bash
node test/diagnostic.js
```

**Erreur DB?**
```bash
npm run db:migrate
node test-db.js
```

**Erreur API?**
- Vérifie `.env` variables
- Teste `/health` endpoint

## 📝 Commandes Npm

```bash
npm run dev              # Démarrer serveur
npm run db:migrate       # Migrations SQL
npm start               # Démarrer (production)
npm install             # Dépendances
```

## 🎓 Architecture Decisions

- **Séparation Backend/Frontend** : Services IA, Controllers, Routes indépendants
- **Supabase Pooler** : IPv4 compatible, auto-scalable
- **Migrations versionnées** : Historique complet des DB changes
- **Health endpoint** : Diagnostic complet du système

## 📖 Documentation Locale

Tous les docs détaillés sont dans `/docs/` pour ne pas clutteriser le README publique.

---

**Prêt à démarrer?**

```bash
node test/diagnostic.js && node start-dev.js
```

**Besoin d'aide?** Voir `/docs/START.md`

### 2. Installation des dépendances
```bash
npm install
```

### 3. Configuration de l'environnement
Copier `.env.example` vers `.env` et remplir :
```bash
# Base de données PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/database

# OpenAI API Key
OPENAI_API_KEY=sk-proj-your-key

# Google Fact Check API (optionnel mais recommandé)
GOOGLE_FACT_CHECK_API_KEY=your-key
```

### 4. Configuration de la base de données

#### Option A : PostgreSQL local
```bash
# Créer la base de données
createdb linkedin_ai_writer

# Exécuter les migrations
npm run db:migrate
```

#### Option B : ElephantSQL (gratuit)
1. Créer un compte sur https://www.elephantsql.com/
2. Créer une nouvelle instance (plan Tiny Turtle - gratuit)
3. Copier l'URL de connexion dans `.env`

#### Option C : Supabase (gratuit)
1. Créer un projet sur https://supabase.com/
2. Aller dans Settings > Database
3. Copier l'URI de connexion dans `.env`
4. Exécuter le contenu de `database/migrations/001_initial_schema.sql` dans l'éditeur SQL Supabase

### 5. Démarrage
```bash
# Production
npm start

# Développement (avec auto-reload)
npm run dev
```

## 📡 API Endpoints

### Génération de Posts

#### POST `/api/posts/generate`
Génère un nouveau post LinkedIn avec fact-checking automatique.

**Body:**
```json
{
  "resume": "Expert en IA avec 10 ans d'expérience...",
  "objectif": "Partager mon expertise en IA",
  "ton": "professionnel",
  "sujet": "L'impact de l'IA sur le recrutement"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "post": "Le post généré...",
    "factCheck": {
      "safe": true,
      "warnings": [],
      "recommendations": [],
      "analysis": {...}
    },
    "createdAt": "2025-01-01T12:00:00Z"
  }
}
```

#### POST `/api/posts/improve`
Améliore un post existant basé sur un feedback.

**Body:**
```json
{
  "postId": 123,
  "feedback": "Rends-le plus inspirant et ajoute un CTA"
}
```

#### POST `/api/posts/check`
Vérifie le fact-checking d'un contenu personnalisé.

**Body:**
```json
{
  "content": "Ton contenu à vérifier..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "original": "...",
    "factCheck": {
      "safe": false,
      "warnings": ["Affirmation non vérifiée détectée"],
      "analysis": {...}
    },
    "improved": "Version améliorée si nécessaire"
  }
}
```

#### GET `/api/posts/history`
Récupère l'historique des posts générés.

**Query params:**
- `userId` (optionnel)
- `limit` (défaut: 20)
- `offset` (défaut: 0)

## 🧠 Système IA

### Modèle
- **GPT-3.5-Turbo** : Équilibre parfait entre qualité et coût (gratuit avec crédits initiaux)
- Fallback automatique avec retry logic
- Temperature optimisée par type de ton

### Prompt Engineering
Les prompts sont organisés par type de ton :
- **Professionnel** : Formel, structuré, axé expertise
- **Inspirant** : Storytelling, personnel, motivant
- **Engagé** : Opinionné, provoque réflexion

### Fact-Checking Intelligent
1. **Analyse automatique** : Détecte les affirmations factuelles
2. **Vérification Google** : Utilise l'API Fact Check (gratuite)
3. **Score de risque** : Évalue la fiabilité du contenu
4. **Suggestions d'amélioration** : Reformule les parties problématiques

## 🛡️ Sécurité

- **Helmet.js** : Protection contre vulnérabilités web communes
- **Rate Limiting** : 100 requêtes / 15 min par IP
- **CORS** : Configuration stricte
- **Input Validation** : Express-validator sur tous les endpoints
- **SQL Injection** : Requêtes paramétrées (pg)

## 📊 Base de Données

### Tables principales

#### `users`
- Authentification utilisateur (future)
- Profil LinkedIn

#### `generations_history`
- Historique complet des posts générés
- Résultats fact-checking en JSON
- Posts originaux + améliorés

#### `prompts_templates`
- Templates personnalisés par utilisateur
- Prompts par ton

## 🎨 Frontend (À venir)

Stack prévue :
- **React 18** : Interface utilisateur
- **Tailwind CSS** : Styling moderne
- **Zustand** : State management léger
- **React Query** : Gestion des requêtes API
- **React Hook Form** : Gestion des formulaires

## 📈 Prochaines Étapes

### Phase 1 : Configuration Base de Données ✅
- [x] Architecture clean
- [x] Services IA robustes
- [x] Fact-checking automatique
- [ ] **MAINTENANT : Configurer PostgreSQL et tester les API**

### Phase 2 : Frontend React (Jours 4-7)
- [ ] Setup Vite + React + Tailwind
- [ ] Interface de génération
- [ ] Historique et amélioration
- [ ] Visualisation fact-check

### Phase 3 : Authentification (Jours 8-10)
- [ ] JWT auth
- [ ] Profils utilisateurs
- [ ] Templates personnalisés

### Phase 4 : Déploiement (Jours 11-14)
- [ ] Tests automatisés
- [ ] CI/CD avec GitHub Actions
- [ ] Déploiement Render/Railway (gratuit)
- [ ] Documentation complète

## 🐛 Debugging

### Vérifier la configuration
```bash
curl http://localhost:3000/health
```

### Tester l'API
```bash
# Générer un post
curl -X POST http://localhost:3000/api/posts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "resume": "Développeur full-stack...",
    "objectif": "Partager mon expertise",
    "ton": "professionnel"
  }'
```

### Logs
Les erreurs sont loggées dans la console avec détails complets en mode `development`.

## 📝 Contribution

Architecture STRICT : **Séparation des responsabilités**
- Chaque fichier = une responsabilité claire
- Pas de code mixé entre backend/frontend/IA
- Validation systématique des inputs
- Gestion d'erreurs robuste

## 📄 License

ISC

---

**⚠️ IMPORTANT : Ce README sera ta référence. Suis-le étape par étape.**
