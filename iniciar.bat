@echo off
chcp 65001 > nul

rem Caminhos dos diretorios
set ROOT_PATH=%~dp0
set BACKEND_PATH=%~dp0backend
set FRONTEND_PATH=%~dp0frontend

echo Iniciando o Banco de Dados (PostgreSQL via Docker)...
cd /d "%ROOT_PATH%"
docker-compose up db -d
echo.

rem Funcao para instalar dependencias do Frontend (Node) e Backend (Go)
call :install_dependencies_frontend "%FRONTEND_PATH%"
call :install_dependencies_backend "%BACKEND_PATH%"

echo Iniciando o Backend e o Frontend...

rem Inicia o backend
start "Backend (Golang)" cmd.exe /k "cd /d %BACKEND_PATH% && go run cmd/api/main.go"

rem Inicia o frontend
start "Frontend (React)" cmd.exe /k "cd /d %FRONTEND_PATH% && npm run dev"

exit /b


:install_dependencies_frontend
set PATH_TO=%~1
if not exist "%PATH_TO%\node_modules" (
    echo Instalando dependencias em %PATH_TO%...
    if exist "%PATH_TO%\package.json" (
        cd /d "%PATH_TO%"
        npm install
    ) else (
        echo Erro: package.json nao encontrado em %PATH_TO%.
    )
)
exit /b

:install_dependencies_backend
set PATH_TO_BACK=%~1
echo Verificando dependencias do backend (Go)...
cd /d "%PATH_TO_BACK%"
go mod tidy
exit /b
