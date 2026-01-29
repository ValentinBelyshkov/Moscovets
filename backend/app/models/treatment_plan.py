from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class TreatmentPlan(Base):
    """План лечения пациента"""
    __tablename__ = "treatment_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    diagnosis_id = Column(Integer, ForeignKey("diagnoses.id"), nullable=True)
    
    # Название плана
    plan_name = Column(String(200), nullable=False)
    
    # Описание
    description = Column(Text, nullable=True)
    
    # Даты
    start_date = Column(Date, nullable=False)
    expected_end_date = Column(Date, nullable=True)
    actual_end_date = Column(Date, nullable=True)
    
    # Статус
    status = Column(String(50), default="active")  # active, completed, cancelled, suspended, pending
    
    # Фазы лечения (JSON)
    # [{"phase": 1, "name": "Подготовительная", "duration_months": 3, "objectives": [...]}]
    phases = Column(JSON, nullable=True)
    
    # Цели лечения (JSON)
    # [{"objective": "Исправление прикуса", "priority": "high", "status": "in_progress"}]
    objectives = Column(JSON, nullable=True)
    
    # Аппараты и приспособления (JSON)
    # [{"appliance": "Брекет-система", "type": "metal", "start_date": "2025-01-01"}]
    appliances = Column(JSON, nullable=True)
    
    # Прогнозируемые результаты
    expected_outcomes = Column(Text, nullable=True)
    
    # Заметки
    notes = Column(Text, nullable=True)
    
    # Временные метки
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    patient = relationship("Patient", back_populates="treatment_plans")
    diagnosis = relationship("Diagnosis", back_populates="treatment_plans")

# Добавляем relationship к Patient
from app.models.patient import Patient
Patient.treatment_plans = relationship("TreatmentPlan", back_populates="patient", cascade="all, delete-orphan")
