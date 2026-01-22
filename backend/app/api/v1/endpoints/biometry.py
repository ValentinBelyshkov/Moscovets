"""
Главный роутер для биометрии - объединяет все подмодули
"""
from fastapi import APIRouter

from app.api.v1.endpoints import biometry_models, biometry_sessions, biometry_export

router = APIRouter()

router.include_router(biometry_models.router, tags=["biometry-models"])
router.include_router(biometry_sessions.router, tags=["biometry-sessions"])
router.include_router(biometry_export.router, tags=["biometry-export"])
