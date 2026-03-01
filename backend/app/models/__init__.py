"""
Exports all models.
"""
from app.models.user import User
from app.models.patient import Patient
from app.models.file import File, FileVersion
from app.models.medical_record import MedicalRecord, MedicalRecordHistory
from app.models.document import Document
from app.models.modeling import ThreeDModel, ModelingSession
from app.models.biometry import BiometryModel, BiometrySession
from app.models.photometry import PhotometryAnalysis
from app.models.cephalometry import CephalometryAnalysis
from app.models.ct_analysis import CTAnalysis
from app.models.anamnesis import Anamnesis
from app.models.diagnosis import Diagnosis
from app.models.treatment_plan import TreatmentPlan


def setup_all_relationships():
    """Setup all model relationships after all models are imported."""
    from sqlalchemy.orm import relationship
    
    # Patient relationships
    Patient.three_d_models = relationship("ThreeDModel", back_populates="patient")
    Patient.modeling_sessions = relationship("ModelingSession", back_populates="patient")
    Patient.biometry_models = relationship("BiometryModel", back_populates="patient")
    Patient.biometry_sessions = relationship("BiometrySession", back_populates="patient")
    Patient.documents = relationship("Document", back_populates="patient")
    Patient.files = relationship("File", back_populates="patient")
    Patient.medical_records = relationship("MedicalRecord", back_populates="patient")


# Call setup after all models are imported
setup_all_relationships()


__all__ = [
    "User",
    "Patient",
    "File",
    "FileVersion",
    "MedicalRecord",
    "MedicalRecordHistory",
    "Document",
    "ThreeDModel",
    "ModelingSession",
    "BiometryModel",
    "BiometrySession",
    "PhotometryAnalysis",
    "CephalometryAnalysis",
    "CTAnalysis",
    "Anamnesis",
    "Diagnosis",
    "TreatmentPlan",
]
