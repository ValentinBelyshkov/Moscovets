from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
import logging

from app.models.biometry import ModelType, ModelFormat, BiometryStatus

# Настройка логирования для схем биометрии
logger = logging.getLogger(__name__)

# Shared properties for biometry models
class BiometryModelBase(BaseModel):
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
    status: BiometryStatus = BiometryStatus.UPLOADED

    model_config = {
        "protected_namespaces": ()
    }
    
    def __str__(self):
        logger.debug(f"Строковое представление базовой модели: patient_id={self.patient_id}, type={self.model_type}, format={self.model_format}")
        return f"BiometryModelBase(patient_id={self.patient_id}, type={self.model_type}, format={self.model_format})"

# Properties to receive via API on creation
class BiometryModelCreate(BiometryModelBase):
    def __init__(self, **data):
        logger.debug(f"Создание BiometryModelCreate: {data}")
        super().__init__(**data)

# Properties to receive via API on update
class BiometryModelUpdate(BaseModel):
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
    status: Optional[BiometryStatus] = None
    
    def __init__(self, **data):
        logger.debug(f"Создание BiometryModelUpdate: {data}")
        super().__init__(**data)

# Properties to return via API
class BiometryModel(BiometryModelBase):
    id: int
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True
        protected_namespaces = ()
    
    def __str__(self):
        logger.debug(f"Строковое представление модели: id={self.id}, patient_id={self.patient_id}, type={self.model_type}")
        return f"BiometryModel(id={self.id}, patient_id={self.patient_id}, type={self.model_type}, filename='{self.original_filename}')"

# Shared properties for biometry sessions
class BiometrySessionBase(BaseModel):
    patient_id: int
    calibration_points: Optional[Dict[str, Any]] = None
    transformation_matrix: Optional[Dict[str, Any]] = None
    status: BiometryStatus = BiometryStatus.UPLOADED
    
    def __str__(self):
        logger.debug(f"Строковое представление базовой сессии: patient_id={self.patient_id}, status={self.status}")
        return f"BiometrySessionBase(patient_id={self.patient_id}, status={self.status})"

# Properties to receive via API on creation
class BiometrySessionCreate(BiometrySessionBase):
    model_id: Optional[int] = None
    
    def __init__(self, **data):
        logger.debug(f"Создание BiometrySessionCreate: {data}")
        super().__init__(**data)

# Properties to receive via API on update
class BiometrySessionUpdate(BaseModel):
    calibration_points: Optional[Dict[str, Any]] = None
    transformation_matrix: Optional[Dict[str, Any]] = None
    status: Optional[BiometryStatus] = None
    model_id: Optional[int] = None
    
    def __init__(self, **data):
        logger.debug(f"Создание BiometrySessionUpdate: {data}")
        super().__init__(**data)

# Properties to return via API
class BiometrySession(BiometrySessionBase):
    id: int
    model_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True
    
    def __str__(self):
        logger.debug(f"Строковое представление сессии: id={self.id}, patient_id={self.patient_id}, model_id={self.model_id}")
        return f"BiometrySession(id={self.id}, patient_id={self.patient_id}, model_id={self.model_id})"

# Properties for biometry session with related model
class BiometrySessionWithModel(BiometrySession):
    model: Optional[BiometryModel] = None

    class Config:
        from_attributes = True
        protected_namespaces = ()
    
    def __str__(self):
        logger.debug(f"Строковое представление сессии с моделью: id={self.id}, model_id={self.model.id if self.model else None}")
        return f"BiometrySessionWithModel(id={self.id}, model_id={self.model.id if self.model else None})"

# Properties for model upload response
class BiometryModelUploadResponse(BaseModel):
    id: int
    model_type: ModelType
    model_format: ModelFormat
    original_filename: str
    file_size: int
    vertices_count: Optional[int] = None
    faces_count: Optional[int] = None
    status: BiometryStatus
    message: str

    model_config = {
        "protected_namespaces": ()
    }
    
    def __str__(self):
        logger.debug(f"Строковое представление ответа на загрузку: id={self.id}, type={self.model_type}, message='{self.message}'")
        return f"BiometryModelUploadResponse(id={self.id}, type={self.model_type}, message='{self.message}')"

# Properties for model analysis request
class BiometryModelAnalysisRequest(BaseModel):
    model_id: int
    
    def __init__(self, **data):
        logger.debug(f"Создание BiometryModelAnalysisRequest: {data}")
        super().__init__(**data)
    
    def __str__(self):
        logger.debug(f"Строковое представление запроса анализа: model_id={self.model_id}")
        return f"BiometryModelAnalysisRequest(model_id={self.model_id})"

# Properties for model analysis response
class BiometryModelAnalysisResponse(BaseModel):
    success: bool
    vertices_count: int
    faces_count: int
    bounding_box: Dict[str, Any]
    volume: Optional[float] = None
    surface_area: Optional[float] = None
    is_watertight: Optional[bool] = None
    defects: List[str] = []
    
    def __init__(self, **data):
        logger.debug(f"Создание BiometryModelAnalysisResponse: {data}")
        super().__init__(**data)
    
    def __str__(self):
        logger.debug(f"Строковое представление ответа анализа: success={self.success}, vertices={self.vertices_count}, faces={self.faces_count}")
        return f"BiometryModelAnalysisResponse(success={self.success}, vertices={self.vertices_count}, faces={self.faces_count})"

# Properties for biometry calibration request
class BiometryCalibrationRequest(BaseModel):
    session_id: int
    calibration_points: Dict[str, Any]
    
    def __init__(self, **data):
        logger.debug(f"Создание BiometryCalibrationRequest: {data}")
        super().__init__(**data)
    
    def __str__(self):
        logger.debug(f"Строковое представление запроса калибровки: session_id={self.session_id}, points_count={len(self.calibration_points) if self.calibration_points else 0}")
        return f"BiometryCalibrationRequest(session_id={self.session_id}, points_count={len(self.calibration_points) if self.calibration_points else 0})"

# Properties for biometry calibration response
class BiometryCalibrationResponse(BaseModel):
    success: bool
    message: str
    transformation_matrix: Optional[Dict[str, Any]] = None
    
    def __init__(self, **data):
        logger.debug(f"Создание BiometryCalibrationResponse: {data}")
        super().__init__(**data)
    
    def __str__(self):
        logger.debug(f"Строковое представление ответа калибровки: success={self.success}, message='{self.message}'")
        return f"BiometryCalibrationResponse(success={self.success}, message='{self.message}')"

# Properties for biometry export request
class BiometryExportRequest(BaseModel):
    session_id: int
    export_format: ModelFormat
    
    def __init__(self, **data):
        logger.debug(f"Создание BiometryExportRequest: {data}")
        super().__init__(**data)
    
    def __str__(self):
        logger.debug(f"Строковое представление запроса экспорта: session_id={self.session_id}, format={self.export_format}")
        return f"BiometryExportRequest(session_id={self.session_id}, format={self.export_format})"

# Properties for biometry export response
class BiometryExportResponse(BaseModel):
    success: bool
    message: str
    download_url: Optional[str] = None
    file_size: Optional[int] = None
    
    def __init__(self, **data):
        logger.debug(f"Создание BiometryExportResponse: {data}")
        super().__init__(**data)
    
    def __str__(self):
        logger.debug(f"Строковое представление ответа экспорта: success={self.success}, message='{self.message}'")
        return f"BiometryExportResponse(success={self.success}, message='{self.message}')"