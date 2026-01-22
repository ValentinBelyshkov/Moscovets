"""
Эндпоинты для работы с 3D моделями (загрузка, получение, анализ)
"""
from typing import Any, List, Optional
import os
import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from starlette.responses import FileResponse

from app import crud, schemas
from app.api import deps
from app.models.user import User
from app.models.modeling import ModelType, ModelFormat
from app.services.assimp_service import assimp_service
from app.crud.crud_modeling import generate_model_file_path, validate_model_file
from app.api.v1.endpoints.model_helpers import (
    process_uploaded_model_file,
    validate_model_exists,
    validate_file_on_disk
)
from app.utils.file_helpers import get_file_size

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/upload-model", response_model=schemas.ModelUploadResponse)
async def upload_3d_model(
    *,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    patient_id: int = Form(...),
    model_type: ModelType = Form(...),
    model_format: ModelFormat = Form(...),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Загрузка 3D модели"""
    logger.info(f"Начало загрузки 3D модели: {file.filename}, ID пациента: {patient_id}, тип: {model_type.value}")
    
    if not file.filename or not validate_model_file(file.filename):
        logger.error(f"Неподдерживаемый формат файла для {file.filename}")
        raise HTTPException(status_code=400, detail="Unsupported file format. Only STL and OBJ files are supported.")
    
    try:
        file_content, model_metadata = await process_uploaded_model_file(file)
        
        file_path = generate_model_file_path(file.filename, model_type.value)
        logger.debug(f"Сгенерированный путь к файлу: {file_path}")
        
        logger.debug("Создание записи в базе данных для 3D модели")
        model_in = schemas.ThreeDModelCreate(
            patient_id=patient_id,
            model_type=model_type,
            model_format=model_format,
            file_path=file_path,
            original_filename=file.filename or '',
            file_size=get_file_size(file_content),
            vertices_count=model_metadata.get('vertices_count'),
            faces_count=model_metadata.get('faces_count'),
            bounding_box=model_metadata.get('bounding_box')
        )
        
        model = crud.three_d_model.create_with_file(db=db, obj_in=model_in, file_content=file_content)
        
        logger.info(f"3D модель успешно загружена с ID: {model.id}")
        return schemas.ModelUploadResponse(
            id=model.id,
            model_type=model.model_type,
            model_format=model.model_format,
            original_filename=model.original_filename,
            file_size=model.file_size,
            vertices_count=model.vertices_count,
            faces_count=model.faces_count,
            message="3D model uploaded successfully"
        )
    except Exception as e:
        logger.error(f"Ошибка загрузки 3D модели {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload 3D model: {str(e)}")


@router.get("/models", response_model=List[schemas.ThreeDModel])
def read_3d_models(
    db: Session = Depends(deps.get_db),
    patient_id: Optional[int] = None,
    model_type: Optional[ModelType] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Получение списка 3D моделей"""
    logger.info(f"Получение 3D моделей: patient_id={patient_id}, model_type={model_type}, skip={skip}, limit={limit}")
    
    try:
        if patient_id and model_type:
            logger.debug(f"Получение модели по пациенту {patient_id} и типу {model_type.value}")
            models = [crud.three_d_model.get_by_patient_and_type(db, patient_id=patient_id, model_type=model_type.value)]
            models = [m for m in models if m is not None]
        elif patient_id:
            logger.debug(f"Получение моделей по пациенту {patient_id}")
            models = crud.three_d_model.get_by_patient(db, patient_id=patient_id, skip=skip, limit=limit)
        else:
            logger.debug("Получение всех моделей")
            models = crud.three_d_model.get_multi(db, skip=skip, limit=limit)
        
        logger.info(f"Получено {len(models)} моделей")
        return models
    except Exception as e:
        logger.error(f"Ошибка получения 3D моделей: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve models")


@router.get("/models/{model_id}", response_model=schemas.ThreeDModel)
def read_3d_model(
    *,
    db: Session = Depends(deps.get_db),
    model_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Получение 3D модели по ID"""
    logger.info(f"Получение 3D модели с ID: {model_id}")
    
    try:
        model = validate_model_exists(db, crud.three_d_model, model_id, "3D model")
        logger.debug(f"Найдена модель: {model.original_filename}, тип: {model.model_type.value}")
        return model
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка получения 3D модели {model_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve model")


@router.post("/analyze-model", response_model=schemas.ModelAnalysisResponse)
async def analyze_3d_model(
    *,
    db: Session = Depends(deps.get_db),
    model_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Анализ 3D модели"""
    logger.info(f"Начало анализа 3D модели: {model_id}")
    
    try:
        model = validate_model_exists(db, crud.three_d_model, model_id, "3D model")
        validate_file_on_disk(model.file_path)
        
        logger.info(f"Анализ файла модели: {model.file_path}")
        metadata = assimp_service.load_model(model.file_path)
        
        logger.debug("Обновление метаданных модели в базе данных")
        crud.three_d_model.update_model_parameters(db, db_obj=model, parameters={
            'vertices_count': metadata.get('vertices_count'),
            'faces_count': metadata.get('faces_count'),
            'bounding_box': metadata.get('bounding_box')
        })
        
        logger.info(f"Анализ модели завершен: вершины={metadata.get('vertices_count')}, грани={metadata.get('faces_count')}")
        return schemas.ModelAnalysisResponse(
            success=True,
            vertices_count=metadata.get('vertices_count', 0),
            faces_count=metadata.get('faces_count', 0),
            bounding_box=metadata.get('bounding_box', {}),
            volume=metadata.get('volume'),
            surface_area=metadata.get('surface_area'),
            is_watertight=metadata.get('is_watertight'),
            defects=metadata.get('defects', [])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка анализа 3D модели {model_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error analyzing model: {str(e)}")


@router.get("/models/{model_id}/download")
async def download_3d_model(
    *,
    db: Session = Depends(deps.get_db),
    model_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Скачивание 3D модели"""
    logger.info(f"Скачивание 3D модели: {model_id}")
    
    try:
        model = validate_model_exists(db, crud.three_d_model, model_id, "3D model")
        validate_file_on_disk(model.file_path)
        
        logger.info(f"Подача файла модели: {model.original_filename}")
        return FileResponse(
            path=model.file_path,
            filename=model.original_filename,
            media_type="application/octet-stream"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка скачивания 3D модели {model_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to download model")
