"""
Exports all schemas.
"""
from app.schemas.custom_config import CustomConfig
from app.schemas.user import User, UserCreate, UserUpdate
from app.schemas.patient import Patient, PatientCreate, PatientUpdate
from app.schemas.medical_record import MedicalRecord, MedicalRecordCreate, MedicalRecordUpdate, MedicalRecordWithHistory
from app.schemas.file import File, FileCreate, FileUpdate, FileWithVersions, FileVersion
from app.schemas.document import Document, DocumentCreate, DocumentUpdate
from app.schemas.token import Token
from app.schemas.modeling import (
    ModelUploadResponse, ThreeDModel, ThreeDModelCreate, ThreeDModelUpdate,
    ModelingSession, ModelingSessionCreate, ModelingSessionUpdate, ModelingSessionWithModels,
    ModelAssemblyRequest, ModelAssemblyResponse, OcclusionPadRequest, OcclusionPadResponse,
    ModelExportRequest, ModelExportResponse, ModelAnalysisRequest, ModelAnalysisResponse
)
from app.schemas.biometry import (
    BiometryModel, BiometryModelCreate, BiometryModelUpdate, BiometrySession,
    BiometrySessionCreate, BiometrySessionUpdate, BiometrySessionWithModel,
    BiometryModelUploadResponse, BiometryModelAnalysisResponse,
    BiometryCalibrationRequest, BiometryCalibrationResponse,
    BiometryExportRequest, BiometryExportResponse,
    ModelPoint, MapPoint, Pair, CreateModelPoint, CreateMapPoint, CreatePair,
    CalibrationPoint, CalibrationExport, ObjUploadResponse, StatusResponse
)

__all__ = [
    "CustomConfig",
    "User", "UserCreate", "UserUpdate",
    "Patient", "PatientCreate", "PatientUpdate",
    "MedicalRecord", "MedicalRecordCreate", "MedicalRecordUpdate", "MedicalRecordWithHistory",
    "File", "FileCreate", "FileUpdate", "FileWithVersions", "FileVersion",
    "Document", "DocumentCreate", "DocumentUpdate",
    "Token",
    "ModelUploadResponse", "ThreeDModel", "ThreeDModelCreate", "ThreeDModelUpdate",
    "ModelingSession", "ModelingSessionCreate", "ModelingSessionUpdate", "ModelingSessionWithModels",
    "ModelAssemblyRequest", "ModelAssemblyResponse", "OcclusionPadRequest", "OcclusionPadResponse",
    "ModelExportRequest", "ModelExportResponse", "ModelAnalysisRequest", "ModelAnalysisResponse",
    "BiometryModel", "BiometryModelCreate", "BiometryModelUpdate", "BiometrySession",
    "BiometrySessionCreate", "BiometrySessionUpdate", "BiometrySessionWithModel",
    "BiometryModelUploadResponse", "BiometryModelAnalysisResponse",
    "BiometryCalibrationRequest", "BiometryCalibrationResponse",
    "BiometryExportRequest", "BiometryExportResponse",
    "ModelPoint", "MapPoint", "Pair", "CreateModelPoint", "CreateMapPoint", "CreatePair",
    "CalibrationPoint", "CalibrationExport", "ObjUploadResponse", "StatusResponse"
]
