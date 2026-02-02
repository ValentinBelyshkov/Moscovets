@echo off
echo Starting Moskovets-3D development environment...
echo.

echo Building and starting containers...
docker-compose -f docker-compose.dev.yml up --build

echo.
echo Development environment stopped.
pause