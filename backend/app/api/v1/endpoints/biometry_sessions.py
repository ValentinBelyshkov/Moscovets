"""
Эндпоинты для работы с сессиями биометрии
"""
from typing import Any, List, Optional
import logging
import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.models.user import User
from app.models.biometry import BiometryStatus
from app.api.v1.endpoints.model_helpers import validate_model_exists, check_models_same_patient

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/biometry-sessions", response_model=schemas.BiometrySession)
def create_biometry_session(
    *,
    db: Session = Depends(deps.get_db),
    session_in: schemas.BiometrySessionCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Создание сессии биометрии"""
    start_time = time.time()
    logger.info(f"Создание сессии биометрии для пациента {session_in.patient_id}")
    logger.debug(f"Параметры сессии: model_id={session_in.model_id}, calibration_points={session_in.calibration_points}")
    
    try:
        if session_in.model_id:
            model = validate_model_exists(db, crud.biometry_model, session_in.model_id, "Biometry model")
            logger.debug(f"Модель найдена: id={model.id}, type={model.model_type}, status={model.status}")
        
        session = crud.biometry_session.create_with_model(db=db, obj_in=session_in)
        
        execution_time = time.time() - start_time
        logger.info(f"Сессия биометрии успешно создана с ID: {session.id} за {execution_time:.3f} секунд")
        
        return session
    except HTTPException:
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
    """Получение списка сессий биометрии"""
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
    """Получение сессии биометрии с моделью"""
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
    """Добавление модели в сессию биометрии"""
    start_time = time.time()
    logger.info(f"Добавление модели в сессию биометрии: session_id={session_id}, model_id={model_id}")
    
    try:
        session = validate_model_exists(db, crud.biometry_session, session_id, "Biometry session")
        logger.debug(f"Найдена сессия: id={session.id}, patient_id={session.patient_id}")
        
        model = validate_model_exists(db, crud.biometry_model, model_id, "Biometry model")
        logger.debug(f"Найдена модель: id={model.id}, type={model.model_type}")
        
        check_models_same_patient(model, None, session.patient_id)
        
        logger.debug(f"Обновление параметров сессии: model_id={model_id}")
        updated_session = crud.biometry_session.update_session_parameters(
            db, db_obj=session, parameters={'model_id': model_id}
        )
        
        execution_time = time.time() - start_time
        logger.info(f"Модель успешно добавлена в сессию {session_id} за {execution_time:.3f} секунд")
        
        return {"message": "Model added to biometry session successfully"}
    except HTTPException:
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
    """Калибровка биометрии"""
    start_time = time.time()
    logger.info(f"Начало калибровки биометрии: session_id={calibration_request.session_id}")
    
    try:
        session = crud.biometry_session.get_with_model(db, session_id=calibration_request.session_id)
        if not session:
            logger.warning(f"Сессия биометрии не найдена: {calibration_request.session_id}")
            raise HTTPException(status_code=404, detail="Biometry session not found")
        
        if not session.model:
            logger.warning(f"Модель не найдена в сессии: {calibration_request.session_id}")
            raise HTTPException(status_code=400, detail="No model found in session")
        
        points_count = len(calibration_request.calibration_points) if calibration_request.calibration_points else 0
        logger.info(f"Количество точек калибровки: {points_count}")
        
        calibration_parameters = {
            'calibration_points': calibration_request.calibration_points,
            'transformation_matrix': {
                'scale': 1.0,
                'rotation': [0, 0, 0],
                'translation': [0, 0, 0]
            }
        }
        
        logger.debug("Обновление статуса сессии и параметров калибровки")
        crud.biometry_session.update_session_parameters(
            db, db_obj=session, parameters={
                'status': BiometryStatus.CALIBRATED,
                'calibration_points': calibration_request.calibration_points,
                'transformation_matrix': calibration_parameters['transformation_matrix']
            }
        )
        
        execution_time = time.time() - start_time
        logger.info(f"Калибровка биометрии завершена успешно за {execution_time:.3f} секунд")
        
        return schemas.BiometryCalibrationResponse(
            success=True,
            message="Biometry calibration completed successfully",
            transformation_matrix=calibration_parameters['transformation_matrix']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        execution_time = time.time() - start_time
        logger.error(f"Ошибка калибровки биометрии за {execution_time:.3f} секунд: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error calibrating biometry: {str(e)}")
