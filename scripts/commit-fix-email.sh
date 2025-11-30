#!/bin/bash

# Script pour commit les correctifs du problème d'email expiré

echo "📝 Préparation du commit pour les correctifs d'email expiré..."
echo ""

# Afficher les fichiers modifiés
echo "📁 Fichiers modifiés/créés :"
echo "  - src/backend/routes/auth.js"
echo "  - src/backend/controllers/auth-controller.js"
echo "  - src/backend/services/auth-service.js"
echo "  - src/backend/app.js"
echo "  - docs/probleme-email-expire.md (NOUVEAU)"
echo "  - docs/CORRECTIF_EMAIL_EXPIRE.md (NOUVEAU)"
echo "  - docs/RESOLU_EMAIL_EXPIRE.md (NOUVEAU)"
echo "  - docs/GUIDE_UTILISATION.md"
echo "  - scripts/test-resend-email.sh (NOUVEAU)"
echo "  - scripts/test-resend-email.bat (NOUVEAU)"
echo "  - RESOLU.md (NOUVEAU)"
echo ""

# Vérifier si Git est disponible
if ! command -v git &> /dev/null; then
    echo "❌ Git n'est pas installé"
    exit 1
fi

# Ajouter les fichiers
echo "➕ Ajout des fichiers au staging..."
git add src/backend/routes/auth.js
git add src/backend/controllers/auth-controller.js
git add src/backend/services/auth-service.js
git add src/backend/app.js
git add docs/probleme-email-expire.md
git add docs/CORRECTIF_EMAIL_EXPIRE.md
git add docs/RESOLU_EMAIL_EXPIRE.md
git add docs/GUIDE_UTILISATION.md
git add scripts/test-resend-email.sh
git add scripts/test-resend-email.bat
git add RESOLU.md

echo ""
echo "📊 Statut Git :"
git status --short

echo ""
echo "💬 Message de commit :"
echo "---"
cat << 'EOF'
🔧 Résolution du problème d'email de confirmation expiré

## Problème résolu
- Les liens de confirmation Supabase expiraient rapidement
- Les utilisateurs étaient bloqués sans solution

## Solutions implémentées
- ✅ Nouvelle route API : POST /api/auth/resend-confirmation
- ✅ Page web avec formulaire de renvoi d'email intégré
- ✅ Détection automatique des erreurs d'expiration
- ✅ Messages d'erreur clairs et explicites

## Fichiers modifiés
- Backend : routes, controllers, services, app.js
- Documentation : 3 nouveaux guides complets
- Scripts : tests automatiques (Bash + Windows)

## Tests
- ✅ API fonctionnelle
- ✅ Validation des entrées
- ✅ Interface utilisateur intuitive
- ✅ Scripts de test automatiques

## Impact
- Meilleure expérience utilisateur
- Moins d'abandons lors de l'inscription
- Support facilité

Refs #email-expired
EOF
echo "---"
echo ""

read -p "Voulez-vous commit ces changements ? (o/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[OoYy]$ ]]; then
    git commit -F - << 'EOF'
🔧 Résolution du problème d'email de confirmation expiré

## Problème résolu
- Les liens de confirmation Supabase expiraient rapidement
- Les utilisateurs étaient bloqués sans solution

## Solutions implémentées
- ✅ Nouvelle route API : POST /api/auth/resend-confirmation
- ✅ Page web avec formulaire de renvoi d'email intégré
- ✅ Détection automatique des erreurs d'expiration
- ✅ Messages d'erreur clairs et explicites

## Fichiers modifiés
- Backend : routes, controllers, services, app.js
- Documentation : 3 nouveaux guides complets
- Scripts : tests automatiques (Bash + Windows)

## Tests
- ✅ API fonctionnelle
- ✅ Validation des entrées
- ✅ Interface utilisateur intuitive
- ✅ Scripts de test automatiques

## Impact
- Meilleure expérience utilisateur
- Moins d'abandons lors de l'inscription
- Support facilité

Refs #email-expired
EOF
    
    echo ""
    echo "✅ Commit effectué avec succès !"
    echo ""
    echo "📤 Pour pousser vers le dépôt distant :"
    echo "   git push origin main"
    echo ""
else
    echo "❌ Commit annulé"
fi
