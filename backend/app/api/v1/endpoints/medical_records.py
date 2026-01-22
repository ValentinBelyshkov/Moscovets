from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[schemas.MedicalRecord])
def read_medical_records(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve medical records.
    """
    medical_records = crud.medical_record.get_multi(db, skip=skip, limit=limit)
    return medical_records

@router.post("/", response_model=schemas.MedicalRecord)
def create_medical_record(
    *,
    db: Session = Depends(deps.get_db),
    medical_record_in: schemas.MedicalRecordCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new medical record.
    """
    medical_record = crud.medical_record.create(db=db, obj_in=medical_record_in)
    return medical_record

@router.put("/{id}", response_model=schemas.MedicalRecord)
def update_medical_record(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    medical_record_in: schemas.MedicalRecordUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a medical record.
    """
    medical_record = crud.medical_record.get(db=db, id=id)
    if not medical_record:
        raise HTTPException(status_code=404, detail="Medical record not found")
    medical_record = crud.medical_record.update_with_history(
        db=db,
        db_obj=medical_record,
        obj_in=medical_record_in,
        updated_by=current_user.username if current_user else "unknown"
    )
    return medical_record

@router.get("/{id}/with-history", response_model=schemas.MedicalRecordWithHistory)
def read_medical_record_with_history(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get medical record with history.
    """
    medical_record = crud.medical_record.get_with_history(db=db, id=id)
    if not medical_record:
        raise HTTPException(status_code=404, detail="Medical record not found")
    return medical_record

@router.get("/{id}", response_model=schemas.MedicalRecord)
def read_medical_record(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get medical record by ID.
    """
    medical_record = crud.medical_record.get(db=db, id=id)
    if not medical_record:
        raise HTTPException(status_code=404, detail="Medical record not found")
    return medical_record

@router.delete("/{id}", response_model=schemas.MedicalRecord)
def delete_medical_record(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a medical record.
    """
    medical_record = crud.medical_record.get(db=db, id=id)
    if not medical_record:
        raise HTTPException(status_code=404, detail="Medical record not found")
    medical_record = crud.medical_record.remove(db=db, id=id)
    return medical_record