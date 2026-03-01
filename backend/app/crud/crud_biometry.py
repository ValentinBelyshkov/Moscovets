"""
CRUD operations for biometry module.
Uses shared utilities to avoid duplication.
"""
from sqlalchemy.orm import Session
import logging
import time
from typing import Optional, List, Dict, Any
from pathlib import Path

from app.crud.base import CRUDBase
from app.crud.file_utils import (
    generate_file_path,
    get_file_size,
    validate_3d_model_file,
    save_file_content
)
from app.models.biometry import BiometryModel, BiometrySession
from app.schemas.biometry import BiometryModelCreate, BiometryModelUpdate, BiometrySessionCreate, BiometrySessionUpdate
from app.schemas.shared_enums import ModelType

logger = logging.getLogger(__name__)


class CRUDBiometryModel(CRUDBase[BiometryModel, BiometryModelCreate, BiometryModelUpdate]):
    """CRUD operations for biometry models"""
    
    def create_with_file(
        self,
        db: Session,
        *,
        obj_in: BiometryModelCreate,
        file_content: bytes
    ) -> BiometryModel:
        """Create biometry model with file"""
        logger.info(f"Создание записи модели биометрии: patient_id={obj_in.patient_id}, type={obj_in.model_type}")
        
        db_obj = BiometryModel(
            patient_id=obj_in.patient_id,
            model_type=obj_in.model_type,
            model_format=obj_in.model_format,
            file_path=obj_in.file_path,
            original_filename=obj_in.original_filename,
            file_size=obj_in.file_size,
            scale=obj_in.scale,
            position_x=obj_in.position_x,
            position_y=obj_in.position_y,
            position_z=obj_in.position_z,
            rotation_x=obj_in.rotation_x,
            rotation_y=obj_in.rotation_y,
            rotation_z=obj_in.rotation_z,
            vertices_count=obj_in.vertices_count,
            faces_count=obj_in.faces_count,
            bounding_box=obj_in.bounding_box,
            status=obj_in.status,
            is_active=True
        )
        
        try:
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            logger.debug(f"Запись в базе данных создана с ID: {db_obj.id}")
            
            # Save file to disk
            save_file_content(obj_in.file_path, file_content)
            logger.info(f"Модель биометрии успешно создана: ID={db_obj.id}")
            return db_obj
        except Exception as e:
            logger.error(f"Ошибка создания модели биометрии: {str(e)}")
            db.rollback()
            raise


class CRUDBiometrySession(CRUDBase[BiometrySession, BiometrySessionCreate, BiometrySessionUpdate]):
    """CRUD operations for biometry sessions"""
    
    def create_with_model(
        self,
        db: Session,
        *,
        obj_in: BiometrySessionCreate
    ) -> BiometrySession:
        """Create biometry session with model"""
        start_time = time.time()
        logger.info(f"Начало создания сессии биометрии для пациента {obj_in.patient_id}")
        
        db_obj = BiometrySession(
            patient_id=obj_in.patient_id,
            model_id=obj_in.model_id,
            calibration_points=obj_in.calibration_points,
            transformation_matrix=obj_in.transformation_matrix,
            status=obj_in.status,
            is_active=True
        )
        
        try:
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            
            execution_time = time.time() - start_time
            logger.info(f"Сессия биометрии создана за {execution_time:.3f} сек, ID={db_obj.id}")
            return db_obj
        except Exception as e:
            logger.error(f"Ошибка создания сессии биометрии: {str(e)}")
            db.rollback()
            raise
    
    def get_by_patient(
        self,
        db: Session,
        *,
        patient_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[BiometrySession]:
        """Get all biometry sessions for a patient"""
        return db.query(BiometrySession).filter(
            BiometrySession.patient_id == patient_id,
            BiometrySession.is_active == True
        ).offset(skip).limit(limit).all()
    
    def get_with_model(
        self,
        db: Session,
        *,
        session_id: int
    ) -> Optional[BiometrySession]:
        """Get biometry session with model"""
        session = db.query(BiometrySession).filter(BiometrySession.id == session_id).first()
        if session and session.model_id:
            session.model = db.query(BiometryModel).filter(BiometryModel.id == session.model_id).first()
        return session
    
    def update_parameters(
        self,
        db: Session,
        *,
        db_obj: BiometrySession,
        parameters: Dict[str, Any]
    ) -> BiometrySession:
        """Update biometry session parameters"""
        for field, value in parameters.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        try:
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except Exception as e:
            logger.error(f"Ошибка обновления параметров сессии: {str(e)}")
            db.rollback()
            raise


# Utility functions - using shared utilities
def generate_biometry_file_path(original_filename: str, model_type: str) -> str:
    """Generate unique file path for biometry model"""
    return generate_file_path(original_filename, model_type, "biometry_models")


def validate_biometry_file(filename: str) -> bool:
    """Validate if file is a supported biometry model format"""
    return validate_3d_model_file(filename)


# Create CRUD instances
biometry_model = CRUDBiometryModel(BiometryModel)
biometry_session = CRUDBiometrySession(BiometrySession)
