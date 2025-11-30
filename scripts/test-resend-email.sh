#!/bin/bash
# Script de test pour la nouvelle fonctionnalité de renvoi d'email

echo "🧪 Test de la fonctionnalité de renvoi d'email de confirmation"
echo "=============================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3000"
TEST_EMAIL="test@example.com"

echo "📡 Test 1: Vérification du serveur"
echo "-----------------------------------"
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")

if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ Serveur opérationnel${NC}"
else
    echo -e "${RED}❌ Serveur non disponible (code: $HEALTH_CHECK)${NC}"
    echo -e "${YELLOW}💡 Lancez le serveur avec: node start-dev.js${NC}"
    exit 1
fi

echo ""
echo "📧 Test 2: Envoi de renvoi d'email"
echo "-----------------------------------"

RESPONSE=$(curl -s -X POST "$API_URL/api/auth/resend-confirmation" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_EMAIL\"}")

echo "Réponse: $RESPONSE"

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo -e "${GREEN}✅ API fonctionnelle${NC}"
else
    echo -e "${RED}❌ Erreur API${NC}"
fi

echo ""
echo "🌐 Test 3: Page d'erreur HTML"
echo "-----------------------------------"

HTML_RESPONSE=$(curl -s "$API_URL/?test=1")

if echo "$HTML_RESPONSE" | grep -q "resendEmail"; then
    echo -e "${GREEN}✅ Page d'erreur contient la fonction de renvoi${NC}"
else
    echo -e "${RED}❌ Page d'erreur incorrecte${NC}"
fi

echo ""
echo "📝 Test 4: Email vide (validation)"
echo "-----------------------------------"

EMPTY_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/resend-confirmation" \
  -H "Content-Type: application/json" \
  -d "{}")

if echo "$EMPTY_RESPONSE" | grep -q "Email requis"; then
    echo -e "${GREEN}✅ Validation fonctionnelle${NC}"
else
    echo -e "${YELLOW}⚠️  Validation à améliorer${NC}"
fi

echo ""
echo "=============================================================="
echo -e "${GREEN}🎉 Tests terminés !${NC}"
echo ""
echo "📚 Pour plus d'informations:"
echo "   - docs/probleme-email-expire.md"
echo "   - docs/CORRECTIF_EMAIL_EXPIRE.md"
echo ""
