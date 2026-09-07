@echo off
title BRAVO HRM Launcher
echo ==================================================
echo      DANG KHOI DONG BRAVO HRM SYSTEM
echo ==================================================

echo 0. Dang giai phong Port 5000 va 3000 (neu dang chay ngam)...
powershell -Command "Get-NetTCPConnection -LocalPort 5000,3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force -ErrorAction SilentlyContinue" 2>nul

echo 1. Dang khoi dong Backend REST API Server (Port 5000)...
start "BRAVO HRM Server (Port 5000)" cmd /k "cd /d %~dp0server && npm run dev"

echo 2. Dang khoi dong Frontend Client (Port 3000)...
start "BRAVO HRM Client (Port 3000)" cmd /k "cd /d %~dp0client && npm run dev"

echo 3. Dang cho Server va Client khoi tao... (3 giay)
timeout /t 3 /nobreak >nul

echo 4. Tu dong mo website tren trinh duyet...
start http://localhost:3000

echo ==================================================
echo Website dang chay tai:
echo  - Frontend Client: http://localhost:3000
echo  - Backend REST API: http://localhost:5000/api/health
echo ==================================================
pause


