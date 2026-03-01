"""
Base CRUD operations for session-like models.
Centralizes common session operations.
"""
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar

from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")


class CRUDSession(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Base CRUD class for session-like models with common operations.
    """
    
    def __init__(self, model: Type[ModelType]):
        self.model = model
    
    def get(self, db: Session, id: int) -> Optional[ModelType]:
        return db.query(self.model).filter(self.model.id == id).first()
    
    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        return db.query(self.model).offset(skip).limit(limit).all()
    
    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        db_obj = self.model(**obj_in.model_dump() if hasattr(obj_in, 'model_dump') else obj_in.dict())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self,
        db: Session,
        *,
        db_obj: ModelType,
        obj_in: UpdateSchemaType
    ) -> ModelType:
        obj_data = obj_in.model_dump(exclude_unset=True) if hasattr(obj_in, 'model_dump') else obj_in.dict(exclude_unset=True)
        for field, value in obj_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def remove(self, db: Session, *, id: int) -> ModelType:
        obj = db.query(self.model).get(id)
        db.delete(obj)
        db.commit()
        return obj
    
    def get_by_patient(
        self,
        db: Session,
        *,
        patient_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[ModelType]:
        """
        Get all sessions for a specific patient.
        
        Args:
            db: Database session
            patient_id: Patient ID
            skip: Number of records to skip
            limit: Maximum number of records to return
        
        Returns:
            List of sessions for the patient
        """
        return db.query(self.model).filter(
            self.model.patient_id == patient_id,
            self.model.is_active == True
        ).offset(skip).limit(limit).all()
    
    def update_parameters(
        self,
        db: Session,
        *,
        db_obj: ModelType,
        parameters: Dict[str, Any]
    ) -> ModelType:
        """
        Update session parameters.
        
        Args:
            db: Database session
            db_obj: Session object to update
            parameters: Dictionary of parameters to update
        
        Returns:
            Updated session object
        """
        for field, value in parameters.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
