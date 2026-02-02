# Moskovets-3D Quick Start Guide

## 🚀 One-Line Setup & Start
```bash
./start-dev.sh
```
This handles everything: dependencies, database, and starts both services.

## 🔧 Manual Commands

### First Time Setup
```bash
# Backend
cd backend
pip install -r requirements.txt
python recreate_db.py

# Frontend
cd frontend
npm install
```

### Daily Development
```bash
# Terminal 1 - Backend (port 5001)
cd backend && python main.py

# Terminal 2 - Frontend (port 3001)  
cd frontend && npm start
```

## 🌐 Access Points
- **Frontend App**: http://localhost:3001
- **Backend API**: http://localhost:5001
- **API Docs**: http://localhost:5001/docs
- **Default Login**: admin / admin123

## 📝 Key Files
- `frontend/.env` - Frontend configuration (port, API URL)
- `backend/main.py` - Backend entry point
- `backend/moskovets3d.db` - SQLite database
- `LOCAL_DEVELOPMENT_SETUP.md` - Detailed setup guide

## 🐛 Troubleshooting

### CORS Error?
✅ **Solution**: Start the backend server
```bash
cd backend && python main.py
```

### Module Not Found?
✅ **Solution**: Install dependencies
```bash
cd backend && pip install -r requirements.txt
```

### Port Already in Use?
✅ **Solution**: Kill existing process
```bash
# Backend (port 5001)
lsof -ti:5001 | xargs kill -9

# Frontend (port 3001)
lsof -ti:3001 | xargs kill -9
```

### Database Issues?
✅ **Solution**: Recreate database
```bash
cd backend && python recreate_db.py
```

## 📚 More Help
- **Detailed Setup**: See `LOCAL_DEVELOPMENT_SETUP.md`
- **CORS Issues**: See `CORS_FIX_SUMMARY.md`
