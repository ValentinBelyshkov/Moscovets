@echo off
echo Starting Moskovets-3D Backend Server...

REM Change to backend directory
cd /d "%~dp0"

echo.
echo Installing backend dependencies...
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo Error installing backend dependencies.
    echo Trying to install pydantic separately...
    pip install "pydantic>=1.10.0,<2.0.0" pydantic-settings
    if %ERRORLEVEL% NEQ 0 (
        echo Error installing pydantic. Please check your Python environment.
        pause
        exit /b 1
    )
)

echo.
echo Initializing database...
python initialize_db.py
if %ERRORLEVEL% NEQ 0 (
    echo Error initializing database.
    pause
    exit /b 1
)

echo.
echo Starting backend server on port 5001...
python -c "import uvicorn; uvicorn.run('main:app', host='0.0.0.0', port=5001, reload=False)"