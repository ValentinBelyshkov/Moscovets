from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, DateTime, Enum, Boolean, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from enum import Enum as PyEnum

class MedicalFileType(PyEnum):
    # Медицинские изображения
    PHOTO = "photo"  # Клинические фотографии
    XRAY = "xray"    # Рентгенограммы
    PANORAMIC = "panoramic"  # Панорамные снимки
    
    # КТ и МРТ данные
    CT_SCAN = "ct_scan"  # Компьютерная томография
    DICOM = "dicom"      # DICOM файлы
    MRI = "mri"          # Магнитно-резонансная томография
    
    # 3D модели
    STL_MODEL = "stl_model"  # STL модели для 3D печати
    OBJ_MODEL = "obj_model" # OBJ 3D модели
    PLY_MODEL = "ply_model"  # PLY 3D модели
    
    # Документы
    PDF = "pdf"
    DOCUMENT = "document"  # Word, текстовые файлы
    REPORT = "report"     # Медицинские отчеты
    
    # Прочие
    OTHER = "other"

class FileVersionType(PyEnum):
    BASELINE = "baseline"      # Исходная версия
    FOLLOWUP = "followup"      # Контрольная версия
    TREATMENT = "treatment"    # Связанная с лечением
    SURGICAL = "surgical"      # Хирургическая версия
    FINAL = "final"           # Финальная версия

class FileVersion(Base):
    __tablename__ = "file_versions"
    
    id: int = Column(Integer, primary_key=True, index=True)
    file_id: int = Column(Integer, ForeignKey("files.id"), nullable=False)
    version_number: int = Column(Integer, nullable=False)
    file_path: str = Column(String, nullable=False)
    file_hash: str = Column(String(64), nullable=True)  # SHA256 для контроля целостности
    file_size: int = Column(BigInteger, nullable=True)   # Размер файла в байтах
    version_type: FileVersionType = Column(Enum(FileVersionType, name="file_version_type"), default=FileVersionType.BASELINE)
    version_description: str = Column(Text, nullable=True)  # Описание изменений в версии
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    created_by: int = Column(Integer, ForeignKey("users.id"), nullable=True)  # Кто создал версию
    
    # Relationship
    file = relationship("File", back_populates="versions")
    user = relationship("User", back_populates="created_file_versions")

class File(Base):
    __tablename__ = "files"
    
    id: int = Column(Integer, primary_key=True, index=True)
    patient_id: int = Column(Integer, ForeignKey("patients.id"), nullable=False)
    name: str = Column(String(255), nullable=False)  # Original filename
    file_path: str = Column(String, nullable=False)
    file_type: MedicalFileType = Column(Enum(MedicalFileType, name="medical_file_type"), nullable=False)
    description: str = Column(Text, nullable=True)
    metadata_json: str = Column(Text, nullable=True)  # JSON метаданные
    
    # Медицинские специфичные поля
    medical_category: str = Column(String(50), nullable=True)  # clinical, diagnostic, treatment, surgical
    study_date: Date = Column(Date, nullable=True)  # Дата исследования/съемки
    body_part: str = Column(String(100), nullable=True)  # Область тела (зубы, челюсть, и т.д.)
    image_orientation: str = Column(String(50), nullable=True)  # orientation для медицинских изображений
    
    # Техническая информация
    file_size: int = Column(BigInteger, nullable=True)
    mime_type: str = Column(String(100), nullable=True)
    file_hash: str = Column(String(64), nullable=True)  # SHA256 hash
    
    # Временные метки
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active: bool = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    patient = relationship("Patient", back_populates="files")
    versions = relationship("FileVersion", back_populates="file", cascade="all, delete-orphan")

# Add relationship to Patient model
from app.models.patient import Patient
Patient.files = relationship("File", back_populates="patient")