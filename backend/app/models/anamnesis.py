from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Anamnesis(Base):
    """Анамнез пациента"""
    __tablename__ = "anamnesis"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, unique=True)
    
    # Основная жалоба (дублирует complaints из Patient для истории)
    chief_complaint = Column(Text, nullable=True)
    
    # Медицинская история
    medical_history = Column(Text, nullable=True)  # История болезней
    dental_history = Column(Text, nullable=True)  # История стоматологических проблем
    
    # Семейный анамнез
    family_history = Column(Text, nullable=True)  # Наследственные заболевания
    
    # Аллергии и непереносимости
    allergies = Column(Text, nullable=True)
    
    # Текущие лекарства
    medications = Column(Text, nullable=True)
    
    # Хирургические вмешательства в прошлом
    surgical_history = Column(Text, nullable=True)
    
    # Социальный анамнез
    social_history = Column(Text, nullable=True)  # Образ жизни, вредные привычки
    
    # Временные метки
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    patient = relationship("Patient", back_populates="anamnesis")

# Добавляем relationship к Patient (uselist=False для one-to-one)
from app.models.patient import Patient
Patient.anamnesis = relationship("Anamnesis", back_populates="patient", uselist=False, cascade="all, delete-orphan")
