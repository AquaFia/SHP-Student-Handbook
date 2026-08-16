@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
  start "Aria Local Server" cmd /k "cd /d ""%~dp0"" && py aria_local_server.py"
  timeout /t 2 /nobreak >nul
  start "" "http://localhost:8877/aria_framework.html"
  exit /b 0
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "Aria Local Server" cmd /k "cd /d ""%~dp0"" && python aria_local_server.py"
  timeout /t 2 /nobreak >nul
  start "" "http://localhost:8877/aria_framework.html"
  exit /b 0
)
echo Python was not found.
echo Install Python, or use GitHub Pages. GitHub Pages will download a repository bundle automatically after activation because deployed sites cannot write repository files.
pause
exit /b 1
