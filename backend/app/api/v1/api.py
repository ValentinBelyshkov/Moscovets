import logging
from fastapi import APIRouter

from .endpoints import users, patients, medical_records, files, documents, auth, modeling, biometry

# Настройка логирования для API
logger = logging.getLogger(__name__)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(medical_records.router, prefix="/medical-records", tags=["medical_records"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(modeling.router, prefix="/modeling", tags=["modeling"])
api_router.include_router(biometry.router, prefix="/biometry", tags=["biometry"])

logger.info("API роутеры инициализированы, включая модули моделирования и биометрии")