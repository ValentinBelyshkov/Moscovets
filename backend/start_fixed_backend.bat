@echo off
echo Starting Moskovets-3D Backend Server with fixed configuration...

REM Change to backend directory
cd /d "%~dp0"

echo.
echo Installing backend dependencies with compatibility versions...
pip install fastapi==0.104.1 uvicorn==0.24.0 sqlalchemy==2.0.23 psycopg2-binary==2.9.9 alembic==1.13.1 pydantic==1.10.13 pydantic-settings==1.0.4 python-jose==3.3.0 passlib==1.7.4 python-multipart==0.0.6 bcrypt==4.0.1 email-validator==2.1.0 pyassimp==4.1.4 numpy>=1.26.0 trimesh>=4.0.5 scipy>=1.11.4 networkx>=3.2.1

if %ERRORLEVEL% NEQ 0 (
    echo Error installing backend dependencies.
    echo Trying to install with pip install --force-reinstall...
    pip install --force-reinstall fastapi==0.104.1 uvicorn==0.24.0 sqlalchemy==2.0.23 psycopg2-binary==2.9.9 alembic==1.13.1 pydantic==1.10.13 pydantic-settings==1.0.4 python-jose==3.3.0 passlib==1.7.4 python-multipart==0.0.6 bcrypt==4.0.1 email-validator==2.1.0 pyassimp==4.1.4 numpy>=1.26.0 trimesh>=4.0.5 scipy>=1.11.4 networkx>=3.2.1
    if %ERRORLEVEL% NEQ 0 (
        echo Critical error installing dependencies. Please check your Python environment.
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
echo Starting backend server on port 5001 with explicit configuration...
python -c "from app.main import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=5001, reload=False, log_level='info')"