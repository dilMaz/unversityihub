@echo off
echo Starting Backend Server...
cd /d "%~dp0"
echo Server will start on http://localhost:5000
echo Test endpoint: http://localhost:5000/api/test
echo Support endpoint: http://localhost:5000/api/support
node app.js
pause
