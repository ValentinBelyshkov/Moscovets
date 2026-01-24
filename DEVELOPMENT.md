# Moskovets-3D Development Guide

## Prerequisites

- Python 3.9+
- Node.js 14+
- npm or yarn

## Local Development Setup

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Initialize/recreate database (if needed):
```bash
python recreate_db.py
```

5. Start the backend server:
```bash
python main.py
```

Backend will be available at: http://localhost:8000
API documentation: http://localhost:8000/docs

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (if not exists):
```bash
echo "PORT=3001
REACT_APP_API_URL=http://localhost:8000
DISABLE_ESLINT_PLUGIN=true
ESLINT_NO_DEV_ERRORS=true
CI=false
GENERATE_SOURCEMAP=false" > .env
```

4. Start the development server:
```bash
npm start
```

Frontend will be available at: http://localhost:3001

## Default Credentials

**Admin User:**
- Username: `admin`
- Password: `admin123`

## API Testing

You can test the API using curl:

```bash
# Login to get access token
TOKEN=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Get list of patients
curl -X GET "http://localhost:8000/api/v1/patients/?skip=0&limit=100" \
  -H "Authorization: Bearer $TOKEN"

# Create a new patient
curl -X POST "http://localhost:8000/api/v1/patients/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Иванов Иван Иванович", "birth_date": "1990-05-15", "gender": "male", "contact_info": "+7 (999) 123-45-67"}'
```

## Common Issues

### 500 Internal Server Error on /api/v1/patients/

**Problem:** SQLite Date type only accepts Python date objects, not strings.

**Solution:** 
- Patient schema uses `@field_validator` to convert string dates to date objects
- CRUD operations use `model_dump()` instead of `jsonable_encoder()` to preserve Python types

### Port Already in Use

If port 3001 or 8000 is already in use:

**Frontend:**
Change PORT in `frontend/.env` file

**Backend:**
Modify port in `backend/main.py` (line 105)

## Database

The application uses SQLite for local development with database file: `backend/moskovets3d.db`

To reset the database:
```bash
cd backend
rm moskovets3d.db
python recreate_db.py
```

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/        # API endpoints
│   │   ├── crud/       # Database operations
│   │   ├── models/     # SQLAlchemy models
│   │   ├── schemas/    # Pydantic schemas
│   │   └── db/         # Database setup
│   └── main.py         # Application entry point
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── services/   # API services
│   │   └── App.js      # Main application
│   └── package.json
└── docker-compose.yml  # Docker setup
```
