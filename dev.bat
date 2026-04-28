@echo off
echo Iniciando ambiente de desenvolvimento...

echo [1/3] Subindo banco de dados (Docker)...
cd /d %~dp0
docker compose up db -d
if %errorlevel% neq 0 (
    echo ERRO: Falha ao iniciar o banco. Verifique se o Docker esta rodando.
    pause
    exit /b 1
)

echo [2/3] Aguardando banco ficar pronto...
timeout /t 3 /nobreak >nul

echo [3/3] Iniciando Backend e Frontend...
start "Backend - NestJS" cmd /k "cd /d %~dp0backend && npm run start:dev"
start "Frontend - Vite" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Backend:  http://localhost:3000/api/v1
echo Frontend: http://localhost:5173
echo.
pause
