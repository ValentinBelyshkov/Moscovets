from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

from app.models.medical_record import MedicalRecordType

# Shared properties
class MedicalRecordBase(BaseModel):
    patient_id: int
    record_type: MedicalRecordType
    data: Optional[str] = None
    notes: Optional[str] = None

# Properties to receive via API on creation
class MedicalRecordCreate(MedicalRecordBase):
    pass

# Properties to receive via API on update
class MedicalRecordUpdate(MedicalRecordBase):
    pass

# Properties for medical record history
class MedicalRecordHistoryBase(BaseModel):
    medical_record_id: int
    data: Optional[str] = None
    notes: Optional[str] = None
    updated_by: Optional[str] = None

class MedicalRecordHistoryCreate(MedicalRecordHistoryBase):
    pass

class MedicalRecordHistory(MedicalRecordHistoryBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime

# Properties to return via API
class MedicalRecord(MedicalRecordBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: datetime

# Properties for medical record with history
class MedicalRecordWithHistory(MedicalRecord):
    model_config = ConfigDict(from_attributes=True)
    
    history: List[MedicalRecordHistory] = []