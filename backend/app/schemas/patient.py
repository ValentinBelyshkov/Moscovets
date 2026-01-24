from datetime import date, datetime
from typing import Optional, Union
from pydantic import BaseModel, ConfigDict, field_validator
from app.models.patient import Gender

# Shared properties
class PatientBase(BaseModel):
    full_name: str
    birth_date: date
    gender: Gender
    contact_info: Optional[str] = None
    
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
class PatientUpdate(PatientBase):
    pass

# Properties to return via API
class Patient(PatientBase):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    
    id: int
    created_at: datetime
    updated_at: datetime