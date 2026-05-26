@echo off
cd /d "%~dp0.."
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-port-8018.ps1"
call npm install
call npm run init
call npm run build
call npm run start
pause
