"""
File models.
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, DateTime, Enum, Boolean, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base
from app.enums import MedicalFileType, FileVersionType


class FileVersion(Base):
    __tablename__ = "file_versions"
    
    id: int = Column(Integer, primary_key=True, index=True)
    file_id: int = Column(Integer, ForeignKey("files.id"), nullable=False)
    version_number: int = Column(Integer, nullable=False)
    file_path: str = Column(String, nullable=False)
    file_hash: str = Column(String(64), nullable=True)
    file_size: int = Column(BigInteger, nullable=True)
    version_type: FileVersionType = Column(Enum(FileVersionType, name="file_version_type"), default=FileVersionType.BASELINE)
    version_description: str = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    created_by: int = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationship
    file = relationship("File", back_populates="versions")
    user = relationship("User", back_populates="created_file_versions")


class File(Base):
    __tablename__ = "files"
    
    id: int = Column(Integer, primary_key=True, index=True)
    patient_id: int = Column(Integer, ForeignKey("patients.id"), nullable=False)
    name: str = Column(String(255), nullable=False)
    file_path: str = Column(String, nullable=False)
    file_type: MedicalFileType = Column(Enum(MedicalFileType, name="medical_file_type"), nullable=False)
    description: str = Column(Text, nullable=True)
    metadata_json: str = Column(Text, nullable=True)
    
    # Медицинские специфичные поля
    medical_category: str = Column(String(50), nullable=True)
    study_date: Date = Column(Date, nullable=True)
    body_part: str = Column(String(100), nullable=True)
    image_orientation: str = Column(String(50), nullable=True)
    
    # Техническая информация
    file_size: int = Column(BigInteger, nullable=True)
    mime_type: str = Column(String(100), nullable=True)
    file_hash: str = Column(String(64), nullable=True)
    
    # Временные метки
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active: bool = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    patient = relationship("Patient", back_populates="files")
    versions = relationship("FileVersion", back_populates="file", cascade="all, delete-orphan")
