@echo off
REM Script de test pour la nouvelle fonctionnalite de renvoi d'email
chcp 65001 >nul

echo 🧪 Test de la fonctionnalité de renvoi d'email de confirmation
echo ==============================================================
echo.

REM Configuration
set API_URL=http://localhost:3000
set TEST_EMAIL=test@example.com

echo 📡 Test 1: Vérification du serveur
echo -----------------------------------

curl -s -o nul -w "%%{http_code}" "%API_URL%/health" > temp_health.txt
set /p HEALTH_CODE=<temp_health.txt
del temp_health.txt

if "%HEALTH_CODE%"=="200" (
    echo ✅ Serveur opérationnel
) else (
    echo ❌ Serveur non disponible (code: %HEALTH_CODE%)
    echo 💡 Lancez le serveur avec: node start-dev.js
    exit /b 1
)

echo.
echo 📧 Test 2: Envoi de renvoi d'email
echo -----------------------------------

curl -s -X POST "%API_URL%/api/auth/resend-confirmation" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"%TEST_EMAIL%\"}" > temp_response.txt

type temp_response.txt
echo.

findstr /C:"success" /C:"true" temp_response.txt >nul
if %ERRORLEVEL%==0 (
    echo ✅ API fonctionnelle
) else (
    echo ❌ Erreur API
)

del temp_response.txt

echo.
echo 🌐 Test 3: Page d'erreur HTML
echo -----------------------------------

curl -s "%API_URL%/?test=1" > temp_html.txt

findstr /C:"resendEmail" temp_html.txt >nul
if %ERRORLEVEL%==0 (
    echo ✅ Page d'erreur contient la fonction de renvoi
) else (
    echo ❌ Page d'erreur incorrecte
)

del temp_html.txt

echo.
echo 📝 Test 4: Email vide (validation)
echo -----------------------------------

curl -s -X POST "%API_URL%/api/auth/resend-confirmation" ^
  -H "Content-Type: application/json" ^
  -d "{}" > temp_empty.txt

findstr /C:"Email requis" temp_empty.txt >nul
if %ERRORLEVEL%==0 (
    echo ✅ Validation fonctionnelle
) else (
    echo ⚠️  Validation à améliorer
)

del temp_empty.txt

echo.
echo ==============================================================
echo 🎉 Tests terminés !
echo.
echo 📚 Pour plus d'informations:
echo    - docs\probleme-email-expire.md
echo    - docs\CORRECTIF_EMAIL_EXPIRE.md
echo.

pause
