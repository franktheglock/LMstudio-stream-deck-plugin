@echo off
REM Install plugin into Elgato Stream Deck Plugins folder
REM Copies plugin files to %APPDATA%\Elgato\StreamDeck\Plugins\com.custom.lmstudio.sdPlugin
setlocal enabledelayedexpansion

set "DEST=%APPDATA%\Elgato\StreamDeck\Plugins\com.custom.lmstudio.sdPlugin"
set "SRC=%~dp0"

echo Installing plugin from "%SRC%" to "%DEST%"

if not exist "%DEST%" (
  mkdir "%DEST%" 2>nul
)

rem Use robocopy for robust copying
robocopy "%SRC%" "%DEST%" /MIR /FFT /Z /W:2 /R:2 /NFL /NDL /NJH /NJS
set "RC=%ERRORLEVEL%"
if %RC% GEQ 8 (
  echo Robocopy reported error %RC% - copy may have failed
  exit /b %RC%
)

echo Plugin files copied successfully.

rem Restart Stream Deck if present
echo Restarting Stream Deck (if running)...

taskkill /F /IM "StreamDeck.exe" >nul 2>&1
timeout /t 2 /nobreak >nul

if exist "%ProgramFiles%\Elgato\StreamDeck\StreamDeck.exe" (
  start "" "%ProgramFiles%\Elgato\StreamDeck\StreamDeck.exe"
  echo Stream Deck restarted.
) else if exist "%ProgramFiles(x86)%\Elgato\StreamDeck\StreamDeck.exe" (
  start "" "%ProgramFiles(x86)%\Elgato\StreamDeck\StreamDeck.exe"
  echo Stream Deck restarted.
) else (
  echo Stream Deck executable not found; please restart it manually if needed.
)

endlocal
exit /b 0