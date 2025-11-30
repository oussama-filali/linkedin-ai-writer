# LinkedIn AI Writer

Générateur intelligent de posts LinkedIn avec fact-checking automatique.

## 🚀 Démarrage Rapide

### Backend

```bash
node start-dev.js
```

Le serveur démarre sur `http://localhost:3000`

### Frontend Mobile (React Native)

```bash
cd ../linkedin-ai-writer-mobile
npm start
```

## 📋 Fonctionnalités

- ✅ Génération de posts LinkedIn optimisés
- ✅ Fact-checking automatique
- ✅ Prédictions d'engagement
- ✅ Authentification Supabase + Google OAuth
- ✅ Historique des posts

## 🔧 Configuration

Copiez `.env.example` vers `.env` et configurez vos clés API.

## 📚 Documentation

Documentation complète disponible en local dans le dossier `docs/` (non publique).

## 🔑 API Routes

- `POST /api/auth/supabase` - Login Supabase
- `POST /api/auth/google` - Login Google
- `POST /api/auth/resend-confirmation` - Renvoyer email de confirmation
- `POST /api/posts/generate` - Générer un post
- `GET /api/posts/history` - Historique
- `GET /health` - Health check

## 🐛 Problèmes Courants

### Email de confirmation expiré

Si le lien Supabase expire :

1. Ouvrez le lien dans votre navigateur
2. Cliquez sur "Renvoyer l'email"
3. Entrez votre email

Ou via API :
```bash
curl -X POST http://localhost:3000/api/auth/resend-confirmation \
  -H "Content-Type: application/json" \
  -d '{"email": "votre@email.com"}'
```

## 📝 License

Privé - Tous droits réservés
