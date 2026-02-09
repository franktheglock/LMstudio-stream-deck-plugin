@echo off
REM Install plugin into HotSpot StreamDock Plugins folder
REM Copies plugin files to %APPDATA%\HotSpot\StreamDock\plugins\com.custom.lmstudio.sdPlugin
setlocal enabledelayedexpansion

set "DEST=%APPDATA%\HotSpot\StreamDock\plugins\com.custom.lmstudio.sdPlugin"
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

rem Restart StreamDock if present
echo Restarting StreamDock (if running)...

taskkill /F /IM "StreamDock.exe" >nul 2>&1
taskkill /F /IM "StreamDockApp.exe" >nul 2>&1
timeout /t 2 /nobreak >nul

if exist "%ProgramFiles%\HotSpot\StreamDock\StreamDock.exe" (
  start "" "%ProgramFiles%\HotSpot\StreamDock\StreamDock.exe"
  echo StreamDock restarted.
) else if exist "%ProgramFiles(x86)%\HotSpot\StreamDock\StreamDock.exe" (
  start "" "%ProgramFiles(x86)%\HotSpot\StreamDock\StreamDock.exe"
  echo StreamDock restarted.
) else if exist "%LOCALAPPDATA%\HotSpot\StreamDock\StreamDock.exe" (
  start "" "%LOCALAPPDATA%\HotSpot\StreamDock\StreamDock.exe"
  echo StreamDock restarted.
) else if exist "%APPDATA%\HotSpot\StreamDock\StreamDock.exe" (
  start "" "%APPDATA%\HotSpot\StreamDock\StreamDock.exe"
  echo StreamDock restarted.
) else (
  echo StreamDock executable not found; please restart it manually if needed.
)

endlocal
exit /b 0
