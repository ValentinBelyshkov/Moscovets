"""
Pydantic schemas for modeling module.
Uses shared schemas to avoid duplication.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, ConfigDict

from app.schemas.shared_enums import ModelType, ModelFormat, ModelingStatus
from app.schemas.shared_schemas import (
    ThreeDModelBase,
    ThreeDModelUpdate,
    ThreeDModelResponse,
    ModelAssemblyRequest,
    ModelAssemblyResponse,
    OcclusionPadRequest,
    OcclusionPadResponse,
    ModelExportRequest,
    ModelExportResponse,
    ModelAnalysisRequest,
    ModelAnalysisResponse
)


# === 3D Model Schemas ===

class ThreeDModelBaseLocal(ThreeDModelBase):
    """Base schema for 3D models (local version without status)"""
    pass


class ThreeDModelCreate(ThreeDModelBaseLocal):
    """Schema for creating 3D model"""
    pass


class ThreeDModelUpdate(ThreeDModelUpdate):
    """Schema for updating 3D model"""
    pass


class ThreeDModel(ThreeDModelResponse):
    """Schema for 3D model response"""
    pass


# === Modeling Session Schemas ===

class ModelingSessionBase(BaseModel):
    """Base schema for modeling sessions"""
    patient_id: int
    cement_gap: float = 0.1
    insertion_path: str = "vertical"
    border_thickness: float = 0.5
    smoothing_strength: float = 0.5
    auto_adaptation: bool = True
    modeling_parameters: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(protected_namespaces=())


class ModelingSessionCreate(ModelingSessionBase):
    """Schema for creating modeling session"""
    upper_jaw_id: Optional[int] = None
    lower_jaw_id: Optional[int] = None
    bite1_id: Optional[int] = None
    bite2_id: Optional[int] = None
    occlusion_pad_id: Optional[int] = None


class ModelingSessionUpdate(BaseModel):
    """Schema for updating modeling session"""
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
    
    model_config = ConfigDict(protected_namespaces=())


class ModelingSession(ModelingSessionBase):
    """Schema for modeling session response"""
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
        protected_namespaces = ()


class ModelingSessionWithModels(ModelingSession):
    """Schema for modeling session with related models"""
    upper_jaw: Optional[ThreeDModel] = None
    lower_jaw: Optional[ThreeDModel] = None
    bite1: Optional[ThreeDModel] = None
    bite2: Optional[ThreeDModel] = None
    occlusion_pad: Optional[ThreeDModel] = None
    
    class Config:
        from_attributes = True
        protected_namespaces = ()


# === Upload/Response Schemas ===

class ModelUploadResponse(BaseModel):
    """Response for model upload"""
    id: int
    model_type: ModelType
    model_format: ModelFormat
    original_filename: str
    file_size: int
    vertices_count: Optional[int] = None
    faces_count: Optional[int] = None
    message: str
    
    model_config = ConfigDict(protected_namespaces=())
