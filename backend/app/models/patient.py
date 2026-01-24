from sqlalchemy import Column, Integer, String, Date, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from enum import Enum as PyEnum

class Gender(PyEnum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class Patient(Base):
    __tablename__ = "patients"
    
    id: int = Column(Integer, primary_key=True, index=True)
    full_name: str = Column(String, nullable=False)
    birth_date: Date = Column(Date, nullable=False)
    gender: Gender = Column(Enum(Gender, name="gender"), nullable=False)
    contact_info: str = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __init__(self, full_name: str, birth_date: Date, gender: Gender, contact_info: str = ""):
        self.full_name = full_name
        self.birth_date = birth_date
        self.gender = gender
        self.contact_info = contact_info

# Добавляем relationship вручную после определения класса
Patient.three_d_models = relationship("ThreeDModel", back_populates="patient")
Patient.modeling_sessions = relationship("ModelingSession", back_populates="patient")
Patient.biometry_models = relationship("BiometryModel", back_populates="patient")
Patient.biometry_sessions = relationship("BiometrySession", back_populates="patient")
Patient.documents = relationship("Document", back_populates="patient")
Patient.files = relationship("File", back_populates="patient")
Patient.medical_records = relationship("MedicalRecord", back_populates="patient")