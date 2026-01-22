"""
Эндпоинты для работы с 3D моделями биометрии (загрузка, получение, анализ)
"""
from typing import Any, List, Optional
import os
import logging
import time

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from starlette.responses import FileResponse

from app import crud, schemas
from app.api import deps
from app.models.user import User
from app.models.biometry import ModelType, ModelFormat, BiometryStatus
from app.services.assimp_service import assimp_service
from app.crud.crud_biometry import generate_biometry_file_path, validate_biometry_file
from app.api.v1.endpoints.model_helpers import (
    process_uploaded_model_file,
    validate_model_exists,
    validate_file_on_disk
)
from app.utils.file_helpers import get_file_size

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/upload-biometry-model", response_model=schemas.BiometryModelUploadResponse)
async def upload_biometry_3d_model(
    *,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    patient_id: int = Form(...),
    model_type: ModelType = Form(...),
    model_format: ModelFormat = Form(...),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Загрузка 3D модели для биометрии"""
    logger.info(f"Начало загрузки 3D модели для биометрии: {file.filename}, ID пациента: {patient_id}, тип: {model_type.value}")
    
    if not file.filename or not validate_biometry_file(file.filename):
        logger.error(f"Неподдерживаемый формат файла для {file.filename}")
        raise HTTPException(status_code=400, detail="Unsupported file format. Only STL and OBJ files are supported.")
    
    try:
        file_content, model_metadata = await process_uploaded_model_file(file)
        
        file_path = generate_biometry_file_path(file.filename, model_type.value)
        logger.debug(f"Сгенерированный путь к файлу: {file_path}")
        
        logger.debug("Создание записи в базе данных для 3D модели биометрии")
        model_in = schemas.BiometryModelCreate(
            patient_id=patient_id,
            model_type=model_type,
            model_format=model_format,
            file_path=file_path,
            original_filename=file.filename or '',
            file_size=get_file_size(file_content),
            vertices_count=model_metadata.get('vertices_count'),
            faces_count=model_metadata.get('faces_count'),
            bounding_box=model_metadata.get('bounding_box'),
            status=BiometryStatus.UPLOADED
        )
        
        model = crud.biometry_model.create_with_file(db=db, obj_in=model_in, file_content=file_content)
        
        logger.info(f"3D модель биометрии успешно загружена с ID: {model.id}")
        return schemas.BiometryModelUploadResponse(
            id=model.id,
            model_type=model.model_type,
            model_format=model.model_format,
            original_filename=model.original_filename,
            file_size=model.file_size,
            vertices_count=model.vertices_count,
            faces_count=model.faces_count,
            status=model.status,
            message="3D модель биометрии успешно загружена"
        )
    except Exception as e:
        logger.error(f"Ошибка загрузки 3D модели биометрии {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload biometry 3D model: {str(e)}")


@router.get("/biometry-models", response_model=List[schemas.BiometryModel])
def read_biometry_models(
    db: Session = Depends(deps.get_db),
    patient_id: Optional[int] = None,
    model_type: Optional[ModelType] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Получение списка 3D моделей для биометрии"""
    start_time = time.time()
    logger.info(f"Запрос на получение 3D моделей биометрии: patient_id={patient_id}, model_type={model_type}")
    
    try:
        if patient_id and model_type:
            logger.debug(f"Получение модели по пациенту {patient_id} и типу {model_type.value}")
            models = [crud.biometry_model.get_by_patient_and_type(db, patient_id=patient_id, model_type=model_type.value)]
            models = [m for m in models if m is not None]
        elif patient_id:
            logger.debug(f"Получение моделей по пациенту {patient_id}")
            models = crud.biometry_model.get_by_patient(db, patient_id=patient_id, skip=skip, limit=limit)
        else:
            logger.debug("Получение всех моделей")
            models = crud.biometry_model.get_multi(db, skip=skip, limit=limit)
        
        execution_time = time.time() - start_time
        logger.info(f"Возвращено {len(models)} моделей биометрии за {execution_time:.3f} секунд")
        
        return models
    except Exception as e:
        execution_time = time.time() - start_time
        logger.error(f"Ошибка получения 3D моделей биометрии за {execution_time:.3f} секунд: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve biometry models")


@router.get("/biometry-models/{model_id}", response_model=schemas.BiometryModel)
def read_biometry_model(
    *,
    db: Session = Depends(deps.get_db),
    model_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Получение 3D модели для биометрии по ID"""
    start_time = time.time()
    logger.info(f"Запрос на получение 3D модели биометрии с ID: {model_id}")
    
    try:
        model = validate_model_exists(db, crud.biometry_model, model_id, "Biometry 3D model")
        
        execution_time = time.time() - start_time
        logger.info(f"Модель {model_id} успешно получена за {execution_time:.3f} секунд")
        
        return model
    except HTTPException:
        raise
    except Exception as e:
        execution_time = time.time() - start_time
        logger.error(f"Ошибка получения 3D модели биометрии {model_id} за {execution_time:.3f} секунд: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve biometry model")


@router.post("/analyze-biometry-model", response_model=schemas.BiometryModelAnalysisResponse)
async def analyze_biometry_3d_model(
    *,
    db: Session = Depends(deps.get_db),
    model_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Анализ 3D модели для биометрии"""
    logger.info(f"Начало анализа 3D модели биометрии: {model_id}")
    
    try:
        model = validate_model_exists(db, crud.biometry_model, model_id, "Biometry 3D model")
        validate_file_on_disk(str(model.file_path))
        
        logger.info(f"Анализ файла модели: {model.file_path}")
        metadata = assimp_service.load_model(str(model.file_path))
        
        logger.debug("Обновление метаданных модели в базе данных")
        crud.biometry_model.update_model_parameters(db, db_obj=model, parameters={
            'vertices_count': metadata.get('vertices_count'),
            'faces_count': metadata.get('faces_count'),
            'bounding_box': metadata.get('bounding_box'),
            'status': BiometryStatus.ANALYZED
        })
        
        logger.info(f"Анализ модели завершен: вершины={metadata.get('vertices_count')}, грани={metadata.get('faces_count')}")
        return schemas.BiometryModelAnalysisResponse(
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
        logger.error(f"Ошибка анализа 3D модели биометрии {model_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error analyzing biometry model: {str(e)}")


@router.get("/biometry-models/{model_id}/download")
async def download_biometry_3d_model(
    *,
    db: Session = Depends(deps.get_db),
    model_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Скачивание 3D модели для биометрии"""
    start_time = time.time()
    logger.info(f"Скачивание 3D модели биометрии: {model_id}")
    
    try:
        model = validate_model_exists(db, crud.biometry_model, model_id, "3D model")
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
        execution_time = time.time() - start_time
        logger.error(f"Ошибка скачивания 3D модели биометрии {model_id} за {execution_time:.3f} секунд: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to download biometry model")
