@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo Running XHS AI analyzer diagnostics...
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-ai-lab.ps1" -DiagnoseOnly
echo.
echo Diagnostics finished. If something still fails, send a screenshot of this window.
pause
endlocal
