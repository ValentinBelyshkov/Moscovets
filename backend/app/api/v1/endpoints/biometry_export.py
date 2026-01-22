"""
Эндпоинты для экспорта моделей биометрии
"""
from typing import Any
import os
import logging
import time
import hashlib

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette.responses import FileResponse

from app import crud, schemas
from app.api import deps
from app.models.user import User
from app.models.biometry import BiometryStatus
from app.services.assimp_service import assimp_service
from app.crud.crud_biometry import generate_biometry_file_path

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/export-biometry-model", response_model=schemas.BiometryExportResponse)
async def export_biometry_model(
    *,
    db: Session = Depends(deps.get_db),
    export_request: schemas.BiometryExportRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Экспорт 3D модели для биометрии"""
    start_time = time.time()
    logger.info(f"Начало экспорта 3D модели биометрии: session_id={export_request.session_id}, format={export_request.export_format.value}")
    
    try:
        session = crud.biometry_session.get_with_model(db, session_id=export_request.session_id)
        if not session:
            logger.warning(f"Сессия биометрии не найдена: {export_request.session_id}")
            raise HTTPException(status_code=404, detail="Biometry session not found")
        
        if not session.model:
            logger.warning(f"Модель не найдена в сессии: {export_request.session_id}")
            raise HTTPException(status_code=404, detail="No model found in session")
        
        if not os.path.exists(str(session.model.file_path)):
            logger.error(f"Файл модели не найден на диске: {session.model.file_path}")
            raise HTTPException(status_code=404, detail="Model file not found on disk")
        
        timestamp = int(time.time())
        export_filename = f"biometry_model_export_{timestamp}.{export_request.export_format.value}"
        export_path = generate_biometry_file_path(export_filename, "export")
        
        logger.info(f"Конвертация модели в формат {export_request.export_format.value}: {export_path}")
        
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
        
        if os.path.exists(export_path):
            exported_file_hash = hashlib.md5(open(export_path, 'rb').read()).hexdigest()
            logger.debug(f"Хэш экспортированного файла: {exported_file_hash}")
        
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
    """Скачивание экспортированной модели для биометрии"""
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
        raise
    except Exception as e:
        execution_time = time.time() - start_time
        logger.error(f"Ошибка скачивания экспортированной модели за {execution_time:.3f} секунд: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to download exported model")
