@echo off
chcp 65001 >nul
echo ╔═══════════════════════════════════════════╗
echo ║  LinkedIn AI Writer - Arrêt Complet      ║
echo ╚═══════════════════════════════════════════╝
echo.

echo 🛑 Arrêt de tous les processus Node.js...
echo.

taskkill /F /IM node.exe /T 2>nul

if %ERRORLEVEL% EQU 0 (
    echo ✅ Processus Node.js arrêtés
) else (
    echo ℹ️  Aucun processus Node.js actif
)

echo.
echo ✅ Nettoyage terminé
echo.
pause
