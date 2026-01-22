from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, DateTime, Enum, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from enum import Enum as PyEnum
from app.models.patient import Patient
from app.models.base_3d_model import BaseModel3D, ModelType, ModelFormat

class ModelingStatus(PyEnum):
    UPLOADED = "uploaded"
    ASSEMBLED = "assembled"
    PAD_CREATED = "pad_created"
    EDITED = "edited"
    EXPORTED = "exported"

class ThreeDModel(BaseModel3D):
    __tablename__ = "three_d_models"
    
    modeling_session = relationship("ModelingSession", back_populates="model", uselist=False)

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
    cement_gap: Float = Column(Float, default=0.1)  # Цементный зазор в мм
    insertion_path: String = Column(String, default="vertical")  # vertical, horizontal, custom
    border_thickness: Float = Column(Float, default=0.5)  # Толщина границ в мм
    smoothing_strength: Float = Column(Float, default=0.5)  # Сила сглаживания
    auto_adaptation: Boolean = Column(Boolean, default=True)  # Автоматическая адаптация
    
    # Статус моделирования
    status: ModelingStatus = Column(Enum(ModelingStatus, name="modeling_status"), default=ModelingStatus.UPLOADED)
    
    # Дополнительные параметры
    modeling_parameters: JSON = Column(JSON, nullable=True)  # Дополнительные параметры в JSON
    
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
    
    # Обратная связь для модели
    model = relationship("ThreeDModel", back_populates="modeling_session", foreign_keys=[ThreeDModel.id])

# Add relationships to Patient model - this was moved to patient.py to avoid circular imports
pass