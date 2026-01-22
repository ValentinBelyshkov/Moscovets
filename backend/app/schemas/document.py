from datetime import date
from typing import Optional
from pydantic import BaseModel

from app.models.document import DocumentType, DocumentFormat

# Shared properties
class DocumentBase(BaseModel):
    patient_id: int
    document_type: DocumentType
    file_path: str
    format: DocumentFormat
    metadata_json: Optional[str] = None

# Properties to receive via API on creation
class DocumentCreate(DocumentBase):
    pass

# Properties to receive via API on update
class DocumentUpdate(DocumentBase):
    pass

# Properties to return via API
class Document(DocumentBase):
    id: int
    generated_at: date

    class Config:
        from_attributes = True