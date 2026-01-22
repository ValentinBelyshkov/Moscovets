from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel

from app.models.file import FileType

# Shared properties
class FileBase(BaseModel):
    patient_id: int
    file_path: str
    file_type: FileType
    description: Optional[str] = None
    metadata_json: Optional[str] = None

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
    created_at: datetime

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