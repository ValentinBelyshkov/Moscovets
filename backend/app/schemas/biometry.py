"""
Pydantic schemas for biometry module.
Uses shared schemas to avoid duplication.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, ConfigDict

from app.schemas.shared_enums import ModelType, ModelFormat, BiometryStatus
from app.schemas.shared_schemas import (
    ThreeDModelBase,
    ThreeDModelUpdate,
    ThreeDModelResponse
)

# Biometry Model schemas

class BiometryModelBase(ThreeDModelBase):
    """Base schema for biometry models"""
    status: BiometryStatus = BiometryStatus.UPLOADED


class BiometryModelCreate(BiometryModelBase):
    """Schema for creating biometry model"""
    pass


class BiometryModelUpdate(ThreeDModelUpdate):
    """Schema for updating biometry model"""
    status: Optional[BiometryStatus] = None


class BiometryModel(BiometryModelResponse):
    """Schema for biometry model response"""
    status: BiometryStatus
    
    class Config:
        from_attributes = True
        protected_namespaces = ()


# Biometry Session schemas

class BiometrySessionBase(BaseModel):
    """Base schema for biometry sessions"""
    patient_id: int
    calibration_points: Optional[Dict[str, Any]] = None
    transformation_matrix: Optional[Dict[str, Any]] = None
    status: BiometryStatus = BiometryStatus.UPLOADED
    
    model_config = ConfigDict(protected_namespaces=())


class BiometrySessionCreate(BiometrySessionBase):
    """Schema for creating biometry session"""
    model_id: Optional[int] = None


class BiometrySessionUpdate(BaseModel):
    """Schema for updating biometry session"""
    calibration_points: Optional[Dict[str, Any]] = None
    transformation_matrix: Optional[Dict[str, Any]] = None
    status: Optional[BiometryStatus] = None
    model_id: Optional[int] = None
    
    model_config = ConfigDict(protected_namespaces=())


class BiometrySession(BiometrySessionBase):
    """Schema for biometry session response"""
    id: int
    model_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True
        protected_namespaces = ()


class BiometrySessionWithModel(BiometrySession):
    """Schema for biometry session with related model"""
    model: Optional[BiometryModel] = None
    
    class Config:
        from_attributes = True
        protected_namespaces = ()


# Biometry API Request/Response schemas

class BiometryModelUploadResponse(BaseModel):
    """Response for model upload"""
    id: int
    model_type: ModelType
    model_format: ModelFormat
    original_filename: str
    file_size: int
    vertices_count: Optional[int] = None
    faces_count: Optional[int] = None
    status: BiometryStatus
    message: str
    
    model_config = ConfigDict(protected_namespaces=())


class BiometryModelAnalysisRequest(BaseModel):
    """Request for model analysis"""
    model_id: int
    
    model_config = ConfigDict(protected_namespaces=())


class BiometryModelAnalysisResponse(BaseModel):
    """Response for model analysis"""
    success: bool
    vertices_count: int
    faces_count: int
    bounding_box: Dict[str, Any]
    volume: Optional[float] = None
    surface_area: Optional[float] = None
    is_watertight: Optional[bool] = None
    defects: List[str] = []


class BiometryCalibrationRequest(BaseModel):
    """Request for biometry calibration"""
    session_id: int
    calibration_points: Dict[str, Any]
    
    model_config = ConfigDict(protected_namespaces=())


class BiometryCalibrationResponse(BaseModel):
    """Response for biometry calibration"""
    success: bool
    message: str
    transformation_matrix: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(protected_namespaces=())


class BiometryExportRequest(BaseModel):
    """Request for biometry export"""
    session_id: int
    export_format: ModelFormat
    
    model_config = ConfigDict(protected_namespaces=())


class BiometryExportResponse(BaseModel):
    """Response for biometry export"""
    success: bool
    message: str
    download_url: Optional[str] = None
    file_size: Optional[int] = None
    
    model_config = ConfigDict(protected_namespaces=())


# Biometry Point schemas (for API)

class ModelPoint(BaseModel):
    """Point on 3D model"""
    id: int
    x: float
    y: float
    z: float
    label: Optional[str] = None
    
    model_config = ConfigDict(protected_namespaces=())


class MapPoint(BaseModel):
    """Point on map"""
    id: int
    lat: float
    lng: float
    label: Optional[str] = None
    
    model_config = ConfigDict(protected_namespaces=())


class Pair(BaseModel):
    """Pair of model and map points"""
    id: int
    model_id: int
    map_id: int
    
    model_config = ConfigDict(protected_namespaces=())


class CreateModelPoint(BaseModel):
    """Request to create model point"""
    x: float
    y: float
    z: float
    label: Optional[str] = None
    
    model_config = ConfigDict(protected_namespaces=())


class CreateMapPoint(BaseModel):
    """Request to create map point"""
    lat: float
    lng: float
    label: Optional[str] = None
    
    model_config = ConfigDict(protected_namespaces=())


class CreatePair(BaseModel):
    """Request to create pair"""
    model_id: int
    map_id: int
    
    model_config = ConfigDict(protected_namespaces=())


class CalibrationPoint(BaseModel):
    """Calibration point pair"""
    model_point: ModelPoint
    geo_point: MapPoint
    
    model_config = ConfigDict(protected_namespaces=())


class CalibrationExport(BaseModel):
    """Calibration export data"""
    model_path: str
    pairs: List[CalibrationPoint]
    
    model_config = ConfigDict(protected_namespaces=())


class ObjUploadResponse(BaseModel):
    """Response for OBJ upload"""
    filename: str
    content_type: str
    size_bytes: int
    stored_path: str
    uploaded_at: datetime
    
    model_config = ConfigDict(protected_namespaces=())
