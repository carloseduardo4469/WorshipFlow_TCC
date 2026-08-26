@echo off
setlocal

set "PROJECT_DIR=%~dp0"
set "NODE_DIR=%PROJECT_DIR%node-portable"
set "PATH=%NODE_DIR%;%PATH%"

if not exist "%NODE_DIR%\node.exe" (
  echo Node.js portatil nao encontrado em "%NODE_DIR%".
  exit /b 1
)

echo Node.js:
node.exe --version
echo npm:
call npm.cmd --version

echo.
echo Instalando dependencias do package-lock.json...
call npm.cmd ci
if errorlevel 1 (
  echo.
  echo Falha na instalacao das dependencias.
  exit /b 1
)

echo.
echo Instalacao concluida. Para iniciar o projeto, use:
echo   set "PATH=%NODE_DIR%;%%PATH%%"
echo   npm.cmd run dev
endlocal