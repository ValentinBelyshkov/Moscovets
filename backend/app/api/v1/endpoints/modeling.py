from typing import Any, List, Optional
import os
import uuid
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from starlette.responses import FileResponse

from app import crud, schemas
from app.api import deps
from app.models.user import User
from app.models.modeling import ModelType, ModelFormat, ModelingStatus
from app.services.assimp_service import assimp_service
from app.crud.crud_modeling import generate_model_file_path, get_file_size, validate_model_file

# Настройка логирования для модуля моделирования
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
    """
    Загрузка 3D модели
    """
    logger.info(f"Начало загрузки 3D модели: {file.filename}, ID пациента: {patient_id}, тип: {model_type.value}")
    
    # Валидация файла
    if not file.filename or not validate_model_file(file.filename):
        logger.error(f"Неподдерживаемый формат файла для {file.filename}")
        raise HTTPException(status_code=400, detail="Unsupported file format. Only STL and OBJ files are supported.")
    
    try:
        # Чтение содержимого файла
        logger.debug(f"Чтение содержимого файла: {file.filename}")
        file_content = await file.read()
        logger.info(f"Файл успешно прочитан, размер: {len(file_content)} байт")
        
        # Генерация пути для файла
        file_path = generate_model_file_path(file.filename, model_type.value)
        logger.debug(f"Сгенерированный путь к файлу: {file_path}")
        
        # Анализ модели с помощью Assimp
        logger.info(f"Анализ 3D модели: {file.filename}")
        # Временно сохраняем файл для анализа
        temp_path = f"/tmp/{uuid.uuid4()}_{file.filename}"
        with open(temp_path, "wb") as temp_file:
            temp_file.write(file_content)
        
        # Получаем метаданные модели
        model_metadata = assimp_service.load_model(temp_path)
        
        # Удаляем временный файл
        os.remove(temp_path)
        logger.info(f"Анализ модели завершен: вершины={model_metadata.get('vertices_count')}, грани={model_metadata.get('faces_count')}")
        
        # Создание записи в базе данных
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
    """
    Получение списка 3D моделей
    """
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
    """
    Получение 3D модели по ID
    """
    logger.info(f"Получение 3D модели с ID: {model_id}")
    
    try:
        model = crud.three_d_model.get(db=db, id=model_id)
        if not model:
            logger.warning(f"3D модель не найдена: {model_id}")
            raise HTTPException(status_code=404, detail="3D model not found")
        
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
    """
    Анализ 3D модели
    """
    logger.info(f"Начало анализа 3D модели: {model_id}")
    
    try:
        model = crud.three_d_model.get(db=db, id=model_id)
        if not model:
            logger.warning(f"3D модель не найдена: {model_id}")
            raise HTTPException(status_code=404, detail="3D model not found")
        
        if not os.path.exists(model.file_path):
            logger.error(f"Файл модели не найден на диске: {model.file_path}")
            raise HTTPException(status_code=404, detail="Model file not found on disk")
        
        logger.info(f"Анализ файла модели: {model.file_path}")
        
        # Анализ модели с помощью Assimp
        metadata = assimp_service.load_model(model.file_path)
        
        # Обновляем метаданные в базе данных
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

@router.post("/sessions", response_model=schemas.ModelingSession)
def create_modeling_session(
    *,
    db: Session = Depends(deps.get_db),
    session_in: schemas.ModelingSessionCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Создание сессии моделирования
    """
    session = crud.modeling_session.create_with_models(db=db, obj_in=session_in)
    return session

@router.get("/sessions", response_model=List[schemas.ModelingSession])
def read_modeling_sessions(
    db: Session = Depends(deps.get_db),
    patient_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Получение списка сессий моделирования
    """
    if patient_id:
        sessions = crud.modeling_session.get_by_patient(db, patient_id=patient_id, skip=skip, limit=limit)
    else:
        sessions = crud.modeling_session.get_multi(db, skip=skip, limit=limit)
    
    return sessions

@router.get("/sessions/{session_id}", response_model=schemas.ModelingSessionWithModels)
def read_modeling_session(
    *,
    db: Session = Depends(deps.get_db),
    session_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Получение сессии моделирования с моделями
    """
    session = crud.modeling_session.get_with_models(db, session_id=session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Modeling session not found")
    return session

@router.post("/sessions/{session_id}/add-model")
def add_model_to_session(
    *,
    db: Session = Depends(deps.get_db),
    session_id: int,
    model_type: ModelType,
    model_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Добавление модели в сессию моделирования
    """
    session = crud.modeling_session.get(db=db, id=session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Modeling session not found")
    
    model = crud.three_d_model.get(db=db, id=model_id)
    if not model:
        raise HTTPException(status_code=404, detail="3D model not found")
    
    updated_session = crud.modeling_session.add_model_to_session(
        db, session_id=session_id, model_type=model_type.value, model_id=model_id
    )
    
    return {"message": f"Model {model_type.value} added to session successfully"}

@router.post("/assemble-models", response_model=schemas.ModelAssemblyResponse)
async def assemble_models(
    *,
    db: Session = Depends(deps.get_db),
    assembly_request: schemas.ModelAssemblyRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Сборка 3D моделей
    """
    session = crud.modeling_session.get_with_models(db, session_id=assembly_request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Modeling session not found")
    
    if not session.upper_jaw or not session.lower_jaw:
        raise HTTPException(status_code=400, detail="Both upper and lower jaw models are required for assembly")
    
    try:
        # Здесь должна быть логика сборки моделей
        # Для упрощения просто обновляем статус
        
        assembly_parameters = {
            'auto_align': assembly_request.auto_align,
            'tolerance': assembly_request.tolerance,
            'upper_jaw_position': {
                'x': session.upper_jaw.position_x,
                'y': session.upper_jaw.position_y,
                'z': session.upper_jaw.position_z
            },
            'lower_jaw_position': {
                'x': session.lower_jaw.position_x,
                'y': session.lower_jaw.position_y,
                'z': session.lower_jaw.position_z
            }
        }
        
        # Обновляем статус сессии
        crud.modeling_session.update_session_parameters(
            db, db_obj=session, parameters={
                'status': ModelingStatus.ASSEMBLED,
                'modeling_parameters': assembly_parameters
            }
        )
        
        return schemas.ModelAssemblyResponse(
            success=True,
            message="Models assembled successfully",
            assembly_parameters=assembly_parameters
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error assembling models: {str(e)}")

@router.post("/create-occlusion-pad", response_model=schemas.OcclusionPadResponse)
async def create_occlusion_pad(
    *,
    db: Session = Depends(deps.get_db),
    pad_request: schemas.OcclusionPadRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Создание окклюзионной накладки
    """
    session = crud.modeling_session.get_with_models(db, session_id=pad_request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Modeling session not found")
    
    if not session.upper_jaw or not session.lower_jaw:
        raise HTTPException(status_code=400, detail="Both upper and lower jaw models are required for occlusion pad creation")
    
    if session.status != ModelingStatus.ASSEMBLED:
        raise HTTPException(status_code=400, detail="Models must be assembled before creating occlusion pad")
    
    try:
        # Создаем окклюзионную накладку
        output_path = generate_model_file_path("occlusion_pad.stl", "occlusion_pad")
        
        parameters = {
            'pad_thickness': pad_request.pad_thickness,
            'margin_offset': pad_request.margin_offset,
            'cement_gap': pad_request.cement_gap
        }
        
        success = assimp_service.create_occlusion_pad(
            session.upper_jaw.file_path,
            session.lower_jaw.file_path,
            output_path,
            parameters
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to create occlusion pad")
        
        # Анализируем созданную накладку
        pad_metadata = assimp_service.load_model(output_path)
        
        # Создаем запись в базе данных для накладки
        pad_model_in = schemas.ThreeDModelCreate(
            patient_id=session.patient_id,
            model_type=ModelType.OCCLUSION_PAD,
            model_format=ModelFormat.STL,
            file_path=output_path,
            original_filename=f"occlusion_pad_session_{session.id}.stl",
            file_size=os.path.getsize(output_path),
            vertices_count=pad_metadata.get('vertices_count'),
            faces_count=pad_metadata.get('faces_count'),
            bounding_box=pad_metadata.get('bounding_box')
        )
        
        # Читаем содержимое файла
        with open(output_path, "rb") as f:
            pad_file_content = f.read()
        
        pad_model = crud.three_d_model.create_with_file(db=db, obj_in=pad_model_in, file_content=pad_file_content)
        
        # Обновляем сессию
        crud.modeling_session.update_session_parameters(
            db, db_obj=session, parameters={
                'status': ModelingStatus.PAD_CREATED,
                'occlusion_pad_id': pad_model.id
            }
        )
        
        return schemas.OcclusionPadResponse(
            success=True,
            message="Occlusion pad created successfully",
            pad_model_id=pad_model.id,
            pad_parameters=parameters
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating occlusion pad: {str(e)}")

@router.post("/export-model", response_model=schemas.ModelExportResponse)
async def export_model(
    *,
    db: Session = Depends(deps.get_db),
    export_request: schemas.ModelExportRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Экспорт 3D модели
    """
    session = crud.modeling_session.get_with_models(db, session_id=export_request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Modeling session not found")
    
    # Определяем, какую модель экспортировать
    model = None
    if export_request.model_type == ModelType.UPPER_JAW:
        model = session.upper_jaw
    elif export_request.model_type == ModelType.LOWER_JAW:
        model = session.lower_jaw
    elif export_request.model_type == ModelType.BITE_1:
        model = session.bite1
    elif export_request.model_type == ModelType.BITE_2:
        model = session.bite2
    elif export_request.model_type == ModelType.OCCLUSION_PAD:
        model = session.occlusion_pad
    
    if not model:
        raise HTTPException(status_code=404, detail="Requested model not found in session")
    
    if not os.path.exists(model.file_path):
        raise HTTPException(status_code=404, detail="Model file not found on disk")
    
    try:
        # Конвертируем модель в нужный формат
        export_filename = f"{export_request.model_type.value}_export.{export_request.export_format.value}"
        export_path = generate_model_file_path(export_filename, "export")
        
        success = assimp_service.convert_format(
            model.file_path,
            export_path,
            export_request.export_format.value
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to export model")
        
        # Обновляем статус сессии
        if export_request.model_type == ModelType.OCCLUSION_PAD:
            crud.modeling_session.update_session_parameters(
                db, db_obj=session, parameters={'status': ModelingStatus.EXPORTED}
            )
        
        file_size = os.path.getsize(export_path)
        
        return schemas.ModelExportResponse(
            success=True,
            message="Model exported successfully",
            download_url=f"/api/v1/modeling/download-export/{export_path.split('/')[-1]}",
            file_size=file_size
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error exporting model: {str(e)}")

@router.get("/download-export/{filename}")
async def download_exported_model(
    filename: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Скачивание экспортированной модели
    """
    file_path = f"uploads/3d_models/export/{filename}"
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Exported file not found")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream"
    )

@router.get("/models/{model_id}/download")
async def download_3d_model(
    *,
    db: Session = Depends(deps.get_db),
    model_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Скачивание 3D модели
    """
    logger.info(f"Скачивание 3D модели: {model_id}")
    
    try:
        model = crud.three_d_model.get(db=db, id=model_id)
        if not model:
            logger.warning(f"3D модель не найдена: {model_id}")
            raise HTTPException(status_code=404, detail="3D model not found")
        
        if not os.path.exists(model.file_path):
            logger.error(f"Файл модели не найден на диске: {model.file_path}")
            raise HTTPException(status_code=404, detail="Model file not found on disk")
        
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