"""
Pydantic schemas for patient module.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.shared_enums import Gender, LocalityType, MaritalStatus, EducationLevel, ProfileType, LipPosition, ChinShift
from app.schemas.shared_validators import parse_date


class PatientBase(BaseModel):
    """Base schema for patients"""
    full_name: str
    birth_date: datetime
    gender: Gender
    contact_info: Optional[str] = None
    complaints: Optional[str] = None
    medical_card_number: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    insurance_info: Optional[str] = None
    
    # Registration address
    registration_republic: Optional[str] = None
    registration_district: Optional[str] = None
    registration_city: Optional[str] = None
    registration_settlement: Optional[str] = None
    registration_street: Optional[str] = None
    registration_house: Optional[str] = None
    registration_apartment: Optional[str] = None
    registration_phone: Optional[str] = None
    
    # Socio-demographic data
    locality_type: Optional[LocalityType] = None
    marital_status: Optional[MaritalStatus] = None
    education_level: Optional[EducationLevel] = None
    
    # Cephalometry data
    cephalometry_zy_zy: Optional[float] = None
    cephalometry_n_me: Optional[float] = None
    cephalometry_n_sn: Optional[float] = None
    face_symmetric: Optional[bool] = None
    chin_shift: Optional[ChinShift] = None
    mental_fold_pronounced: Optional[bool] = None
    lips_closed: Optional[bool] = None
    gummy_smile: Optional[bool] = None
    profile_type: Optional[ProfileType] = None
    upper_lip_position: Optional[LipPosition] = None
    
    model_config = ConfigDict(
        protected_namespaces=(),
        use_enum_values=False
    )
    
    @field_validator('birth_date', mode='before')
    @classmethod
    def validate_birth_date(cls, value):
        return parse_date(value)


class PatientCreate(PatientBase):
    """Schema for creating patient"""
    pass


class PatientUpdate(BaseModel):
    """Schema for updating patient"""
    full_name: Optional[str] = None
    birth_date: Optional[datetime] = None
    gender: Optional[Gender] = None
    contact_info: Optional[str] = None
    complaints: Optional[str] = None
    medical_card_number: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    insurance_info: Optional[str] = None
    
    # Registration address
    registration_republic: Optional[str] = None
    registration_district: Optional[str] = None
    registration_city: Optional[str] = None
    registration_settlement: Optional[str] = None
    registration_street: Optional[str] = None
    registration_house: Optional[str] = None
    registration_apartment: Optional[str] = None
    registration_phone: Optional[str] = None
    
    # Socio-demographic data
    locality_type: Optional[LocalityType] = None
    marital_status: Optional[MaritalStatus] = None
    education_level: Optional[EducationLevel] = None
    
    # Cephalometry data
    cephalometry_zy_zy: Optional[float] = None
    cephalometry_n_me: Optional[float] = None
    cephalometry_n_sn: Optional[float] = None
    face_symmetric: Optional[bool] = None
    chin_shift: Optional[ChinShift] = None
    mental_fold_pronounced: Optional[bool] = None
    lips_closed: Optional[bool] = None
    gummy_smile: Optional[bool] = None
    profile_type: Optional[ProfileType] = None
    upper_lip_position: Optional[LipPosition] = None
    
    @field_validator('birth_date', mode='before')
    @classmethod
    def validate_birth_date(cls, value):
        return parse_date(value)


class Patient(PatientBase):
    """Schema for patient response"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        protected_namespaces = ()
