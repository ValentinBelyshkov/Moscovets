from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class PhotometryAnalysis(Base):
    """Фотометрический анализ пациента"""
    __tablename__ = "photometry_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    analysis_date = Column(DateTime, nullable=False, server_default=func.now())
    
    # Ссылки на фотографии
    frontal_photo_id = Column(Integer, ForeignKey("files.id"), nullable=True)  # Анфас
    profile_photo_id = Column(Integer, ForeignKey("files.id"), nullable=True)  # Профиль
    profile45_photo_id = Column(Integer, ForeignKey("files.id"), nullable=True)  # Профиль 45°
    intraoral_photo_id = Column(Integer, ForeignKey("files.id"), nullable=True)  # Интраоральное фото
    
    # Результаты анализа позиций
    upper_lip_position = Column(String(50), nullable=True)  # normal, protruding, retracted
    lower_lip_position = Column(String(50), nullable=True)  # normal, protruding, retracted
    chin_position = Column(String(50), nullable=True)  # normal, forward, backward
    face_type = Column(String(50), nullable=True)  # dolichofacial, mesofacial, brachyfacial
    
    # Пропорции лица (JSON для гибкости)
    proportions = Column(JSON, nullable=True)  # {"upper_third": 0.33, "middle_third": 0.33, "lower_third": 0.34}
    
    # Дополнительные измерения (JSON)
    measurements = Column(JSON, nullable=True)  # Специфические измерения фотометрии
    
    # Заметки врача
    notes = Column(Text, nullable=True)
    
    # Временные метки
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    patient = relationship("Patient", back_populates="photometry_analyses")
    frontal_photo = relationship("File", foreign_keys=[frontal_photo_id])
    profile_photo = relationship("File", foreign_keys=[profile_photo_id])
    profile45_photo = relationship("File", foreign_keys=[profile45_photo_id])
    intraoral_photo = relationship("File", foreign_keys=[intraoral_photo_id])

# Добавляем relationship к Patient
from app.models.patient import Patient
Patient.photometry_analyses = relationship("PhotometryAnalysis", back_populates="patient", cascade="all, delete-orphan")
