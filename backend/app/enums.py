"""
Shared Enums for the application.
Centralizes all enum definitions to avoid duplication.
This module should NOT import from models or schemas to avoid circular dependencies.
"""
from enum import Enum


class ModelType(str, Enum):
    """Типы 3D моделей"""
    UPPER_JAW = "upper_jaw"
    LOWER_JAW = "lower_jaw"
    BITE_1 = "bite_1"
    BITE_2 = "bite_2"
    OCCLUSION_PAD = "occlusion_pad"
    BIOMETRY_MODEL = "biometry_model"


class ModelFormat(str, Enum):
    """Форматы 3D моделей"""
    STL = "stl"
    OBJ = "obj"


class Gender(str, Enum):
    """Пол пациента"""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class LocalityType(str, Enum):
    """Тип населённого пункта"""
    URBAN = "urban"
    RURAL = "rural"


class MaritalStatus(str, Enum):
    """Семейное положение"""
    REGISTERED_MARRIAGE = "registered_marriage"
    UNREGISTERED_MARRIAGE = "unregistered_marriage"
    NOT_MARRIED = "not_married"
    UNKNOWN = "unknown"


class EducationLevel(str, Enum):
    """Уровень образования"""
    HIGHER = "higher"
    INCOMPLETE_HIGHER = "incomplete_higher"
    SECONDARY = "secondary"
    PRIMARY = "primary"
    NONE = "none"
    UNKNOWN = "unknown"


class ProfileType(str, Enum):
    """Тип профиля лица"""
    CONVEX = "convex"
    CONCAVE = "concave"
    STRAIGHT = "straight"


class LipPosition(str, Enum):
    """Положение губ"""
    PROTRUDES = "protrudes"
    RECEDES = "recedes"
    CORRECT = "correct"


class ChinShift(str, Enum):
    """Смещение подбородка"""
    RIGHT = "right"
    LEFT = "left"
    NONE = "none"


class MedicalFileType(str, Enum):
    """Типы медицинских файлов"""
    PHOTO = "photo"
    XRAY = "xray"
    PANORAMIC = "panoramic"
    CT_SCAN = "ct_scan"
    DICOM = "dicom"
    MRI = "mri"
    STL_MODEL = "stl_model"
    OBJ_MODEL = "obj_model"
    PLY_MODEL = "ply_model"
    PDF = "pdf"
    DOCUMENT = "document"
    REPORT = "report"
    OTHER = "other"


class FileVersionType(str, Enum):
    """Типы версий файлов"""
    BASELINE = "baseline"
    FOLLOWUP = "followup"
    TREATMENT = "treatment"
    SURGICAL = "surgical"
    FINAL = "final"


class BiometryStatus(str, Enum):
    """Статус биометрии"""
    UPLOADED = "uploaded"
    ANALYZED = "analyzed"
    CALIBRATED = "calibrated"
    EXPORTED = "exported"


class ModelingStatus(str, Enum):
    """Статус моделирования"""
    UPLOADED = "uploaded"
    ASSEMBLED = "assembled"
    PAD_CREATED = "pad_created"
    EDITED = "edited"
    EXPORTED = "exported"
