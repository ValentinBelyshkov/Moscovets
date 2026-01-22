from typing import Any, List, Optional
import os
import uuid
import logging
import time
import hashlib
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from starlette.responses import FileResponse

from app import crud, schemas
from app.api import deps
from app.models.user import User
from app.models.biometry import ModelType, ModelFormat, BiometryStatus
from app.services.assimp_service import assimp_service
from app.crud.crud_biometry import generate_biometry_file_path, get_file_size, validate_biometry_file

# Настройка логирования для модуля биометрии
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
    """
    Загрузка 3D модели для биометрии
    """
    logger.info(f"Начало загрузки 3D модели для биометрии: {file.filename}, ID пациента: {patient_id}, тип: {model_type.value}")
    
    # Валидация файла
    if not file.filename or not validate_biometry_file(file.filename):
        logger.error(f"Неподдерживаемый формат файла для {file.filename}")
        raise HTTPException(status_code=400, detail="Unsupported file format. Only STL and OBJ files are supported.")
    
    try:
        # Чтение содержимого файла
        logger.debug(f"Чтение содержимого файла: {file.filename}")
        file_content = await file.read()
        logger.info(f"Файл успешно прочитан, размер: {len(file_content)} байт")
        
        # Генерация пути для файла
        file_path = generate_biometry_file_path(file.filename, model_type.value)
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
    """
    Получение списка 3D моделей для биометрии
    """
    start_time = time.time()
    logger.info(f"Запрос на получение 3D моделей биометрии: patient_id={patient_id}, model_type={model_type}, skip={skip}, limit={limit}")
    
    try:
        # Логируем параметры запроса
        logger.debug(f"Параметры запроса: patient_id={patient_id}, model_type={model_type}, skip={skip}, limit={limit}")
        
        # Получаем модели из базы данных
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
    """
    Получение 3D модели для биометрии по ID
    """
    start_time = time.time()
    logger.info(f"Запрос на получение 3D модели биометрии с ID: {model_id}")
    
    try:
        model = crud.biometry_model.get(db=db, id=model_id)
        if not model:
            logger.warning(f"3D модель биометрии не найдена: {model_id}")
            raise HTTPException(status_code=404, detail="Biometry 3D model not found")
        
        execution_time = time.time() - start_time
        logger.info(f"Модель {model_id} успешно получена за {execution_time:.3f} секунд")
        
        return model
    except HTTPException:
        execution_time = time.time() - start_time
        logger.error(f"Ошибка получения 3D модели биометрии {model_id} за {execution_time:.3f} секунд: HTTPException")
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
    """
    Анализ 3D модели для биометрии
    """
    logger.info(f"Начало анализа 3D модели биометрии: {model_id}")
    
    try:
        model = crud.biometry_model.get(db=db, id=model_id)
        if not model:
            logger.warning(f"3D модель биометрии не найдена: {model_id}")
            raise HTTPException(status_code=404, detail="Biometry 3D model not found")
        
        if not os.path.exists(str(model.file_path)):
            logger.error(f"Файл модели не найден на диске: {model.file_path}")
            raise HTTPException(status_code=404, detail="Model file not found on disk")
        
        logger.info(f"Анализ файла модели: {model.file_path}")
        
        # Анализ модели с помощью Assimp
        metadata = assimp_service.load_model(str(model.file_path))
        
        # Обновляем метаданные в базе данных
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

@router.post("/biometry-sessions", response_model=schemas.BiometrySession)
def create_biometry_session(
    *,
    db: Session = Depends(deps.get_db),
    session_in: schemas.BiometrySessionCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Создание сессии биометрии
    """
    start_time = time.time()
    logger.info(f"Создание сессии биометрии для пациента {session_in.patient_id}")
    logger.debug(f"Параметры сессии: model_id={session_in.model_id}, calibration_points={session_in.calibration_points}")
    
    try:
        # Проверяем существование модели, если она указана
        if session_in.model_id:
            model = crud.biometry_model.get(db=db, id=session_in.model_id)
            if not model:
                logger.warning(f"Модель биометрии не найдена: {session_in.model_id}")
                raise HTTPException(status_code=404, detail="Biometry model not found")
            logger.debug(f"Модель найдена: id={model.id}, type={model.model_type}, status={model.status}")
        
        session = crud.biometry_session.create_with_model(db=db, obj_in=session_in)
        
        execution_time = time.time() - start_time
        logger.info(f"Сессия биометрии успешно создана с ID: {session.id} за {execution_time:.3f} секунд")
        logger.debug(f"Созданная сессия: id={session.id}, patient_id={session.patient_id}, model_id={session.model_id}, status={session.status}")
        
        return session
    except HTTPException:
        execution_time = time.time() - start_time
        logger.error(f"Ошибка создания сессии биометрии за {execution_time:.3f} секунд: HTTPException")
        raise
    except Exception as e:
        execution_time = time.time() - start_time
        logger.error(f"Ошибка создания сессии биометрии за {execution_time:.3f} секунд: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create biometry session")

@router.get("/biometry-sessions", response_model=List[schemas.BiometrySession])
def read_biometry_sessions(
    db: Session = Depends(deps.get_db),
    patient_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Получение списка сессий биометрии
    """
    start_time = time.time()
    logger.info(f"Запрос на получение сессий биометрии: patient_id={patient_id}, skip={skip}, limit={limit}")
    
    try:
        if patient_id:
            sessions = crud.biometry_session.get_by_patient(db, patient_id=patient_id, skip=skip, limit=limit)
        else:
            sessions = crud.biometry_session.get_multi(db, skip=skip, limit=limit)
        
        execution_time = time.time() - start_time
        logger.info(f"Возвращено {len(sessions)} сессий биометрии за {execution_time:.3f} секунд")
        
        return sessions
    except Exception as e:
        execution_time = time.time() - start_time
        logger.error(f"Ошибка получения сессий биометрии за {execution_time:.3f} секунд: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve biometry sessions")

@router.get("/biometry-sessions/{session_id}", response_model=schemas.BiometrySessionWithModel)
def read_biometry_session(
    *,
    db: Session = Depends(deps.get_db),
    session_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Получение сессии биометрии с моделью
    """
    start_time = time.time()
    logger.info(f"Запрос на получение сессии биометрии с моделью: {session_id}")
    
    try:
        session = crud.biometry_session.get_with_model(db, session_id=session_id)
        if not session:
            logger.warning(f"Сессия биометрии не найдена: {session_id}")
            raise HTTPException(status_code=404, detail="Biometry session not found")
        
        execution_time = time.time() - start_time
        logger.info(f"Сессия {session_id} успешно получена за {execution_time:.3f} секунд")
        
        return session
    except HTTPException:
        execution_time = time.time() - start_time
        logger.error(f"Ошибка получения сессии биометрии {session_id} за {execution_time:.3f} секунд: HTTPException")
        raise
    except Exception as e:
        execution_time = time.time() - start_time
        logger.error(f"Ошибка получения сессии биометрии {session_id} за {execution_time:.3f} секунд: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve biometry session")

@router.post("/biometry-sessions/{session_id}/add-model")
def add_model_to_biometry_session(
    *,
    db: Session = Depends(deps.get_db),
    session_id: int,
    model_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Добавление модели в сессию биометрии
    """
    start_time = time.time()
    logger.info(f"Добавление модели в сессию биометрии: session_id={session_id}, model_id={model_id}")
    
    try:
        session = crud.biometry_session.get(db=db, id=session_id)
        if not session:
            logger.warning(f"Сессия биометрии не найдена: {session_id}")
            raise HTTPException(status_code=404, detail="Biometry session not found")
        
        logger.debug(f"Найдена сессия: id={session.id}, patient_id={session.patient_id}, current_model_id={session.model_id}")
        
        model = crud.biometry_model.get(db=db, id=model_id)
        if not model:
            logger.warning(f"Модель биометрии не найдена: {model_id}")
            raise HTTPException(status_code=404, detail="Biometry model not found")
        
        logger.debug(f"Найдена модель: id={model.id}, type={model.model_type}, format={model.model_format}, status={model.status}")
        
        # Проверяем, что модель принадлежит тому же пациенту, что и сессия
        if str(model.patient_id) != str(session.patient_id):
            logger.warning(f"Модель {model_id} не принадлежит пациенту сессии {session.patient_id}")
            raise HTTPException(status_code=400, detail="Model does not belong to the same patient as the session")
        
        logger.debug(f"Обновление параметров сессии: model_id={model_id}")
        updated_session = crud.biometry_session.update_session_parameters(
            db, db_obj=session, parameters={'model_id': model_id}
        )
        
        execution_time = time.time() - start_time
        logger.info(f"Модель успешно добавлена в сессию {session_id} за {execution_time:.3f} секунд")
        logger.debug(f"Обновленная сессия: id={updated_session.id}, model_id={updated_session.model_id}")
        
        return {"message": f"Model added to biometry session successfully"}
    except HTTPException:
        execution_time = time.time() - start_time
        logger.error(f"Ошибка добавления модели в сессию за {execution_time:.3f} секунд: HTTPException")
        raise
    except Exception as e:
        execution_time = time.time() - start_time
        logger.error(f"Ошибка добавления модели в сессию биометрии за {execution_time:.3f} секунд: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add model to biometry session")

@router.post("/calibrate-biometry", response_model=schemas.BiometryCalibrationResponse)
async def calibrate_biometry(
    *,
    db: Session = Depends(deps.get_db),
    calibration_request: schemas.BiometryCalibrationRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Калибровка биометрии
    """
    start_time = time.time()
    logger.info(f"Начало калибровки биометрии: session_id={calibration_request.session_id}")
    
    try:
        session = crud.biometry_session.get_with_model(db, session_id=calibration_request.session_id)
        if not session:
            logger.warning(f"Сессия биометрии не найдена: {calibration_request.session_id}")
            raise HTTPException(status_code=404, detail="Biometry session not found")
        
        logger.debug(f"Найдена сессия: id={session.id}, patient_id={session.patient_id}, model_id={session.model_id}")
        
        if not session.model:
            logger.warning(f"Модель не найдена в сессии: {calibration_request.session_id}")
            raise HTTPException(status_code=400, detail="No model found in session")
        
        logger.debug(f"Привязанная модель: id={session.model.id}, type={session.model.model_type}, format={session.model.model_format}")
        
        # Проверяем количество точек калибровки
        points_count = len(calibration_request.calibration_points) if calibration_request.calibration_points else 0
        logger.info(f"Количество точек калибровки: {points_count}")
        
        # Здесь должна быть логика калибровки
        # Для упрощения просто обновляем статус
        
        calibration_parameters = {
            'calibration_points': calibration_request.calibration_points,
            'transformation_matrix': {
                'scale': 1.0,
                'rotation': [0, 0, 0],
                'translation': [0, 0, 0]
            }
        }
        
        # Обновляем статус сессии
        logger.debug("Обновление статуса сессии и параметров калибровки")
        crud.biometry_session.update_session_parameters(
            db, db_obj=session, parameters={
                'status': BiometryStatus.CALIBRATED,
                'calibration_points': calibration_request.calibration_points,
                'transformation_matrix': calibration_parameters['transformation_matrix']
            }
        )
        
        execution_time = time.time() - start_time
        logger.info(f"Калибровка биометрии завершена успешно: session_id={calibration_request.session_id} за {execution_time:.3f} секунд")
        
        return schemas.BiometryCalibrationResponse(
            success=True,
            message="Biometry calibration completed successfully",
            transformation_matrix=calibration_parameters['transformation_matrix']
        )
        
    except HTTPException:
        execution_time = time.time() - start_time
        logger.error(f"Ошибка калибровки биометрии за {execution_time:.3f} секунд: HTTPException")
        raise
    except Exception as e:
        execution_time = time.time() - start_time
        logger.error(f"Ошибка калибровки биометрии за {execution_time:.3f} секунд: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error calibrating biometry: {str(e)}")

@router.post("/export-biometry-model", response_model=schemas.BiometryExportResponse)
async def export_biometry_model(
    *,
    db: Session = Depends(deps.get_db),
    export_request: schemas.BiometryExportRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Экспорт 3D модели для биометрии
    """
    start_time = time.time()
    logger.info(f"Начало экспорта 3D модели биометрии: session_id={export_request.session_id}, format={export_request.export_format.value}")
    
    try:
        session = crud.biometry_session.get_with_model(db, session_id=export_request.session_id)
        if not session:
            logger.warning(f"Сессия биометрии не найдена: {export_request.session_id}")
            raise HTTPException(status_code=404, detail="Biometry session not found")
        
        logger.debug(f"Найдена сессия: id={session.id}, patient_id={session.patient_id}, model_id={session.model_id}")
        
        if not session.model:
            logger.warning(f"Модель не найдена в сессии: {export_request.session_id}")
            raise HTTPException(status_code=404, detail="No model found in session")
        
        logger.debug(f"Привязанная модель: id={session.model.id}, type={session.model.model_type}, format={session.model.model_format}")
        
        if not os.path.exists(str(session.model.file_path)):
            logger.error(f"Файл модели не найден на диске: {session.model.file_path}")
            raise HTTPException(status_code=404, detail="Model file not found on disk")
        
        # Генерируем имя и путь для экспортируемого файла
        timestamp = int(time.time())
        export_filename = f"biometry_model_export_{timestamp}.{export_request.export_format.value}"
        export_path = generate_biometry_file_path(export_filename, "export")
        
        logger.info(f"Конвертация модели в формат {export_request.export_format.value}: {export_path}")
        logger.debug(f"Исходный файл: {session.model.file_path}, целевой формат: {export_request.export_format.value}")
        
        # Вычисляем хэш исходного файла для контроля целостности
        original_file_hash = hashlib.md5(open(str(session.model.file_path), 'rb').read()).hexdigest()
        logger.debug(f"Хэш исходного файла: {original_file_hash}")
        
        success = assimp_service.convert_format(
            str(session.model.file_path),
            export_path,
            export_request.export_format.value
        )
        
        if not success:
            logger.error(f"Не удалось экспортировать модель: {export_request.session_id}")
            raise HTTPException(status_code=400, detail="Failed to export model")
        
        # Проверяем целостность экспортированного файла
        if os.path.exists(export_path):
            exported_file_hash = hashlib.md5(open(export_path, 'rb').read()).hexdigest()
            logger.debug(f"Хэш экспортированного файла: {exported_file_hash}")
        
        # Обновляем статус сессии
        logger.debug("Обновление статуса сессии на EXPORTED")
        crud.biometry_session.update_session_parameters(
            db, db_obj=session, parameters={'status': BiometryStatus.EXPORTED}
        )
        
        file_size = os.path.getsize(export_path)
        execution_time = time.time() - start_time
        
        logger.info(f"Модель успешно экспортирована: {export_path}, размер: {file_size} байт за {execution_time:.3f} секунд")
        
        return schemas.BiometryExportResponse(
            success=True,
            message="Biometry model exported successfully",
            download_url=f"/api/v1/biometry/download-export/{export_path.split('/')[-1]}",
            file_size=file_size
        )
        
    except HTTPException:
        execution_time = time.time() - start_time
        logger.error(f"Ошибка экспорта модели биометрии за {execution_time:.3f} секунд: HTTPException")
        raise
    except Exception as e:
        execution_time = time.time() - start_time
        logger.error(f"Ошибка экспорта модели биометрии за {execution_time:.3f} секунд: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error exporting biometry model: {str(e)}")

@router.get("/download-export/{filename}")
async def download_exported_biometry_model(
    filename: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Скачивание экспортированной модели для биометрии
    """
    start_time = time.time()
    logger.info(f"Скачивание экспортированной модели: {filename}")
    
    try:
        file_path = f"uploads/biometry_models/export/{filename}"
        
        if not os.path.exists(file_path):
            logger.error(f"Экспортированный файл не найден: {file_path}")
            raise HTTPException(status_code=404, detail="Exported file not found")
        
        file_size = os.path.getsize(file_path)
        logger.debug(f"Файл найден: {file_path}, размер: {file_size} байт")
        
        execution_time = time.time() - start_time
        logger.info(f"Файл готов к скачиванию за {execution_time:.3f} секунд")
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="application/octet-stream"
        )
    except HTTPException:
        execution_time = time.time() - start_time
        logger.error(f"Ошибка скачивания экспортированной модели за {execution_time:.3f} секунд: HTTPException")
        raise
    except Exception as e:
        execution_time = time.time() - start_time
        logger.error(f"Ошибка скачивания экспортированной модели за {execution_time:.3f} секунд: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to download exported model")

@router.get("/biometry-models/{model_id}/download")
async def download_biometry_3d_model(
    *,
    db: Session = Depends(deps.get_db),
    model_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Скачивание 3D модели для биометрии
    """
    start_time = time.time()
    logger.info(f"Скачивание 3D модели биометрии: {model_id}")
    
    try:
        model = crud.biometry_model.get(db=db, id=model_id)
        if not model:
            logger.warning(f"3D модель биометрии не найдена: {model_id}")
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
        execution_time = time.time() - start_time
        logger.error(f"Ошибка скачивания 3D модели биометрии {model_id} за {execution_time:.3f} секунд: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to download biometry model")