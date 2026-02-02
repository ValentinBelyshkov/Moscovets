from datetime import date, datetime
from typing import Optional, Union
from pydantic import BaseModel, ConfigDict, field_validator
from app.models.patient import (
    Gender, LocalityType, MaritalStatus, EducationLevel,
    ProfileType, LipPosition, ChinShift
)

# Shared properties
class PatientBase(BaseModel):
    full_name: str
    birth_date: date
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
    
    @field_validator('birth_date', mode='before')
    @classmethod
    def parse_birth_date(cls, value):
        if isinstance(value, str):
            return datetime.strptime(value, '%Y-%m-%d').date()
        return value

# Properties to receive via API on creation
class PatientCreate(PatientBase):
    pass

# Properties to receive via API on update
class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    birth_date: Optional[date] = None
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
    def parse_birth_date(cls, value):
        if isinstance(value, str):
            return datetime.strptime(value, '%Y-%m-%d').date()
        return value

# Properties to return via API
class Patient(PatientBase):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    
    id: int
    created_at: datetime
    updated_at: datetime