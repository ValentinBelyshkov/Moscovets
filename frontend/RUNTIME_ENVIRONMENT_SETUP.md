# Runtime Environment Configuration for Docker

## Problem
React environment variables (like `REACT_APP_URL_API`) are normally embedded at build time, which means they can't be changed when running in Docker containers. This caused issues when trying to configure the API URL dynamically.

## Solution
Implemented a runtime configuration system that allows environment variables to be set at container startup time.

## How it Works

### 1. Runtime Configuration File (`public/env-config.js`)
- A global `env-config.js` file is loaded before the React app
- Contains runtime configuration variables that can be overridden
- Provides fallback values when no environment variable is set

### 2. Updated Service Files
All service files now use a `getApiBaseUrl()` function that:
- First tries to read from `window._env_` (runtime configuration)
- Falls back to `process.env.REACT_APP_URL_API` (build-time configuration)
- Defaults to `'http://localhost:8000'` if neither is available

### 3. Docker Runtime Injection
- The `docker-entrypoint.sh` script runs when the container starts
- It generates `env-config.js` with actual environment variable values
- This allows configuring the API URL at runtime without rebuilding

### 4. Docker Compose Configuration
Updated to pass the correct environment variable to the frontend container:
```yaml
frontend:
  environment:
    - REACT_APP_URL_API=http://backend:5001  # Use service name for internal communication
```

## Usage

### Development
Environment variables still work as before using `.env` files:
```bash
# frontend/.env
REACT_APP_URL_API=http://localhost:5001
```

### Docker Deployment
Set the environment variable when running the container:
```bash
# Using docker-compose
REACT_APP_URL_API=http://your-backend-server:5001 docker-compose up

# Or in docker-compose.yml
environment:
  - REACT_APP_URL_API=http://backend:5001
```

### Testing Different URLs
You can also override the API URL by adding a query parameter:
```
http://your-app/?api_url=http://different-backend:5001
```

## Files Modified

1. **`public/env-config.js`** - Runtime configuration file
2. **`public/index.html`** - Loads the runtime config file
3. **Service files** - Updated to use runtime configuration:
   - `src/services/authService.js`
   - `src/services/modelingService.js`
   - `src/services/patientService.js`
   - `src/services/medicalRecordService.js`
   - `src/services/fileService.js`
4. **Component files** - Updated to use runtime configuration:
   - `src/components/MedicalHistory.js`
   - `src/components/patientcard/usePatientCardHandlers.js`
5. **`Dockerfile`** - Added runtime injection support
6. **`docker-entrypoint.sh`** - Script to inject environment variables at runtime
7. **`nginx.conf`** - Updated proxy configuration
8. **`docker-compose.yml`** - Updated environment variable configuration

## Benefits

- ✅ Environment variables can be configured at runtime in Docker
- ✅ Maintains backward compatibility with build-time configuration
- ✅ Supports both development and production environments
- ✅ Allows easy deployment to different environments without rebuilds
- ✅ Works with service discovery in Docker Compose networks