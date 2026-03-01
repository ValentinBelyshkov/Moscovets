"""
Biometry models.
"""
from sqlalchemy import Column, Integer, ForeignKey, DateTime, Enum, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.base_3d_model import BaseModel3D
from app.enums import BiometryStatus
import logging

logger = logging.getLogger(__name__)


class BiometryModel(BaseModel3D):
    __tablename__ = "biometry_models"
    
    def __repr__(self):
        return f"<BiometryModel(id={self.id}, patient_id={self.patient_id}, model_type={self.model_type}, original_filename='{self.original_filename}')>"
    
    def __str__(self):
        logger.debug(f"BiometryModel: id={self.id}, patient_id={self.patient_id}, type={self.model_type}")
        return self.__repr__()
    
    # Статус обработки
    status = Column(Enum(BiometryStatus, name="biometry_status"), default=BiometryStatus.UPLOADED)
    
    # Relationship to BiometrySession
    session = relationship("BiometrySession", back_populates="model")


class BiometrySession(Base):
    __tablename__ = "biometry_sessions"
    
    def __repr__(self):
        return f"<BiometrySession(id={self.id}, patient_id={self.patient_id}, model_id={self.model_id}, status={self.status})>"
    
    def __str__(self):
        logger.debug(f"BiometrySession: id={self.id}, patient_id={self.patient_id}")
        return self.__repr__()
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    
    # Ссылки на модели
    model_id = Column(Integer, ForeignKey("biometry_models.id"), nullable=True)
    
    # Параметры биометрии
    calibration_points = Column(JSON, nullable=True)
    transformation_matrix = Column(JSON, nullable=True)
    
    # Статус сессии
    status = Column(Enum(BiometryStatus, name="biometry_session_status"), default=BiometryStatus.UPLOADED)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    patient = relationship("Patient", back_populates="biometry_sessions")
    model = relationship("BiometryModel", back_populates="session")
