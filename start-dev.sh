#!/bin/bash

# Moskovets-3D Local Development Startup Script
# This script helps you start the backend and frontend services for local development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Moskovets-3D Local Development Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if backend dependencies are installed
echo -e "${YELLOW}Checking backend dependencies...${NC}"
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo -e "${RED}Backend dependencies not installed.${NC}"
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend && pip install -r requirements.txt && cd ..
    echo -e "${GREEN}✓ Backend dependencies installed${NC}\n"
else
    echo -e "${GREEN}✓ Backend dependencies OK${NC}\n"
fi

# Check if database exists
echo -e "${YELLOW}Checking database...${NC}"
if [ ! -f "backend/moskovets3d.db" ]; then
    echo -e "${RED}Database not found.${NC}"
    echo -e "${YELLOW}Creating database with admin user...${NC}"
    cd backend && python recreate_db.py && cd ..
    echo -e "${GREEN}✓ Database created (admin/admin123)${NC}\n"
else
    echo -e "${GREEN}✓ Database exists${NC}\n"
fi

# Check if frontend .env exists
echo -e "${YELLOW}Checking frontend configuration...${NC}"
if [ ! -f "frontend/.env" ]; then
    echo -e "${RED}Frontend .env file not found.${NC}"
    echo -e "${YELLOW}Creating frontend/.env...${NC}"
    cat > frontend/.env << 'EOL'
DISABLE_ESLINT_PLUGIN=true
ESLINT_NO_DEV_ERRORS=true
CI=false
GENERATE_SOURCEMAP=false
PORT=3001
REACT_APP_URL_API=http://localhost:5001
EOL
    echo -e "${GREEN}✓ Frontend .env created${NC}\n"
else
    echo -e "${GREEN}✓ Frontend .env exists${NC}\n"
fi

# Check if frontend dependencies are installed
echo -e "${YELLOW}Checking frontend dependencies...${NC}"
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${RED}Frontend dependencies not installed.${NC}"
    echo -e "${YELLOW}Installing frontend dependencies (this may take a few minutes)...${NC}"
    cd frontend && npm install && cd ..
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}\n"
else
    echo -e "${GREEN}✓ Frontend dependencies OK${NC}\n"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Starting Services${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}Services stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${YELLOW}Starting backend on http://localhost:5001${NC}"
cd backend
python main.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready${NC}\n"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ Backend failed to start. Check logs/backend.log${NC}"
        cleanup
    fi
done

# Start frontend
echo -e "${YELLOW}Starting frontend on http://localhost:3001${NC}"
cd frontend
npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Services Started Successfully!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Backend:${NC}  http://localhost:5001"
echo -e "${BLUE}API Docs:${NC} http://localhost:5001/docs"
echo -e "${BLUE}Frontend:${NC} http://localhost:3001"
echo -e "\n${BLUE}Default Login:${NC}"
echo -e "  Username: admin"
echo -e "  Password: admin123"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Create logs directory if it doesn't exist
mkdir -p logs

# Keep script running and show logs
tail -f logs/backend.log logs/frontend.log &
TAIL_PID=$!

wait
