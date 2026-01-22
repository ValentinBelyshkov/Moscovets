from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from enum import Enum as PyEnum

class DocumentType(PyEnum):
    PRESENTATION = "presentation"
    MEDICAL_CARD = "medical_card"

class DocumentFormat(PyEnum):
    PDF = "pdf"
    PPTX = "pptx"
    X = "x"

class Document(Base):
    __tablename__ = "documents"
    
    id: int = Column(Integer, primary_key=True, index=True)
    patient_id: int = Column(Integer, ForeignKey("patients.id"), nullable=False)
    document_type: DocumentType = Column(Enum(DocumentType, name="document_type"), nullable=False)
    file_path: str = Column(String, nullable=False)
    format: DocumentFormat = Column(Enum(DocumentFormat, name="document_format"), nullable=False)
    generated_at = Column(Date, server_default=func.now(), nullable=False)
    metadata_json: str = Column(Text, nullable=True)  # JSON metadata
    
    # Relationship
    patient = relationship("Patient", back_populates="documents")

# Add relationship to Patient model
from app.models.patient import Patient
Patient.documents = relationship("Document", back_populates="patient")