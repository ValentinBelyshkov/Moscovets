from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from app.models.modeling import ModelType, ModelFormat, ModelingStatus

# Shared properties for 3D models
class ThreeDModelBase(BaseModel):
    patient_id: int
    model_type: ModelType
    model_format: ModelFormat
    file_path: str
    original_filename: str
    file_size: int
    scale: float = 1.0
    position_x: float = 0.0
    position_y: float = 0.0
    position_z: float = 0.0
    rotation_x: float = 0.0
    rotation_y: float = 0.0
    rotation_z: float = 0.0
    vertices_count: Optional[int] = None
    faces_count: Optional[int] = None
    bounding_box: Optional[Dict[str, Any]] = None

    model_config = {
        "protected_namespaces": ()
    }

# Properties to receive via API on creation
class ThreeDModelCreate(ThreeDModelBase):
    pass

# Properties to receive via API on update
class ThreeDModelUpdate(BaseModel):
    scale: Optional[float] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    position_z: Optional[float] = None
    rotation_x: Optional[float] = None
    rotation_y: Optional[float] = None
    rotation_z: Optional[float] = None
    vertices_count: Optional[int] = None
    faces_count: Optional[int] = None
    bounding_box: Optional[Dict[str, Any]] = None

# Properties to return via API
class ThreeDModel(ThreeDModelBase):
    id: int
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True
        protected_namespaces = ()

# Shared properties for modeling sessions
class ModelingSessionBase(BaseModel):
    patient_id: int
    cement_gap: float = 0.1
    insertion_path: str = "vertical"
    border_thickness: float = 0.5
    smoothing_strength: float = 0.5
    auto_adaptation: bool = True
    modeling_parameters: Optional[Dict[str, Any]] = None

# Properties to receive via API on creation
class ModelingSessionCreate(ModelingSessionBase):
    upper_jaw_id: Optional[int] = None
    lower_jaw_id: Optional[int] = None
    bite1_id: Optional[int] = None
    bite2_id: Optional[int] = None
    occlusion_pad_id: Optional[int] = None

# Properties to receive via API on update
class ModelingSessionUpdate(BaseModel):
    cement_gap: Optional[float] = None
    insertion_path: Optional[str] = None
    border_thickness: Optional[float] = None
    smoothing_strength: Optional[float] = None
    auto_adaptation: Optional[bool] = None
    status: Optional[ModelingStatus] = None
    modeling_parameters: Optional[Dict[str, Any]] = None
    upper_jaw_id: Optional[int] = None
    lower_jaw_id: Optional[int] = None
    bite1_id: Optional[int] = None
    bite2_id: Optional[int] = None
    occlusion_pad_id: Optional[int] = None

# Properties to return via API
class ModelingSession(ModelingSessionBase):
    id: int
    upper_jaw_id: Optional[int] = None
    lower_jaw_id: Optional[int] = None
    bite1_id: Optional[int] = None
    bite2_id: Optional[int] = None
    occlusion_pad_id: Optional[int] = None
    status: ModelingStatus
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

# Properties for modeling session with related models
class ModelingSessionWithModels(ModelingSession):
    upper_jaw: Optional[ThreeDModel] = None
    lower_jaw: Optional[ThreeDModel] = None
    bite1: Optional[ThreeDModel] = None
    bite2: Optional[ThreeDModel] = None
    occlusion_pad: Optional[ThreeDModel] = None

    class Config:
        from_attributes = True
        protected_namespaces = ()

# Properties for model upload response
class ModelUploadResponse(BaseModel):
    id: int
    model_type: ModelType
    model_format: ModelFormat
    original_filename: str
    file_size: int
    vertices_count: Optional[int] = None
    faces_count: Optional[int] = None
    message: str

    model_config = {
        "protected_namespaces": ()
    }

# Properties for assembly request
class ModelAssemblyRequest(BaseModel):
    session_id: int
    auto_align: bool = True
    tolerance: float = 0.1

# Properties for assembly response
class ModelAssemblyResponse(BaseModel):
    success: bool
    message: str
    assembly_parameters: Optional[Dict[str, Any]] = None

# Properties for occlusion pad creation request
class OcclusionPadRequest(BaseModel):
    session_id: int
    pad_thickness: float = 2.0
    margin_offset: float = 0.5
    cement_gap: float = 0.1

# Properties for occlusion pad creation response
class OcclusionPadResponse(BaseModel):
    success: bool
    message: str
    pad_model_id: Optional[int] = None
    pad_parameters: Optional[Dict[str, Any]] = None

# Properties for model export request
class ModelExportRequest(BaseModel):
    session_id: int
    model_type: ModelType  # Какую модель экспортировать
    export_format: ModelFormat  # В каком формате экспортировать
    include_textures: bool = False

    model_config = {
        "protected_namespaces": ()
    }

# Properties for model export response
class ModelExportResponse(BaseModel):
    success: bool
    message: str
    download_url: Optional[str] = None
    file_size: Optional[int] = None
    faces_count: Optional[int] = None

    class Config:
        protected_namespaces = ()

# Properties for model analysis request
class ModelAnalysisRequest(BaseModel):
    model_id: int

    class Config:
        protected_namespaces = ()

# Properties for model analysis response
class ModelAnalysisResponse(BaseModel):
    success: bool
    vertices_count: int
    faces_count: int
    bounding_box: Dict[str, Any]
    volume: Optional[float] = None
    surface_area: Optional[float] = None
    is_watertight: Optional[bool] = None
    defects: List[str] = []