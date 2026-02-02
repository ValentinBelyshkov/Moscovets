# Local Development Setup Guide

This guide will help you set up and run the Moskovets-3D application locally.

## Prerequisites

- Python 3.8+ (for backend)
- Node.js 14+ and npm (for frontend)
- PostgreSQL (optional, SQLite is used by default for local development)

## Architecture Overview

- **Backend**: FastAPI application running on port 5001
- **Frontend**: React SPA running on port 3001
- **API Proxy**: Frontend proxies `/api` requests to backend via `setupProxy.js`

## Step-by-Step Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Initialize/recreate database (creates SQLite database with admin user)
python recreate_db.py

# Start backend server (runs on http://localhost:5001)
python main.py
```

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`

### 2. Frontend Setup

The frontend requires a `.env` file for local development configuration.

```bash
# Navigate to frontend directory
cd frontend

# The .env file should already exist with these settings:
# DISABLE_ESLINT_PLUGIN=true
# ESLINT_NO_DEV_ERRORS=true
# CI=false
# GENERATE_SOURCEMAP=false
# PORT=3001
# REACT_APP_URL_API=http://localhost:5001

# Install dependencies (if not already installed)
npm install

# Start frontend dev server (runs on http://localhost:3001)
npm start
```

### 3. Verify Everything is Working

1. Backend health check: http://localhost:5001/health
2. Backend API docs: http://localhost:5001/docs
3. Frontend application: http://localhost:3001

## Common Issues and Solutions

### CORS Error: "No 'Access-Control-Allow-Origin' header"

**Symptoms:**
```
Access to fetch at 'http://localhost:5001/api/v1/patients/' from origin 'http://localhost:3630' 
has been blocked by CORS policy
```

**Root Causes:**
1. Backend server is not running
2. Frontend `.env` file is missing or misconfigured
3. Port mismatch between frontend proxy and backend server

**Solutions:**

1. **Check if backend is running:**
   ```bash
   curl http://localhost:5001/health
   ```
   If this fails, start the backend server:
   ```bash
   cd backend && python main.py
   ```

2. **Verify frontend .env file exists:**
   ```bash
   cat frontend/.env
   ```
   Should contain:
   ```
   REACT_APP_URL_API=http://localhost:5001
   PORT=3001
   ```

3. **Check frontend is using correct port:**
   The frontend should run on port 3001 (configured in `.env`)

4. **Verify CORS configuration:**
   Backend `main.py` already includes these origins:
   - http://localhost:3000
   - http://localhost:3001
   - http://localhost:3002
   - http://localhost:3630
   - http://localhost:5173
   - http://127.0.0.1:* (same ports)

### Backend "ModuleNotFoundError"

**Solution:** Install Python dependencies
```bash
cd backend && pip install -r requirements.txt
```

### Frontend Proxy Configuration Error

**Symptoms:**
```
REACT_APP_URL_API не настроен. Пожалуйста, установите переменную окружения REACT_APP_URL_API.
```

**Solution:** Create or update `frontend/.env` file with:
```
REACT_APP_URL_API=http://localhost:5001
```

## Port Configuration Summary

| Service | Port | Configuration File |
|---------|------|-------------------|
| Backend API | 5001 | `backend/main.py` (line 107) |
| Frontend Dev Server | 3001 | `frontend/.env` (PORT=3001) |
| Frontend API Proxy | → 5001 | `frontend/src/setupProxy.js` (uses REACT_APP_URL_API) |

## Database Configuration

### Default (SQLite - Local Development)
- Database file: `backend/moskovets3d.db`
- Automatic creation via `recreate_db.py`
- Includes admin user by default

### Production (PostgreSQL)
- Configure via environment variables or `backend/app/core/config.py`
- Default connection string: `postgresql://moskovets3d:moskovets3d@localhost:5432/moskovets3d`

## Development Workflow

1. Start backend: `cd backend && python main.py`
2. In a new terminal, start frontend: `cd frontend && npm start`
3. Open browser to http://localhost:3001
4. Login with admin/admin123

## Additional Notes

- Backend logs are written to `backend/logs/app.log`
- Frontend proxy only works in development mode (not in production build)
- For production deployment, use Docker Compose (see docker-compose.yml)
