from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, DateTime, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from enum import Enum as PyEnum

class FileType(PyEnum):
    IMAGE = "image"
    PDF = "pdf"
    DOCUMENT = "document"
    OTHER = "other"

class FileVersion(Base):
    __tablename__ = "file_versions"
    
    id: int = Column(Integer, primary_key=True, index=True)
    file_id: int = Column(Integer, ForeignKey("files.id"), nullable=False)
    version_number: int = Column(Integer, nullable=False)
    file_path: str = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationship
    file = relationship("File", back_populates="versions")

class File(Base):
    __tablename__ = "files"
    
    id: int = Column(Integer, primary_key=True, index=True)
    patient_id: int = Column(Integer, ForeignKey("patients.id"), nullable=False)
    file_path: str = Column(String, nullable=False)
    file_type: FileType = Column(Enum(FileType, name="file_type"), nullable=False)
    description: str = Column(Text, nullable=True)
    metadata_json: str = Column(Text, nullable=True)  # JSON metadata
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active: bool = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    patient = relationship("Patient", back_populates="files")
    versions = relationship("FileVersion", back_populates="file", cascade="all, delete-orphan")

# Add relationship to Patient model
from app.models.patient import Patient
Patient.files = relationship("File", back_populates="patient")