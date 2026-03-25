@echo off
echo Debugging Support System...
cd /d "%~dp0"
echo.
echo This will test:
echo 1. Server connection
echo 2. Support endpoint authentication
echo 3. Login functionality  
echo 4. Support requests retrieval
echo.
node debug-support.js
pause
