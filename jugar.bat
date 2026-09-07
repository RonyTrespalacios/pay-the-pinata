@echo off
REM ==========================================================
REM  Abre el juego. Doble clic y ya.
REM
REM  Hace falta para desarrollo, no para jugar de verdad: esto
REM  construye el juego desde el codigo fuente cada vez. Si lo que
REM  quieres es la version repartible, usa empaquetar.bat y ejecuta el
REM  .exe que sale.
REM ==========================================================
setlocal
cd /d "%~dp0"

echo.
echo   PARTY TAB
echo   ---------
echo.

REM --- Los dos programas que hacen falta. Se comprueban por separado
REM     porque el mensaje util es distinto para cada uno. ---
call :comprobar node "Node.js" "https://nodejs.org" || goto :error
call :comprobar python "Python" "https://www.python.org/downloads/ (marca 'Add Python to PATH' al instalar)" || goto :error

REM --- Primera vez: bajar dependencias. Tarda unos minutos y se baja
REM     Electron entero, ~150 MB. Solo pasa una vez. ---
if not exist "node_modules" (
  echo   Primera vez aqui: instalando dependencias.
  echo   Tarda unos minutos y se baja Electron entero. Solo pasa una vez.
  echo.
  REM  `call` no es opcional: npm es un .cmd, y sin call este .bat se
  REM  termina cuando npm termina, sin llegar a las lineas de abajo.
  call npm install || goto :error
  echo.
)

echo   Construyendo y abriendo el juego...
echo.
call npm start || goto :error

REM  Salida limpia: si el juego se cerro bien, no hay nada que leer y la
REM  ventana no tiene por que quedarse esperando.
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
echo   Algo ha fallado. El motivo esta en las lineas de arriba.
echo   ------------------------------------------------------------
echo.
pause
exit /b 1
