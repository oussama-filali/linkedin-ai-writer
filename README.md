# LinkIA_Writer

Générateur de posts LinkedIn **humains** et **fact-checkés**, basé sur une architecture en entonnoir : l'utilisateur choisit un type de post, l'IA génère une voix personnalisée et vérifiée.

---

## 🎯 Concept

L'utilisateur choisit un **type de post** → l'IA génère **un seul** post, dans une voix humaine (anti-cliché LinkedIn), **personnalisé** selon ses posts passés, **vérifié** (fact-check) et **sourcé** quand il y a une info factuelle.

```
TYPE (storytelling | performance | réponse | conseil)
   ↓
Stratégie + RAG (mémoire perso par utilisateur)
   ↓
Noyau de génération (gpt-4o) → 1 post
   ↓
Anti-bullshit (régénère si cliché) + Fact-check + Sources réelles + Hashtags
   ↓
Post final + créneau de rappel (notification)
```

---

## 🏗️ Architecture

| Couche | Techno | Hébergement |
|--------|--------|-------------|
| **App mobile** | Expo / React Native | `.apk` Android (EAS Build) |
| **Backend API** | Express / Node.js | Render (`https://linkedin-ai-writer.onrender.com`) |
| **Base + Auth + pgvector** | Supabase (Postgres) | Supabase Cloud |
| **IA** | OpenAI (gpt-4o, embeddings) | API OpenAI |

### Structure du dépôt
```
src/
├── backend/        API Express (routes, controllers, services, middlewares)
├── config/         openai.js, database.js
├── database/       migrations SQL (runner: npm run db:migrate)
├── ia/             cœur IA
│   ├── strategies/    registre des types de post (entonnoir)
│   ├── rag/           mémoire perso + cadre (pgvector)
│   ├── generation-core.js   noyau unifié
│   ├── hashtag-service.js   hashtags IA
│   ├── anti-bullshit-filter.js
│   └── fact-checking/  fact-checker + extraction de sources
└── frontend/linkedin-ai-writer-mobile/   app Expo
```

---

## 🚀 Démarrage (développement)

### Backend (API)
```bash
npm install
npm run dev          # nodemon sur src/backend/app.js (port 3000)
npm run db:migrate   # applique les migrations SQL
```

### Frontend mobile
```bash
cd src/frontend/linkedin-ai-writer-mobile
npm install
npx expo start --offline   # --offline évite l'erreur fetch des serveurs Expo
```
> L'app pointe **par défaut vers le backend Render en production** (voir `services/api-client.ts`).

---

## 📦 Build & déploiement

### Backend → Render
- Connecté à GitHub (branche `feat/funnel-architecture`).
- Build: `npm install` · Start: `npm start` · Root Directory: *(vide)*.
- Variables d'env à configurer sur Render (voir `.env`): `DATABASE_URL`, `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_ANON_KEY`, `JWT_SECRET`, `NODE_ENV=production`.

### App → .apk (EAS)
```bash
cd src/frontend/linkedin-ai-writer-mobile
eas build --platform android --profile preview   # produit un .apk partageable
eas update --branch preview                       # maj JS rapide (sans rebuild)
```
> **Modules natifs ajoutés** (expo-blur, expo-linear-gradient, expo-updates, etc.) → un **rebuild .apk** est requis. Un simple changement de code JS → `eas update` suffit.

Installer le `.apk` sur un émulateur :
```bash
adb install -r chemin/vers/app.apk
```

---

## 📋 Fonctionnalités

- ✅ Génération par **type de post** (entonnoir)
- ✅ Voix humaine **anti-cliché** (filtre + régénération)
- ✅ **RAG mémoire perso** par utilisateur (pgvector)
- ✅ **Fact-check** + **sources réelles** (Google Fact Check + Wikidata)
- ✅ **Hashtags** pertinents générés par IA
- ✅ **Rappel de publication** (notification, créneau au choix)
- ✅ Modifier / copier / partager un post
- ✅ **RGPD** : export et suppression des données
- ✅ Transparence **AI Act** (posts marqués générés par IA)
- ✅ Sécurité **RLS** sur toutes les tables Supabase

---

## 🔑 Principales routes API

| Route | Rôle |
|-------|------|
| `GET /api/posts/types` | Types de post (entonnoir) |
| `POST /api/posts/generate` | Générer un post |
| `POST /api/posts/improve` | Modifier un post |
| `GET /api/posts/history` | Historique |
| `GET /api/users/export` | RGPD — exporter ses données |
| `DELETE /api/users/me` | RGPD — supprimer son compte |
| `GET /health` | Santé (API + DB) |

---

## 📚 Documentation

- [docs/GUIDE_TESTEURS.md](docs/GUIDE_TESTEURS.md) — guide d'installation pour les testeurs Android.
- [docs/COUTS.md](docs/COUTS.md) — estimation des coûts (tokens, infra) par scénario.

---

## 📝 License

Privé — Tous droits réservés.
