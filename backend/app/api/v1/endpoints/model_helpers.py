"""
Общие функции для работы с 3D моделями в API endpoints
"""
import os
import logging
from typing import Any, Dict
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.services.assimp_service import assimp_service
from app.utils.file_helpers import create_temp_file, remove_temp_file, get_file_size

logger = logging.getLogger(__name__)


async def process_uploaded_model_file(file: UploadFile) -> tuple[bytes, Dict[str, Any]]:
    """
    Обрабатывает загруженный файл 3D модели
    
    Args:
        file: Загруженный файл
        
    Returns:
        Кортеж (содержимое файла, метаданные модели)
    """
    logger.debug(f"Чтение содержимого файла: {file.filename}")
    file_content = await file.read()
    logger.info(f"Файл успешно прочитан, размер: {len(file_content)} байт")
    
    logger.info(f"Анализ 3D модели: {file.filename}")
    temp_path = create_temp_file(file_content, file.filename or "model")
    
    try:
        model_metadata = assimp_service.load_model(temp_path)
        logger.info(f"Анализ модели завершен: вершины={model_metadata.get('vertices_count')}, грани={model_metadata.get('faces_count')}")
        return file_content, model_metadata
    finally:
        remove_temp_file(temp_path)


def validate_model_exists(db: Session, crud_repo, model_id: int, model_type: str = "Model") -> Any:
    """
    Проверяет существование модели в базе данных
    
    Args:
        db: Сессия базы данных
        crud_repo: CRUD репозиторий
        model_id: ID модели
        model_type: Тип модели для сообщения об ошибке
        
    Returns:
        Модель из базы данных
        
    Raises:
        HTTPException: Если модель не найдена
    """
    model = crud_repo.get(db=db, id=model_id)
    if not model:
        logger.warning(f"{model_type} не найдена: {model_id}")
        raise HTTPException(status_code=404, detail=f"{model_type} not found")
    return model


def validate_file_on_disk(file_path: str) -> None:
    """
    Проверяет существование файла на диске
    
    Args:
        file_path: Путь к файлу
        
    Raises:
        HTTPException: Если файл не найден
    """
    if not os.path.exists(file_path):
        logger.error(f"Файл модели не найден на диске: {file_path}")
        raise HTTPException(status_code=404, detail="Model file not found on disk")


def check_models_same_patient(model1, model2, session_patient_id: int) -> None:
    """
    Проверяет, что модели принадлежат одному пациенту
    
    Args:
        model1: Первая модель
        model2: Вторая модель (может быть None)
        session_patient_id: ID пациента из сессии
        
    Raises:
        HTTPException: Если модели принадлежат разным пациентам
    """
    if model2 and str(model1.patient_id) != str(model2.patient_id):
        logger.warning(f"Модели принадлежат разным пациентам: {model1.patient_id} и {model2.patient_id}")
        raise HTTPException(status_code=400, detail="Models must belong to the same patient")
    
    if str(model1.patient_id) != str(session_patient_id):
        logger.warning(f"Модель {model1.id} не принадлежит пациенту сессии {session_patient_id}")
        raise HTTPException(status_code=400, detail="Model does not belong to the same patient as the session")
