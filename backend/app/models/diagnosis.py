from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Diagnosis(Base):
    """Диагнозы пациента"""
    __tablename__ = "diagnoses"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    
    # Код диагноза (МКБ-10 или другая классификация)
    diagnosis_code = Column(String(20), nullable=True)
    
    # Текст диагноза
    diagnosis_text = Column(Text, nullable=False)
    
    # Тип диагноза
    diagnosis_type = Column(String(50), nullable=True)  # preliminary, final, differential
    
    # Категория
    category = Column(String(100), nullable=True)  # skeletal, dental, soft_tissue, functional
    
    # Тяжесть
    severity = Column(String(20), nullable=True)  # mild, moderate, severe
    
    # Хронический диагноз?
    is_chronic = Column(Boolean, default=False)
    
    # Активный диагноз?
    is_active = Column(Boolean, default=True)
    
    # Даты
    diagnosed_date = Column(Date, nullable=False)
    resolved_date = Column(Date, nullable=True)
    
    # Заметки
    notes = Column(Text, nullable=True)
    
    # Временные метки
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    patient = relationship("Patient", back_populates="diagnoses")
    treatment_plans = relationship("TreatmentPlan", back_populates="diagnosis")

# Добавляем relationship к Patient
from app.models.patient import Patient
Patient.diagnoses = relationship("Diagnosis", back_populates="patient", cascade="all, delete-orphan")
