from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from enum import Enum as PyEnum
from app.models.patient import Patient

class MedicalRecordType(PyEnum):
    CEPHALOMETRY = "cephalometry"  # Цефалометрический анализ
    CT = "ct"  # КТ анализ
    PHOTOMETRY = "photometry"  # Фотометрический анализ
    BIOMETRY = "biometry"  # Биометрический анализ
    MODELING = "modeling"  # 3D моделирование
    ANAMNESIS = "anamnesis"  # Анамнез пациента

class MedicalRecordHistory(Base):
    __tablename__ = "medical_record_history"
    
    id: int = Column(Integer, primary_key=True, index=True)
    medical_record_id: int = Column(Integer, ForeignKey("medical_records.id"), nullable=False)
    data: str = Column(Text, nullable=True)  # JSON data for the record
    notes: str = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_by: str = Column(String, nullable=True)  # User who made the change
    
    # Relationship
    medical_record = relationship("MedicalRecord", back_populates="history")

class MedicalRecord(Base):
    __tablename__ = "medical_records"
    
    id: int = Column(Integer, primary_key=True, index=True)
    patient_id: int = Column(Integer, ForeignKey("patients.id"), nullable=False)
    record_type: MedicalRecordType = Column(Enum(MedicalRecordType, name="medical_record_type"), nullable=False)
    data: str = Column(Text, nullable=True)  # JSON data for the record
    notes: str = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    patient = relationship("Patient", back_populates="medical_records")
    history = relationship("MedicalRecordHistory", back_populates="medical_record", cascade="all, delete-orphan")

# Add relationship to Patient model
Patient.medical_records = relationship("MedicalRecord", back_populates="patient")