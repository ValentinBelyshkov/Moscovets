from sqlalchemy.orm import Session
import logging
from app.crud.base import CRUDBase
from app.models.modeling import ThreeDModel, ModelingSession
from app.schemas.modeling import ThreeDModelCreate, ThreeDModelUpdate, ModelingSessionCreate, ModelingSessionUpdate
from typing import Optional, List, Dict, Any
import os
import uuid
from pathlib import Path

# Настройка логирования для CRUD операций моделирования
logger = logging.getLogger(__name__)

class CRUDThreeDModel(CRUDBase[ThreeDModel, ThreeDModelCreate, ThreeDModelUpdate]):
    pass

class CRUDModelingSession(CRUDBase[ModelingSession, ModelingSessionCreate, ModelingSessionUpdate]):
    def create_with_models(self, db: Session, *, obj_in: ModelingSessionCreate) -> ModelingSession:
        logger.info(f"Создание сессии моделирования для пациента {obj_in.patient_id}")
        logger.debug(f"Session parameters: upper_jaw={obj_in.upper_jaw_id}, lower_jaw={obj_in.lower_jaw_id}, "
                    f"bite1={obj_in.bite1_id}, bite2={obj_in.bite2_id}, occlusion_pad={obj_in.occlusion_pad_id}")
        
        # Create the modeling session record
        db_obj = ModelingSession(
            patient_id=obj_in.patient_id,
            upper_jaw_id=obj_in.upper_jaw_id,
            lower_jaw_id=obj_in.lower_jaw_id,
            bite1_id=obj_in.bite1_id,
            bite2_id=obj_in.bite2_id,
            occlusion_pad_id=obj_in.occlusion_pad_id,
            cement_gap=obj_in.cement_gap,
            insertion_path=obj_in.insertion_path,
            border_thickness=obj_in.border_thickness,
            smoothing_strength=obj_in.smoothing_strength,
            auto_adaptation=obj_in.auto_adaptation,
            modeling_parameters=obj_in.modeling_parameters,
            is_active=True
        )
        
        try:
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            logger.info(f"Сессия моделирования успешно создана: ID={db_obj.id}")
            return db_obj
        except Exception as e:
            logger.error(f"Ошибка создания сессии моделирования: {str(e)}")
            db.rollback()
            raise
    
    def get_by_patient(self, db: Session, *, patient_id: int, skip: int = 0, limit: int = 100) -> List[ModelingSession]:
        logger.debug(f"Получение сессий моделирования по пациенту {patient_id}, skip={skip}, limit={limit}")
        return db.query(ModelingSession).filter(
            ModelingSession.patient_id == patient_id,
            ModelingSession.is_active == True
        ).offset(skip).limit(limit).all()
    
    def get_with_models(self, db: Session, *, session_id: int) -> Optional[ModelingSession]:
        logger.debug(f"Получение сессии моделирования с моделями: {session_id}")
        session = db.query(ModelingSession).filter(ModelingSession.id == session_id).first()
        if session:
            # Load related models
            if session.upper_jaw_id:
                logger.debug(f"Загрузка модели верхней челюсти: {session.upper_jaw_id}")
                session.upper_jaw = db.query(ThreeDModel).filter(ThreeDModel.id == session.upper_jaw_id).first()
            if session.lower_jaw_id:
                logger.debug(f"Загрузка модели нижней челюсти: {session.lower_jaw_id}")
                session.lower_jaw = db.query(ThreeDModel).filter(ThreeDModel.id == session.lower_jaw_id).first()
            if session.bite1_id:
                logger.debug(f"Загрузка модели bite1: {session.bite1_id}")
                session.bite1 = db.query(ThreeDModel).filter(ThreeDModel.id == session.bite1_id).first()
            if session.bite2_id:
                logger.debug(f"Загрузка модели bite2: {session.bite2_id}")
                session.bite2 = db.query(ThreeDModel).filter(ThreeDModel.id == session.bite2_id).first()
            if session.occlusion_pad_id:
                logger.debug(f"Загрузка модели окклюзионной накладки: {session.occlusion_pad_id}")
                session.occlusion_pad = db.query(ThreeDModel).filter(ThreeDModel.id == session.occlusion_pad_id).first()
        return session
    
    def update_session_parameters(self, db: Session, *, db_obj: ModelingSession, parameters: Dict[str, Any]) -> ModelingSession:
        logger.info(f"Обновление параметров сессии моделирования для ID: {db_obj.id}")
        logger.debug(f"Параметры для обновления: {parameters}")
        
        for field, value in parameters.items():
            if hasattr(db_obj, field):
                old_value = getattr(db_obj, field)
                setattr(db_obj, field, value)
                logger.debug(f"Обновлено {field}: {old_value} -> {value}")
        
        try:
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            logger.info(f"Параметры сессии моделирования успешно обновлены для ID: {db_obj.id}")
            return db_obj
        except Exception as e:
            logger.error(f"Ошибка обновления параметров сессии моделирования: {str(e)}")
            db.rollback()
            raise
    
    def add_model_to_session(self, db: Session, *, session_id: int, model_type: str, model_id: int) -> Optional[ModelingSession]:
        logger.info(f"Добавление модели {model_id} типа '{model_type}' в сессию {session_id}")
        
        session = db.query(ModelingSession).filter(ModelingSession.id == session_id).first()
        if not session:
            logger.warning(f"Сессия не найдена: {session_id}")
            return None
        
        if model_type == "upper_jaw":
            session.upper_jaw_id = model_id
        elif model_type == "lower_jaw":
            session.lower_jaw_id = model_id
        elif model_type == "bite1":
            session.bite1_id = model_id
        elif model_type == "bite2":
            session.bite2_id = model_id
        elif model_type == "occlusion_pad":
            session.occlusion_pad_id = model_id
        else:
            logger.warning(f"Неизвестный тип модели: {model_type}")
            return session
        
        try:
            db.commit()
            db.refresh(session)
            logger.info(f"Модель {model_id} успешно добавлена в сессию {session_id}")
            return session
        except Exception as e:
            logger.error(f"Ошибка добавления модели в сессию: {str(e)}")
            db.rollback()
            raise

# Utility functions for file handling
def generate_model_file_path(original_filename: str, model_type: str) -> str:
    """Generate unique file path for 3D model"""
    file_extension = Path(original_filename).suffix
    unique_filename = f"{model_type}_{uuid.uuid4()}{file_extension}"
    return f"uploads/3d_models/{unique_filename}"

def get_file_size(file_content: bytes) -> int:
    """Get file size in bytes"""
    return len(file_content)

def validate_model_file(filename: str) -> bool:
    """Validate if file is a supported 3D model format"""
    supported_extensions = ['.stl', '.obj']
    file_extension = Path(filename).suffix.lower()
    return file_extension in supported_extensions

# Create CRUD instances
three_d_model = CRUDThreeDModel(ThreeDModel)
modeling_session = CRUDModelingSession(ModelingSession)