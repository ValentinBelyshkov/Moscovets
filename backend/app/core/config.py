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
    DATABASE_URL: str = "postgresql://moskovets3d:moskovets3d@localhost:5432/moskovets3d"

    # CORS settings
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://localhost:3630"

    # Security settings
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # File upload settings - Maximum file size for CT scans (500MB)
    MAX_UPLOAD_SIZE: int = 524288000  # 500 * 1024 * 1024

    # Storage settings
    STORAGE_PATH: str = "storage"

    def get_cors_origins(self) -> List[str]:
        """Parse BACKEND_CORS_ORIGINS from comma-separated string."""
        if isinstance(self.BACKEND_CORS_ORIGINS, list):
            return [str(origin) for origin in self.BACKEND_CORS_ORIGINS]
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"


settings = Settings()