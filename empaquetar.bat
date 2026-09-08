@echo off
REM ==========================================================
REM  Genera el ejecutable de Windows.
REM
REM      empaquetar.bat              -> release\win-unpacked\   (para Steam)
REM      empaquetar.bat instalador   -> release\*.exe           (instalador)
REM
REM  La opcion por defecto es la carpeta, no el instalador, porque lo que
REM  sube un deposito de Steam es una carpeta con el juego dentro: de
REM  instalar, parchear y lanzar ya se encarga Steam. El instalador es
REM  para repartir por fuera (prensa, demos, itch.io).
REM ==========================================================
setlocal
cd /d "%~dp0"

echo.
echo   PAY THE PINATA - empaquetado
echo   -----------------------
echo.

call :comprobar node "Node.js" "https://nodejs.org" || goto :error
call :comprobar python "Python" "https://www.python.org/downloads/ (marca 'Add Python to PATH' al instalar)" || goto :error

if not exist "node_modules" (
  echo   Primera vez aqui: instalando dependencias.
  echo   Tarda unos minutos y se baja Electron entero. Solo pasa una vez.
  echo.
  call npm install || goto :error
  echo.
)

REM --- Que se construye. /i para que "Instalador" y "instalador" valgan igual. ---
if /i "%~1"=="instalador" (
  set "TAREA=dist:installer"
  set "SALIDA=release"
  echo   Construyendo el INSTALADOR.
) else (
  set "TAREA=dist:win"
  set "SALIDA=release\win-unpacked"
  echo   Construyendo la CARPETA para Steam.
  echo   ^(para un instalador: empaquetar.bat instalador^)
)
echo.
echo   Esto tarda. Son ~380 MB de Chromium.
echo.

call npm run %TAREA% || goto :error

echo.
echo   ------------------------------------------------------------
echo   Listo.
echo   %CD%\%SALIDA%
echo   ------------------------------------------------------------
echo.
echo   AVISO: si arriba pone "BUILD SIN STEAM", este ejecutable arranca
echo   y se juega, pero NO tiene logros, ni Steam Cloud, ni overlay, y
REM  Los dos ficheros que faltan se explican enteros en el README.
echo   NO debe subirse al deposito de la tienda. Para eso hacen falta
echo   steam_api64.dll del SDK de Steamworks y el appid real.
echo.

REM  Abre la carpeta en el explorador: casi siempre lo siguiente que se
REM  quiere hacer es mirar lo que ha salido o copiarlo a otro sitio.
if exist "%SALIDA%" start "" explorer "%CD%\%SALIDA%"

pause
exit /b 0


REM ==========================================================
REM  Subrutinas
REM ==========================================================

REM  %1 comando  %2 nombre para el humano  %3 donde conseguirlo
REM
REM  Sale por el camino corto en vez de meter los echo en un bloque
REM  if ( ... ). No es estilo: cmd expande %~3 ANTES de emparejar los
REM  parentesis, asi que un ) dentro del texto de ayuda cierra el bloque a
REM  media frase y el exit /b 1 pasa a ejecutarse siempre. Es decir: la
REM  comprobacion daba "FALTA Python" con Python instalado, solo porque el
REM  mensaje llevaba un parentesis. Sin bloque no hay nada que romper.
:comprobar
%~1 --version >nul 2>nul
if not errorlevel 1 exit /b 0
echo   FALTA %~2.
echo   Instalalo desde: %~3
echo.
exit /b 1

:error
echo.
echo   ------------------------------------------------------------
echo   El empaquetado ha fallado. El motivo esta en las lineas de arriba.
echo   ------------------------------------------------------------
echo.
pause
exit /b 1
