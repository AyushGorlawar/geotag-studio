@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js is required. Install the LTS version from https://nodejs.org/
 pause
 exit /b 1
)
if not exist node_modules (
 echo Installing dependencies for the first run...
 call npm install
 if errorlevel 1 (
  echo Installation failed. Check your internet connection and try again.
  pause
  exit /b 1
 )
)
echo Starting GeoTag Studio...
start "" "http://localhost:5173"
call npm run dev
pause
