@echo off
title Delhi City Dashboard
cd /d "%~dp0"
set "PATH=%LOCALAPPDATA%\Programs\nodejs\node-v24.18.0-win-x64;%PATH%"
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

rem Stop any earlier copy of the site still running on port 3000 — a stale
rem server holds the build folder locked and causes "Access is denied".
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

rem Fresh build cache each start (it lives under node_modules\.cache, which
rem OneDrive never syncs, so sync locking can't corrupt it).
if exist "node_modules\.cache\next-dist" rmdir /s /q "node_modules\.cache\next-dist" 2>nul
if exist .next rmdir /s /q .next 2>nul

start /b cmd /c "for /l %%i in (1,1,90) do (curl -s -o nul http://localhost:3000 && start "" http://localhost:3000 && exit || timeout /t 2 /nobreak >nul)"
npm.cmd run dev
echo.
echo   The website has stopped. You can close this window.
pause
