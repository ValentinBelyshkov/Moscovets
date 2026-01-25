from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from enum import Enum as PyEnum

from app.models.file import MedicalFileType, FileVersionType

# Enum schemas for API
class MedicalFileTypeSchema(str, PyEnum):
    PHOTO = "photo"
    XRAY = "xray"
    PANORAMIC = "panoramic"
    CT_SCAN = "ct_scan"
    DICOM = "dicom"
    MRI = "mri"
    STL_MODEL = "stl_model"
    OBJ_MODEL = "obj_model"
    PLY_MODEL = "ply_model"
    PDF = "pdf"
    DOCUMENT = "document"
    REPORT = "report"
    OTHER = "other"

class FileVersionTypeSchema(str, PyEnum):
    BASELINE = "baseline"
    FOLLOWUP = "followup"
    TREATMENT = "treatment"
    SURGICAL = "surgical"
    FINAL = "final"

# Shared properties
class FileBase(BaseModel):
    patient_id: int
    name: str
    file_path: str
    file_type: MedicalFileTypeSchema
    description: Optional[str] = None
    metadata_json: Optional[str] = None
    
    # Медицинские специфичные поля
    medical_category: Optional[str] = Field(None, description="clinical, diagnostic, treatment, surgical")
    study_date: Optional[date] = None
    body_part: Optional[str] = Field(None, description="Область тела")
    image_orientation: Optional[str] = None
    
    # Техническая информация
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    
    @field_validator('study_date', mode='before')
    @classmethod
    def validate_study_date(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            return datetime.strptime(v, '%Y-%m-%d').date()
        return v

# Properties to receive via API on creation
class FileCreate(FileBase):
    pass

# Properties to receive via API on update
class FileUpdate(FileBase):
    pass

# Properties to return via API
class File(FileBase):
    id: int
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

# Properties for file version
class FileVersion(BaseModel):
    id: int
    file_id: int
    version_number: int
    file_path: str
    file_hash: Optional[str] = None
    file_size: Optional[int] = None
    version_type: FileVersionTypeSchema
    version_description: Optional[str] = None
    created_at: datetime
    created_by: Optional[int] = None

    class Config:
        from_attributes = True

# Properties for file with versions
class FileWithVersions(File):
    versions: List[FileVersion] = []

    class Config:
        from_attributes = True

# Properties for file upload response
class FileUploadResponse(File):
    pass

# New class for model upload response
class ModelUploadResponse(BaseModel):
    model_id: int
    uploaded_at: datetime
    status: str
    message: Optional[str] = None

    model_config = {
        "protected_namespaces": ()
    }