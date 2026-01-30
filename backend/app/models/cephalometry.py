from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class CephalometryAnalysis(Base):
    """Цефалометрический анализ пациента"""
    __tablename__ = "cephalometry_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    analysis_date = Column(DateTime, nullable=False, server_default=func.now())
    
    # Ссылки на рентгеновские снимки
    lateral_xray_id = Column(Integer, ForeignKey("files.id"), nullable=True)  # Боковая проекция
    frontal_xray_id = Column(Integer, ForeignKey("files.id"), nullable=True)  # Прямая проекция
    
    # Цефалометрические точки (JSON)
    # {"S": {"x": 0, "y": 0}, "N": {"x": 10, "y": 20}, ...}
    points = Column(JSON, nullable=True)
    
    # Углы (JSON)
    # {"SNA": 82, "SNB": 80, "ANB": 2, "gonial_angle": 125, "y_axis": 59}
    angles = Column(JSON, nullable=True)
    
    # Расстояния (JSON)
    # {"sella_nasion": 70, "nasion_a": 55, "a_b": 45}
    distances = Column(JSON, nullable=True)
    
    # Общие измерения (JSON для расширяемости)
    measurements = Column(JSON, nullable=True)
    
    # Интерпретация результатов
    interpretation = Column(Text, nullable=True)
    
    # Заметки врача
    notes = Column(Text, nullable=True)
    
    # Временные метки
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    patient = relationship("Patient", back_populates="cephalometry_analyses")
    lateral_xray = relationship("File", foreign_keys=[lateral_xray_id])
    frontal_xray = relationship("File", foreign_keys=[frontal_xray_id])

# Добавляем relationship к Patient
from app.models.patient import Patient
Patient.cephalometry_analyses = relationship("CephalometryAnalysis", back_populates="patient", cascade="all, delete-orphan")
