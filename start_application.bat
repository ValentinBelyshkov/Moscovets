@echo off
echo Starting Moskovets-3D Application...

REM Change to the backend directory
cd /d "%~dp0backend"

echo.
echo Initializing database...
python initialize_db.py
if %ERRORLEVEL% NEQ 0 (
    echo Error initializing database. Please check dependencies.
    pause
    exit /b 1
)

echo.
echo Starting backend server...
start "Backend Server" cmd /c "python -c \"import uvicorn; uvicorn.run('main:app', host='0.0.0.0', port=5001, reload=False)\""

timeout /t 5 /nobreak >nul

REM Change to the frontend directory
cd ../frontend

echo.
echo Installing frontend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error installing frontend dependencies.
    pause
    exit /b 1
)

echo.
echo Starting frontend server...
npm start

pause