@echo off
chcp 65001 >nul
REM Script pour commit les correctifs du problème d'email expiré

echo 📝 Préparation du commit pour les correctifs d'email expiré...
echo.

echo 📁 Fichiers modifiés/créés :
echo   - src\backend\routes\auth.js
echo   - src\backend\controllers\auth-controller.js
echo   - src\backend\services\auth-service.js
echo   - src\backend\app.js
echo   - docs\probleme-email-expire.md (NOUVEAU)
echo   - docs\CORRECTIF_EMAIL_EXPIRE.md (NOUVEAU)
echo   - docs\RESOLU_EMAIL_EXPIRE.md (NOUVEAU)
echo   - docs\GUIDE_UTILISATION.md
echo   - scripts\test-resend-email.sh (NOUVEAU)
echo   - scripts\test-resend-email.bat (NOUVEAU)
echo   - RESOLU.md (NOUVEAU)
echo.

REM Vérifier si Git est disponible
git --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git n'est pas installé
    pause
    exit /b 1
)

echo ➕ Ajout des fichiers au staging...
git add src\backend\routes\auth.js
git add src\backend\controllers\auth-controller.js
git add src\backend\services\auth-service.js
git add src\backend\app.js
git add docs\probleme-email-expire.md
git add docs\CORRECTIF_EMAIL_EXPIRE.md
git add docs\RESOLU_EMAIL_EXPIRE.md
git add docs\GUIDE_UTILISATION.md
git add scripts\test-resend-email.sh
git add scripts\test-resend-email.bat
git add RESOLU.md

echo.
echo 📊 Statut Git :
git status --short

echo.
echo 💬 Message de commit :
echo ---
echo 🔧 Résolution du problème d'email de confirmation expiré
echo.
echo ## Problème résolu
echo - Les liens de confirmation Supabase expiraient rapidement
echo - Les utilisateurs étaient bloqués sans solution
echo.
echo ## Solutions implémentées
echo - ✅ Nouvelle route API : POST /api/auth/resend-confirmation
echo - ✅ Page web avec formulaire de renvoi d'email intégré
echo - ✅ Détection automatique des erreurs d'expiration
echo - ✅ Messages d'erreur clairs et explicites
echo.
echo ## Fichiers modifiés
echo - Backend : routes, controllers, services, app.js
echo - Documentation : 3 nouveaux guides complets
echo - Scripts : tests automatiques (Bash + Windows)
echo.
echo ## Tests
echo - ✅ API fonctionnelle
echo - ✅ Validation des entrées
echo - ✅ Interface utilisateur intuitive
echo - ✅ Scripts de test automatiques
echo.
echo ## Impact
echo - Meilleure expérience utilisateur
echo - Moins d'abandons lors de l'inscription
echo - Support facilité
echo.
echo Refs #email-expired
echo ---
echo.

set /p CONFIRM="Voulez-vous commit ces changements ? (o/N) : "
if /I "%CONFIRM%"=="o" goto COMMIT
if /I "%CONFIRM%"=="O" goto COMMIT
if /I "%CONFIRM%"=="y" goto COMMIT
if /I "%CONFIRM%"=="Y" goto COMMIT

echo ❌ Commit annulé
pause
exit /b 0

:COMMIT
REM Créer le message de commit dans un fichier temporaire
echo 🔧 Résolution du problème d'email de confirmation expiré > commit_msg.tmp
echo. >> commit_msg.tmp
echo ## Problème résolu >> commit_msg.tmp
echo - Les liens de confirmation Supabase expiraient rapidement >> commit_msg.tmp
echo - Les utilisateurs étaient bloqués sans solution >> commit_msg.tmp
echo. >> commit_msg.tmp
echo ## Solutions implémentées >> commit_msg.tmp
echo - ✅ Nouvelle route API : POST /api/auth/resend-confirmation >> commit_msg.tmp
echo - ✅ Page web avec formulaire de renvoi d'email intégré >> commit_msg.tmp
echo - ✅ Détection automatique des erreurs d'expiration >> commit_msg.tmp
echo - ✅ Messages d'erreur clairs et explicites >> commit_msg.tmp
echo. >> commit_msg.tmp
echo ## Fichiers modifiés >> commit_msg.tmp
echo - Backend : routes, controllers, services, app.js >> commit_msg.tmp
echo - Documentation : 3 nouveaux guides complets >> commit_msg.tmp
echo - Scripts : tests automatiques (Bash + Windows) >> commit_msg.tmp
echo. >> commit_msg.tmp
echo ## Tests >> commit_msg.tmp
echo - ✅ API fonctionnelle >> commit_msg.tmp
echo - ✅ Validation des entrées >> commit_msg.tmp
echo - ✅ Interface utilisateur intuitive >> commit_msg.tmp
echo - ✅ Scripts de test automatiques >> commit_msg.tmp
echo. >> commit_msg.tmp
echo ## Impact >> commit_msg.tmp
echo - Meilleure expérience utilisateur >> commit_msg.tmp
echo - Moins d'abandons lors de l'inscription >> commit_msg.tmp
echo - Support facilité >> commit_msg.tmp
echo. >> commit_msg.tmp
echo Refs #email-expired >> commit_msg.tmp

git commit -F commit_msg.tmp

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Commit effectué avec succès !
    echo.
    echo 📤 Pour pousser vers le dépôt distant :
    echo    git push origin main
    echo.
) else (
    echo ❌ Erreur lors du commit
)

del commit_msg.tmp
pause
