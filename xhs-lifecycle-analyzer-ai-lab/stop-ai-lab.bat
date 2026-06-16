@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo Stopping XHS AI analyzer backend...
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-ai-lab.ps1"
echo.
pause
endlocal
