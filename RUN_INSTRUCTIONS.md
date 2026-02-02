# Moskovets-3D Application Setup Instructions

This document explains how to properly set up and run the Moskovets-3D application with both backend and frontend components.

## Prerequisites

- Python 3.9+
- Node.js 16+
- PostgreSQL (or Docker for containerized setup)

## Quick Start

### Option 1: Using Batch Scripts (Recommended for Windows)

1. Run the main application starter:
```bash
start_application.bat
```

This will:
- Initialize the database
- Start the backend server on port 5001
- Install frontend dependencies
- Start the frontend server on port 3630

### Option 2: Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. If you encounter pydantic errors, install a compatible version:
```bash
pip install "pydantic>=1.10.0,<2.0.0" pydantic-settings
```

4. Initialize the database:
```bash
python initialize_db.py
```

5. Start the backend server:
```bash
python start_backend.bat
# Or manually:
python -c "import uvicorn; uvicorn.run('main:app', host='0.0.0.0', port=5001, reload=False)"
```

The backend should now be running at `http://localhost:5001`

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend should now be running at `http://localhost:3630`

## Default Credentials

After initialization, you'll have the following default user:
- Username: `admin`
- Password: `admin` (for the seed data) or `admin123` (for init_db)

## Troubleshooting

### Common Issues:

1. **Backend not accessible (500 Internal Server Error)**:
   - Make sure the database is running and accessible
   - Run `python initialize_db.py` to ensure database tables are created
   - Check that the backend server is running on port 5001

2. **CORS errors**:
   - The backend is configured to allow requests from `http://localhost:3630`
   - Make sure the frontend is running on the correct port

3. **Authentication errors**:
   - Make sure to log in first using the default admin credentials
   - The `/patients` endpoint requires authentication

4. **Dependency issues**:
   - If you get pydantic-related errors, install a compatible version:
   ```bash
   pip install "pydantic>=1.10.0,<2.0.0"
   ```

## Docker Setup (Alternative)

If you prefer using Docker:

1. Make sure Docker and Docker Compose are installed
2. Run from the main project directory:
```bash
docker-compose up --build
```

This will start:
- Backend on port 5001
- Frontend on port 3630
- PostgreSQL database

## API Documentation

Once the backend is running, API documentation is available at:
- http://localhost:5001/docs
- http://localhost:5001/redoc

## Environment Variables

The application uses the following environment variables:

### Backend
- `DATABASE_URL`: PostgreSQL connection string
- `BACKEND_CORS_ORIGINS`: Allowed origins for CORS
- `SECRET_KEY`: Secret key for JWT tokens

### Frontend
- `REACT_APP_URL_API`: Backend API URL (set to `http://localhost:5001`)

## Development Notes

- The backend serves the API at `/api/v1/*`
- The frontend runs on port 3630 and connects to the backend at port 5001
- Authentication is required for most API endpoints
- Default admin user is created during database initialization