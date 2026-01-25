"""Configuration settings for Moskovets-3D API."""
from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    # Project info
    PROJECT_NAME: str = "Moskovets-3D API"
    PROJECT_VERSION: str = "1.0.0"
    
    # API settings
    API_V1_STR: str = "/api/v1"
    
    # Database settings
    DATABASE_URL: str = "sqlite:///./moskovets3d.db"
    
    # CORS settings
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # Security settings
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # File upload settings - Maximum file size for CT scans (500MB)
    MAX_UPLOAD_SIZE: int = 524288000  # 500 * 1024 * 1024
    
    class Config:
        env_file = ".env"


settings = Settings()