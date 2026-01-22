"""FastAPI API endpoints for biometry operations."""
from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.schemas.biometry import (
    CalibrationExport,
    CalibrationPoint,
    CreateMapPoint,
    CreateModelPoint,
    CreatePair,
    MapPoint,
    ModelPoint,
    ObjUploadResponse,
    Pair,
    StatusResponse,
)
from app.services.biometry_storage import BiometryState

# Настройка логирования для модуля биометрии
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
EXPORTS_DIR = BASE_DIR / "exports"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
EXPORTS_DIR.mkdir(parents=True, exist_ok=True)

state = BiometryState()

router = APIRouter()


def _safe_filename(filename: str) -> str:
    return filename.replace("..", "_").replace("/", "_").replace("\\", "_")


def _http_model_path() -> str | None:
    if not state.last_uploaded_path:
        return None
    last_path = Path(state.last_uploaded_path)
    try:
        relative = last_path.relative_to(BASE_DIR)
    except ValueError:
        relative = last_path
    return "/" + relative.as_posix()


@router.get("/status", response_model=StatusResponse)
async def status() -> StatusResponse:
    logger.info("Проверка статуса модуля биометрии")
    if not state.last_uploaded_path:
        logger.warning("Модель еще не загружена")
        return StatusResponse(status="no-model", details="Модель не загружена")
    if not state.pairs:
        logger.info("Модель загружена, но пары точек не созданы")
        return StatusResponse(
            status="no-pairs",
            details="Нет связанных точек",
            model_path=_http_model_path(),
        )
    logger.info("Модуль биометрии готов к работе")
    return StatusResponse(status="ready", model_path=_http_model_path())


@router.post("/upload-obj", response_model=ObjUploadResponse)
async def upload_obj(file: Annotated[UploadFile, File(..., description="OBJ file")]):
    logger.info(f"Начало загрузки OBJ файла: {file.filename}")
    
    if not file.filename or not file.filename.lower().endswith(".obj"):
        logger.error(f"Неподдерживаемый формат файла: {file.filename}")
        raise HTTPException(status_code=400, detail="Only .obj files are supported")
    
    try:
        target_name = f"{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}-{_safe_filename(file.filename or '')}"
        target_path = UPLOAD_DIR / target_name
        logger.debug(f"Сохранение файла в: {target_path}")
        
        content = await file.read()
        target_path.write_bytes(content)
        state.set_uploaded_path(str(target_path))
        
        logger.info(f"Успешно загружен OBJ файл: {file.filename}, размер: {len(content)} байт")
        
        return ObjUploadResponse(
            filename=file.filename or '',
            content_type=file.content_type or "application/octet-stream",
            size_bytes=len(content),
            stored_path=f"/uploads/{target_name}",
            uploaded_at=datetime.utcnow(),
        )
    except Exception as e:
        logger.error(f"Ошибка загрузки OBJ файла {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Не удалось загрузить файл: {str(e)}")


@router.get("/model-points", response_model=list[ModelPoint])
async def list_model_points():
    logger.debug(f"Получение {len(state.model_points)} точек модели")
    return list(state.model_points.values())


@router.post("/add-model-point", response_model=ModelPoint)
async def add_model_point(payload: CreateModelPoint):
    logger.info(f"Добавление точки модели с координатами: x={payload.x}, y={payload.y}, z={payload.z}")
    try:
        point = state.add_model_point(payload.model_dump())
        logger.info(f"Успешно добавлена точка модели с ID: {point['id']}")
        return point
    except Exception as e:
        logger.error(f"Ошибка добавления точки модели: {str(e)}")
        raise HTTPException(status_code=500, detail="Не удалось добавить точку модели")


@router.get("/map-points", response_model=list[MapPoint])
async def list_map_points():
    logger.debug(f"Получение {len(state.map_points)} точек карты")
    return list(state.map_points.values())


@router.post("/add-map-point", response_model=MapPoint)
async def add_map_point(payload: CreateMapPoint):
    logger.info(f"Добавление точки карты с координатами: lat={payload.lat}, lng={payload.lng}")
    try:
        point = state.add_map_point(payload.model_dump())
        logger.info(f"Успешно добавлена точка карты с ID: {point['id']}")
        return point
    except Exception as e:
        logger.error(f"Ошибка добавления точки карты: {str(e)}")
        raise HTTPException(status_code=500, detail="Не удалось добавить точку карты")


@router.get("/pairs", response_model=list[Pair])
async def list_pairs():
    logger.debug(f"Получение {len(state.pairs)} пар точек")
    return list(state.pairs.values())


@router.post("/pairs", response_model=Pair)
async def create_pair(payload: CreatePair):
    logger.info(f"Создание пары между точкой модели {payload.model_id} и точкой карты {payload.map_id}")
    try:
        pair = state.add_pair(payload.model_id, payload.map_id)
        logger.info(f"Успешно создана пара с ID: {pair['id']}")
        return pair
    except KeyError as exc:
        logger.warning(f"Не удалось создать пару: {str(exc)}")
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as e:
        logger.error(f"Ошибка создания пары: {str(e)}")
        raise HTTPException(status_code=500, detail="Не удалось создать пару")


@router.delete("/pairs/{pair_id}", response_model=StatusResponse)
async def delete_pair(pair_id: int):
    logger.info(f"Удаление пары с ID: {pair_id}")
    try:
        removed = state.clear_pair(pair_id)
        if not removed:
            logger.warning(f"Пара с ID {pair_id} не найдена")
            raise HTTPException(status_code=404, detail="Пара не найдена")
        logger.info(f"Успешно удалена пара с ID: {pair_id}")
        return StatusResponse(status="deleted")
    except Exception as e:
        logger.error(f"Ошибка удаления пары {pair_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Не удалось удалить пару")


@router.post("/export-config")
async def export_config():
    logger.info("Начало экспорта конфигурации")
    
    if not state.last_uploaded_path:
        logger.warning("Экспорт не удался: модель не загружена")
        raise HTTPException(status_code=400, detail="Model not uploaded")
    if not state.pairs:
        logger.warning("Экспорт не удался: нет пар для экспорта")
        raise HTTPException(status_code=400, detail="No pairs to export")

    try:
        calibration_pairs: list[CalibrationPoint] = []
        logger.info(f"Экспорт {len(state.pairs)} калибровочных пар")
        
        for pair in state.pairs.values():
            model_point = state.model_points[pair["model_id"]]
            map_point = state.map_points[pair["map_id"]]
            calibration_pairs.append(
                CalibrationPoint(
                    model_point=ModelPoint(**model_point),
                    geo_point=MapPoint(**map_point),
                )
            )
        
        export = CalibrationExport(model_path=_http_model_path() or "", pairs=calibration_pairs)
        export_name = f"calibration-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.json"
        export_path = EXPORTS_DIR / export_name
        
        logger.debug(f"Запись файла экспорта в: {export_path}")
        export_path.write_text(export.model_dump_json(indent=2))
        
        logger.info(f"Успешно экспортирована конфигурация в: {export_name}")
        return FileResponse(
            path=export_path,
            filename=export_name,
            media_type="application/json",
        )
    except Exception as e:
        logger.error(f"Ошибка во время экспорта конфигурации: {str(e)}")
        raise HTTPException(status_code=500, detail="Не удалось экспортировать конфигурацию")


@router.delete("/clear-points", response_model=StatusResponse)
async def clear_points():
    logger.info("Очистка всех точек и пар биометрии")
    try:
        state.reset_points()
        logger.info("Успешно очищены все точки и пары")
        return StatusResponse(status="cleared")
    except Exception as e:
        logger.error(f"Ошибка очистки точек: {str(e)}")
        raise HTTPException(status_code=500, detail="Не удалось очистить точки")