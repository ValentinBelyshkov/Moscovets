# Docker Development Setup Guide

This document explains how to set up and use Docker containers for development with hot reloading capabilities.

## Overview

The development setup allows you to modify both frontend and backend code without rebuilding Docker containers. Changes to the source code are automatically reflected in the running containers.

## Prerequisites

- Docker Desktop installed
- Docker Compose v2.x or higher

## Configuration Changes Made

### 1. Backend Configuration

- Added multi-stage Dockerfile with `development` target
- Enabled `--reload` flag for uvicorn in development
- Updated volume mounts to map source code directly to container
- Changed working directory mapping from `/app/backend` to `/app`

### 2. Frontend Configuration

- Added multi-stage Dockerfile with `development` target
- Updated start script to use PORT=3630
- Added CHOKIDAR_USEPOLLING environment variable for better file watching
- Properly configured volume mounts to exclude node_modules

### 3. Docker Compose Configuration

- Created separate `docker-compose.dev.yml` for development
- Configured services to use development targets
- Set up proper networking between services
- Added file watching and hot reload configurations

## How to Run in Development Mode

### Option 1: Using the development compose file
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Option 2: Override the default compose file
```bash
docker-compose -f docker-compose.yml up --build
```

The development setup will:

1. Automatically rebuild and restart the backend when Python files change
2. Automatically refresh the frontend when JavaScript/React files change
3. Maintain persistent database data between runs
4. Map logs to local directories for inspection

## Volume Mappings

### Backend
- `./backend:/app` - Maps your local backend code to the container
- `./backend/logs:/app/logs` - Maps logs to your local directory

### Frontend
- `./frontend:/app` - Maps your local frontend code to the container
- `/app/node_modules` - Preserves node_modules inside the container

### Database
- `postgres_data` - Named volume to persist PostgreSQL data

## Troubleshooting

### Frontend Hot Reload Not Working
- Check that `CHOKIDAR_USEPOLLING=true` is set in the environment
- Make sure the volume mappings are correct
- Verify that the frontend is running on port 3630

### Backend Hot Reload Not Working
- Ensure `--reload` flag is used in the uvicorn command
- Check that the volume mapping maps to the correct directory
- Verify that file changes are detected by the container

### Connection Issues Between Services
- Make sure both services are on the same network (`app-network`)
- Use service names as hostnames (e.g., `backend:5001` from frontend)

## Environment Variables

The following environment variables are used in development:

- `NODE_ENV=development` - Tells Node.js to run in development mode
- `CHOKIDAR_USEPOLLING=true` - Enables file polling for hot reload on some systems
- `REACT_APP_URL_API` - Sets the backend API URL for the frontend
- `DATABASE_URL` - PostgreSQL connection string

## Production vs Development

For production deployment, use the original compose file without the `--reload` flags and with optimized builds:

```bash
docker-compose -f docker-compose.yml up --build
```

The production setup will use the `production` targets from the multi-stage Dockerfiles.

## Notes

- The `--reload` flag in uvicorn enables hot reloading for the backend
- React's development server handles hot reloading for the frontend
- Changes to package.json or requirements.txt may require a rebuild
- Node modules are installed inside the container to avoid compatibility issues