"""FastAPI application for Moskovets-3D project."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings
from app.middleware.logging_middleware import LoggingMiddleware
from app.exceptions.handlers import setup_exception_handlers

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="3D Dental Modeling and Biometry API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Добавляем middleware для логирования запросов
app.add_middleware(LoggingMiddleware)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Настройка обработчиков исключений
setup_exception_handlers(app)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {"message": "Welcome to Moskovets-3D API", "version": settings.PROJECT_VERSION}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}