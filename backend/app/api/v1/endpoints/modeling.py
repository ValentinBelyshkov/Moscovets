"""
Главный роутер для моделирования - объединяет все подмодули
"""
from fastapi import APIRouter

from app.api.v1.endpoints import modeling_models, modeling_sessions

router = APIRouter()

router.include_router(modeling_models.router, tags=["modeling-models"])
router.include_router(modeling_sessions.router, tags=["modeling-sessions"])
