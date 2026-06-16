@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo Starting XHS AI analyzer...
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-ai-lab.ps1"
set "ERR=%ERRORLEVEL%"
if not "%ERR%"=="0" (
  echo.
  echo Startup failed. Please read the PowerShell error message above.
  pause
  exit /b %ERR%
)
endlocal
