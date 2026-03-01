"""
Shared base schemas for 3D models and sessions.
Centralizes common model and session schemas.
"""
from datetime import datetime
from typing import Any, Dict, Optional, List

from pydantic import BaseModel, ConfigDict

from app.schemas.shared_enums import ModelType, ModelFormat, BiometryStatus, ModelingStatus


# === Base schemas for 3D Models ===

class ThreeDModelBase(BaseModel):
    """Base schema for all 3D models"""
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
    
    model_config = ConfigDict(
        protected_namespaces=(),
        use_enum_values=False
    )


class ThreeDModelUpdate(BaseModel):
    """Base update schema for 3D models"""
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
    
    model_config = ConfigDict(protected_namespaces=())


class ThreeDModelResponse(ThreeDModelBase):
    """Base response schema for 3D models"""
    id: int
    created_at: datetime
    updated_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True
        protected_namespaces = ()


# === Base schemas for Sessions ===

class SessionBase(BaseModel):
    """Base schema for all sessions"""
    patient_id: int
    status: str = "uploaded"  # Default status
    
    model_config = ConfigDict(protected_namespaces=())


class SessionResponse(SessionBase):
    """Base response schema for sessions"""
    id: int
    created_at: datetime
    updated_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True
        protected_namespaces = ()


# === Shared modeling schemas ===

class ModelAssemblyRequest(BaseModel):
    """Request schema for model assembly"""
    session_id: int
    auto_align: bool = True
    tolerance: float = 0.1


class ModelAssemblyResponse(BaseModel):
    """Response schema for model assembly"""
    success: bool
    message: str
    assembly_parameters: Optional[Dict[str, Any]] = None


class OcclusionPadRequest(BaseModel):
    """Request schema for occlusion pad creation"""
    session_id: int
    pad_thickness: float = 2.0
    margin_offset: float = 0.5
    cement_gap: float = 0.1


class OcclusionPadResponse(BaseModel):
    """Response schema for occlusion pad creation"""
    success: bool
    message: str
    pad_model_id: Optional[int] = None
    pad_parameters: Optional[Dict[str, Any]] = None


class ModelExportRequest(BaseModel):
    """Request schema for model export"""
    session_id: int
    model_type: ModelType
    export_format: ModelFormat
    include_textures: bool = False
    
    model_config = ConfigDict(protected_namespaces=())


class ModelExportResponse(BaseModel):
    """Response schema for model export"""
    success: bool
    message: str
    download_url: Optional[str] = None
    file_size: Optional[int] = None
    faces_count: Optional[int] = None
    
    class Config:
        protected_namespaces = ()


class ModelAnalysisRequest(BaseModel):
    """Request schema for model analysis"""
    model_id: int
    
    class Config:
        protected_namespaces = ()


class ModelAnalysisResponse(BaseModel):
    """Response schema for model analysis"""
    success: bool
    vertices_count: int
    faces_count: int
    bounding_box: Dict[str, Any]
    volume: Optional[float] = None
    surface_area: Optional[float] = None
    is_watertight: Optional[bool] = None
    defects: List[str] = []
    
    class Config:
        protected_namespaces = ()


# === Shared status response ===

class StatusResponse(BaseModel):
    """Standard status response"""
    status: str
    details: Optional[str] = None
    model_path: Optional[str] = None
    
    model_config = ConfigDict(protected_namespaces=())
