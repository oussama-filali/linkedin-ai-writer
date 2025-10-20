# LinkedIn AI Writer - Générateur Intelligent de Posts

## 🎯 Vision
Un outil puissant et intelligent pour générer des posts LinkedIn professionnels avec **fact-checking automatique** et vérification des sources. Construit avec une architecture robuste séparant clairement les responsabilités.

## 🏗️ Architecture

```
linkedin-ai-writer/
├── backend/                    # Serveur Express
│   ├── controllers/            # Logique métier
│   ├── services/               # Services réutilisables
│   ├── middlewares/            # Validation, auth, etc.
│   └── routes/                 # Définitions des routes API
├── ia/                         # Système IA & Fact-checking
│   ├── ai-service.js           # Service OpenAI principal
│   ├── prompts/                # Templates de prompts
│   └── fact-checking/          # Module de vérification
├── database/                   # Base de données
│   └── migrations/             # Scripts SQL de migration
├── config/                     # Configuration centralisée
├── frontend/                   # React + Tailwind (à venir)
└── public/                     # Assets statiques
```

## 🚀 Installation

### 1. Prérequis
- Node.js 18+
- PostgreSQL 14+ (gratuit: ElephantSQL ou Supabase)
- Clé API OpenAI

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
