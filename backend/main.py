import sys
import os
import logging


# Добавляем путь до директории app
# Удалить эту строку

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.v1 import api_router
from app.core.config import settings
from app.db.init_db import init_db
from app.logging_config import setup_biometry_logging
from app.middleware.logging_middleware import LoggingMiddleware

# Настройка базового логирования
import os

# Создаем директорию для логов, если она не существует
os.makedirs('logs', exist_ok=True)

# Configure logging to reduce verbosity of third-party packages
logging.basicConfig(
    level=logging.INFO,  # Changed from DEBUG to INFO to reduce verbosity
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('logs/app.log', encoding='utf-8')
    ]
)

# Reduce logging level for problematic third-party libraries
logging.getLogger("uvicorn").setLevel(logging.WARNING)
logging.getLogger("watchfiles").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
logging.getLogger("PIL").setLevel(logging.WARNING)
logging.getLogger("matplotlib").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)

# Инициализация логирования для модуля биометрии
setup_biometry_logging()

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database
    logger.info("Initializing database...")
    init_db()
    logger.info("Database initialized successfully")
    yield
    # Cleanup (if needed)
    logger.info("Application shutdown")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Добавляем middleware для логирования запросов
app.add_middleware(LoggingMiddleware)

logger.info("FastAPI application starting...")

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    logger.info(f"CORS middleware configured for origins: {settings.BACKEND_CORS_ORIGINS}")

# Включаем роутеры API
logger.info("Including API routers...")
app.include_router(api_router, prefix=settings.API_V1_STR)
logger.info("API routers included successfully")

# Простой root endpoint
@app.get("/")
async def root():
    return {
        "message": "Moskovets-3D API",
        "docs": "/docs",
        "api": "/api/v1",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

logger.info("FastAPI application startup completed")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting uvicorn server...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5001,
        reload=True,
        # Increase request size limit to 500MB for CT scans
        limit_max_request_size=500*1024*1024
    )