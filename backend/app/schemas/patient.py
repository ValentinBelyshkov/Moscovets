from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas import CustomConfig  # Add this line
from app.models.patient import Gender

# Shared properties
class PatientBase(BaseModel):
    full_name: str
    birth_date: date
    gender: Gender
    contact_info: Optional[str] = None

# Properties to receive via API on creation
class PatientCreate(PatientBase):
    pass

# Properties to receive via API on update
class PatientUpdate(PatientBase):
    pass

# Properties to return via API
class Patient(PatientBase):
    id: int
    created_at: date
    updated_at: date

    class Config(CustomConfig):
        from_attributes = True
    class Config:
        from_attributes = True