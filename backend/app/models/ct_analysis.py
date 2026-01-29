from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class CTAnalysis(Base):
    """КТ анализ пациента"""
    __tablename__ = "ct_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    scan_date = Column(Date, nullable=False)  # Дата проведения КТ
    
    # Ссылка на архив DICOM
    archive_id = Column(Integer, ForeignKey("files.id"), nullable=True)
    
    # Измерения ВНЧС (височно-нижнечелюстной сустав)
    # {"right": {"closed": {"x": 0, "y": 0}, "open": {"x": 5, "y": 3}}, "left": {...}}
    tmj_measurements = Column(JSON, nullable=True)
    
    # Срезы зубов
    # {"upper": {"width": [8.5, 7.2, ...], "bone_thickness": [2.1, 1.9, ...]}, "lower": {...}}
    tooth_measurements = Column(JSON, nullable=True)
    
    # Pen-анализ (наклон моляров)
    # {"upper": {"molar_inclination": 85}, "lower": {"molar_inclination": 92}}
    pen_analysis = Column(JSON, nullable=True)
    
    # Базальная ширина
    # {"upper": 45.2, "lower": 42.8, "deficit": 2.4}
    basal_width = Column(JSON, nullable=True)
    
    # Воздухоносные пути
    # {"tongue_position": "normal", "airway_volume": 12500, "maxillary_sinus_volume": 25000, ...}
    airway_measurements = Column(JSON, nullable=True)
    
    # Другие измерения (размеры челюстей, высоты лица и т.д.)
    other_measurements = Column(JSON, nullable=True)
    
    # Заключение
    findings = Column(Text, nullable=True)
    
    # Заметки врача
    notes = Column(Text, nullable=True)
    
    # Временные метки
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    patient = relationship("Patient", back_populates="ct_analyses")
    archive = relationship("File", foreign_keys=[archive_id])

# Добавляем relationship к Patient
from app.models.patient import Patient
Patient.ct_analyses = relationship("CTAnalysis", back_populates="patient", cascade="all, delete-orphan")
