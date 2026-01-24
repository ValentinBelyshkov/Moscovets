from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from enum import Enum as PyEnum
from sqlalchemy.ext.declarative import declared_attr


class ModelType(PyEnum):
    UPPER_JAW = "upper_jaw"
    LOWER_JAW = "lower_jaw"
    BITE_1 = "bite_1"
    BITE_2 = "bite_2"
    OCCLUSION_PAD = "occlusion_pad"
    BIOMETRY_MODEL = "biometry_model"


class ModelFormat(PyEnum):
    STL = "stl"
    OBJ = "obj"


class BaseModel3D(Base):
    """
    Abstract base class for 3D models to avoid duplication between
    modeling and biometry modules
    """
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    model_type = Column(Enum(ModelType, name="model_type"), nullable=False)
    model_format = Column(Enum(ModelFormat, name="model_format"), nullable=False)
    file_path = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    
    # Параметры моделирования
    scale = Column(Float, default=1.0)
    position_x = Column(Float, default=0.0)
    position_y = Column(Float, default=0.0)
    position_z = Column(Float, default=0.0)
    rotation_x = Column(Float, default=0.0)
    rotation_y = Column(Float, default=0.0)
    rotation_z = Column(Float, default=0.0)
    
    # Метаданные модели
    vertices_count = Column(Integer, nullable=True)
    faces_count = Column(Integer, nullable=True)
    bounding_box = Column(JSON, nullable=True)  # min/max coordinates
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    @declared_attr
    def patient(cls):
        # Dynamically determine the back_populates attribute based on the class name
        if cls.__name__ == "ThreeDModel":
            back_populates_name = "three_d_models"
        elif cls.__name__ == "BiometryModel":
            back_populates_name = "biometry_models"
        else:
            # Default or for other potential subclasses
            back_populates_name = "three_d_models"
        return relationship("Patient", back_populates=back_populates_name)