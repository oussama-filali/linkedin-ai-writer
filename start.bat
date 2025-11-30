@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ╔════════════════════════════════════════════════════════╗
echo ║      LinkedIn AI Writer - Démarrage Environnement      ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM ====== Racine du projet ======
set PROJECT_DIR=c:\wamp64\www\projet Perso\linkedin-ai-writer
set MOBILE_DIR=%PROJECT_DIR%\src\frontend\linkedin-ai-writer-mobile

echo [CHECK] Vérification présence de node_modules backend...
if not exist "%PROJECT_DIR%\node_modules" (
	echo [INSTALL] node_modules absent -> npm install
	pushd "%PROJECT_DIR%"
	call npm install || goto :error
	popd
) else (
	echo [OK] node_modules backend présent (skip install)
)
echo.

echo [CHECK] Vérification présence de node_modules mobile...
if not exist "%MOBILE_DIR%\node_modules" (
	echo [INSTALL] node_modules mobile absent -> npm install
	pushd "%MOBILE_DIR%"
	call npm install || goto :error
	popd
) else (
	echo [OK] node_modules mobile présent (skip install)
)
echo.

echo [START] Backend API...
start "Backend" cmd /k "cd /d %PROJECT_DIR% && npm run dev"
echo.
echo [START] Expo / Mobile...
start "Expo" cmd /k "cd /d %MOBILE_DIR% && npx expo start -c"
echo.

echo ╔══════════════════════════════════════════════╗
echo ║  Ouverture terminée. Surveillance en cours.  ║
echo ╚══════════════════════════════════════════════╝
echo.
echo Backend: http://localhost:3000
echo Expo LAN: Vérifiez l'IP dans app.json (apiBaseUrl)
echo.
echo Pour arrêter: Fermez les deux fenêtres (Backend / Expo)
echo.
goto :eof

:error
echo.
echo ❌ ERREUR lors de l'installation des dépendances. Vérifiez la sortie ci-dessus.
echo Appuyez sur une touche pour fermer.
pause
exit /b 1
