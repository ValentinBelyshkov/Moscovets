"""
Modeling models.
Uses shared enums and base classes to avoid duplication.
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.base_3d_model import BaseModel3D
from app.schemas.shared_enums import ModelingStatus, ModelType, ModelFormat


class ThreeDModel(BaseModel3D):
    __tablename__ = "three_d_models"
    pass


class ModelingSession(Base):
    __tablename__ = "modeling_sessions"
    
    id: int = Column(Integer, primary_key=True, index=True)
    patient_id: int = Column(Integer, ForeignKey("patients.id"), nullable=False)
    
    # Ссылки на модели
    upper_jaw_id: int = Column(Integer, ForeignKey("three_d_models.id"), nullable=True)
    lower_jaw_id: int = Column(Integer, ForeignKey("three_d_models.id"), nullable=True)
    bite1_id: int = Column(Integer, ForeignKey("three_d_models.id"), nullable=True)
    bite2_id: int = Column(Integer, ForeignKey("three_d_models.id"), nullable=True)
    occlusion_pad_id: int = Column(Integer, ForeignKey("three_d_models.id"), nullable=True)
    
    # Параметры моделирования
    cement_gap: Float = Column(Float, default=0.1)
    insertion_path: String = Column(String, default="vertical")
    border_thickness: Float = Column(Float, default=0.5)
    smoothing_strength: Float = Column(Float, default=0.5)
    auto_adaptation: Boolean = Column(Boolean, default=True)
    
    # Статус моделирования
    status: ModelingStatus = Column(Enum(ModelingStatus, name="modeling_status"), default=ModelingStatus.UPLOADED)
    
    # Дополнительные параметры
    modeling_parameters: JSON = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active: bool = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    patient = relationship("Patient", back_populates="modeling_sessions")
    upper_jaw = relationship("ThreeDModel", foreign_keys=[upper_jaw_id])
    lower_jaw = relationship("ThreeDModel", foreign_keys=[lower_jaw_id])
    bite1 = relationship("ThreeDModel", foreign_keys=[bite1_id])
    bite2 = relationship("ThreeDModel", foreign_keys=[bite2_id])
    occlusion_pad = relationship("ThreeDModel", foreign_keys=[occlusion_pad_id])
