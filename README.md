# Moskovets-3D - Dental 3D Analysis Platform

A comprehensive platform for dental 3D modeling, analysis, and patient management with cephalometry, photometry, CT analysis, and biometry features.

## 🚀 Quick Start

For local development, use the automated setup script:

```bash
./start-dev.sh
```

This will automatically:
- Install all dependencies
- Create the database
- Start both backend and frontend services

Then access the application at:
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5001
- **API Docs**: http://localhost:5001/docs
- **Login**: admin / admin123

## 📚 Documentation

### Getting Started
- **[QUICKSTART.md](QUICKSTART.md)** - One-page quick reference guide
- **[LOCAL_DEVELOPMENT_SETUP.md](LOCAL_DEVELOPMENT_SETUP.md)** - Detailed setup instructions

### Issue Resolution
- **[CORS_FIX_SUMMARY.md](CORS_FIX_SUMMARY.md)** - CORS issue analysis and resolution
- **[SOLUTION_SUMMARY.md](SOLUTION_SUMMARY.md)** - Complete solution overview

### Configuration
- **[frontend/.env.example](frontend/.env.example)** - Environment variable template

## 🏗️ Architecture

### Tech Stack
- **Backend**: FastAPI (Python) with SQLAlchemy, PostgreSQL/SQLite
- **Frontend**: React 19 with React Three Fiber, Three.js, vtk.js
- **3D Processing**: Assimp, Trimesh, NumPy, SciPy

### Project Structure
```
.
├── backend/           # FastAPI application
│   ├── app/          # Main application code
│   │   ├── api/      # API endpoints
│   │   ├── models/   # SQLAlchemy models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── crud/     # Database operations
│   │   ├── services/ # Business logic
│   │   └── core/     # Configuration
│   └── main.py       # Entry point
│
├── frontend/         # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API services
│   │   └── App.js       # Main component
│   └── package.json
│
└── start-dev.sh      # Development startup script
```

## 🛠️ Manual Setup

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python recreate_db.py
python main.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 🔧 Configuration

### Port Configuration
| Service | Port | Purpose |
|---------|------|---------|
| Backend | 5001 | FastAPI server |
| Frontend | 3001 | React dev server |

### Environment Variables

#### Frontend (.env)
```env
PORT=3001
REACT_APP_URL_API=http://localhost:5001
```

See `frontend/.env.example` for a complete template.

## 🎯 Features

### Core Modules
- **Patient Management** - Patient records, medical history, documents
- **Cephalometry** - TRG analysis (lateral/frontal)
- **Photometry** - Facial photo analysis
- **CT Analysis** - DICOM viewer and measurements
- **Biometry** - 3D model measurements and calibration
- **3D Modeling** - Mesh processing, occlusion pads, simulations

### Key Capabilities
- Multi-module data integration
- Medical card generation with comprehensive analysis
- Real-time 3D visualization
- File management (DICOM, STL, OBJ)
- Export to PDF and other formats

## 🐛 Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
1. Ensure the backend is running: `cd backend && python main.py`
2. Check frontend .env file exists with correct API URL
3. See [CORS_FIX_SUMMARY.md](CORS_FIX_SUMMARY.md) for detailed resolution

### Port Already in Use
```bash
# Kill process on port 5001 (backend)
lsof -ti:5001 | xargs kill -9

# Kill process on port 3001 (frontend)
lsof -ti:3001 | xargs kill -9
```

### Database Issues
Recreate the database:
```bash
cd backend && python recreate_db.py
```

## 📖 Additional Documentation

For more detailed information, see:
- [LOCAL_DEVELOPMENT_SETUP.md](LOCAL_DEVELOPMENT_SETUP.md) - Comprehensive setup guide
- [QUICKSTART.md](QUICKSTART.md) - Quick reference
- Backend API documentation: http://localhost:5001/docs (when running)

## 🚢 Deployment

### Docker
The project includes Docker configuration for production deployment:
```bash
docker-compose up -d
```

See `.env.docker` files for Docker-specific configuration.

## 🤝 Contributing

1. Follow existing code conventions
2. Update documentation for new features
3. Test both backend and frontend changes
4. Ensure all services start cleanly with `./start-dev.sh`

## 📝 License

[Add license information here]

## 👥 Team

[Add team information here]

---

**Need help?** Check [QUICKSTART.md](QUICKSTART.md) for common commands and troubleshooting, or [LOCAL_DEVELOPMENT_SETUP.md](LOCAL_DEVELOPMENT_SETUP.md) for detailed instructions.
