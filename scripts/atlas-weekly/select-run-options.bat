@echo off
setlocal EnableExtensions DisableDelayedExpansion

:writer_menu
set "writer="
echo.
echo 1. Codex
echo 2. Cursor
echo 3. No external writer
"%SystemRoot%\System32\choice.exe" /c 123 /n /m "Select a writer [1-3]: "
set "selection=%ERRORLEVEL%"
if "%selection%"=="1" set "writer=codex"
if "%selection%"=="2" set "writer=cursor"
if "%selection%"=="3" set "writer=none"
if not defined writer goto cancelled

echo.
echo 1. Normal weekly
echo 2. Explicit rerun
echo 3. Back
"%SystemRoot%\System32\choice.exe" /c 123 /n /m "Select a run mode [1-3]: "
set "selection=%ERRORLEVEL%"
set "weeklyArgs="
if "%selection%"=="1" goto check_writer
if "%selection%"=="2" goto rerun
if "%selection%"=="3" goto writer_menu
goto cancelled

:rerun
set "weeklyArgs=-- --rerun"

:check_writer
if "%writer%"=="codex" goto codex
if "%writer%"=="cursor" goto cursor
goto selected

:codex
"%SystemRoot%\System32\where.exe" /q $PATH:codex.exe
if not errorlevel 1 goto selected
"%SystemRoot%\System32\where.exe" /q $PATH:codex.ps1
if not errorlevel 1 goto selected
echo Codex CLI was not found on PATH. Install it or add it to PATH and retry.
exit /b 1

:cursor
"%SystemRoot%\System32\where.exe" /q $PATH:agent
if not errorlevel 1 goto selected
echo Cursor Agent CLI ^(agent^) was not found on PATH. Install it or add it to PATH and retry.
exit /b 1

:selected
endlocal & set "ATLAS_WRITER=%writer%" & set "ATLAS_WEEKLY_ARGS=%weeklyArgs%" & exit /b 0

:cancelled
echo Atlas Weekly selection cancelled or unavailable.
exit /b 1
