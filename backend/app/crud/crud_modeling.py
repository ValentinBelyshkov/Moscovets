"""
CRUD operations for modeling module.
Uses shared utilities to avoid duplication.
"""
from sqlalchemy.orm import Session
import logging
from typing import Optional, List, Dict, Any

from app.crud.base import CRUDBase
from app.crud.file_utils import (
    generate_file_path,
    validate_3d_model_file
)
from app.models.modeling import ThreeDModel, ModelingSession
from app.schemas.modeling import ThreeDModelCreate, ThreeDModelUpdate, ModelingSessionCreate, ModelingSessionUpdate

logger = logging.getLogger(__name__)


class CRUDThreeDModel(CRUDBase[ThreeDModel, ThreeDModelCreate, ThreeDModelUpdate]):
    """CRUD operations for 3D models"""
    pass


class CRUDModelingSession(CRUDBase[ModelingSession, ModelingSessionCreate, ModelingSessionUpdate]):
    """CRUD operations for modeling sessions"""
    
    def create_with_models(
        self,
        db: Session,
        *,
        obj_in: ModelingSessionCreate
    ) -> ModelingSession:
        """Create modeling session with models"""
        logger.info(f"Создание сессии моделирования для пациента {obj_in.patient_id}")
        
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
            logger.info(f"Сессия моделирования создана: ID={db_obj.id}")
            return db_obj
        except Exception as e:
            logger.error(f"Ошибка создания сессии моделирования: {str(e)}")
            db.rollback()
            raise
    
    def get_by_patient(
        self,
        db: Session,
        *,
        patient_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[ModelingSession]:
        """Get all modeling sessions for a patient"""
        return db.query(ModelingSession).filter(
            ModelingSession.patient_id == patient_id,
            ModelingSession.is_active == True
        ).offset(skip).limit(limit).all()
    
    def get_with_models(
        self,
        db: Session,
        *,
        session_id: int
    ) -> Optional[ModelingSession]:
        """Get modeling session with related models"""
        session = db.query(ModelingSession).filter(ModelingSession.id == session_id).first()
        if session:
            # Load related models
            if session.upper_jaw_id:
                session.upper_jaw = db.query(ThreeDModel).filter(ThreeDModel.id == session.upper_jaw_id).first()
            if session.lower_jaw_id:
                session.lower_jaw = db.query(ThreeDModel).filter(ThreeDModel.id == session.lower_jaw_id).first()
            if session.bite1_id:
                session.bite1 = db.query(ThreeDModel).filter(ThreeDModel.id == session.bite1_id).first()
            if session.bite2_id:
                session.bite2 = db.query(ThreeDModel).filter(ThreeDModel.id == session.bite2_id).first()
            if session.occlusion_pad_id:
                session.occlusion_pad = db.query(ThreeDModel).filter(ThreeDModel.id == session.occlusion_pad_id).first()
        return session
    
    def update_parameters(
        self,
        db: Session,
        *,
        db_obj: ModelingSession,
        parameters: Dict[str, Any]
    ) -> ModelingSession:
        """Update modeling session parameters"""
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
    
    def add_model_to_session(
        self,
        db: Session,
        *,
        session_id: int,
        model_type: str,
        model_id: int
    ) -> Optional[ModelingSession]:
        """Add model to modeling session"""
        session = db.query(ModelingSession).filter(ModelingSession.id == session_id).first()
        if not session:
            return None
        
        # Map model type to session field
        model_type_map = {
            "upper_jaw": "upper_jaw_id",
            "lower_jaw": "lower_jaw_id",
            "bite1": "bite1_id",
            "bite2": "bite2_id",
            "occlusion_pad": "occlusion_pad_id"
        }
        
        field_name = model_type_map.get(model_type)
        if field_name:
            setattr(session, field_name, model_id)
        
        try:
            db.commit()
            db.refresh(session)
            return session
        except Exception as e:
            logger.error(f"Ошибка добавления модели в сессию: {str(e)}")
            db.rollback()
            raise


# Utility functions - using shared utilities
def generate_model_file_path(original_filename: str, model_type: str) -> str:
    """Generate unique file path for 3D model"""
    return generate_file_path(original_filename, model_type, "3d_models")


def validate_model_file(filename: str) -> bool:
    """Validate if file is a supported 3D model format"""
    return validate_3d_model_file(filename)


# Create CRUD instances
three_d_model = CRUDThreeDModel(ThreeDModel)
modeling_session = CRUDModelingSession(ModelingSession)
