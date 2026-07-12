@echo off
title Delhi City Dashboard
cd /d "%~dp0"
set "PATH=C:\Users\USER\AppData\Local\Programs\nodejs\node-v24.18.0-win-x64;%PATH%"
echo.
echo   ============================================
echo    Delhi City Dashboard
echo   ============================================
echo.
echo   Starting the website (takes ~20-30 seconds)...
echo   KEEP THIS WINDOW OPEN while using the site.
echo   Your browser will open automatically when ready.
echo.
echo   To stop the website: just close this window.
echo.
rem Clear the build cache: closing this window kills the server abruptly,
rem which can corrupt it and make every page show "404" next time.
if exist .next rmdir /s /q .next 2>nul
start /b cmd /c "for /l %%i in (1,1,90) do (curl -s -o nul http://localhost:3000 && start "" http://localhost:3000 && exit || timeout /t 2 /nobreak >nul)"
npm.cmd run dev
echo.
echo   The website has stopped. You can close this window.
pause
