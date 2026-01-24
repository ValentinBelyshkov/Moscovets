from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[schemas.Patient])
def read_patients(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve patients.
    """
    if crud.user.is_admin(current_user):
        patients = crud.patient.get_multi(db, skip=skip, limit=limit)
    else:
        # Workers can only see their own patients
        patients = crud.patient.get_multi(db, skip=skip, limit=limit)
    return patients

@router.post("/", response_model=schemas.Patient)
def create_patient(
    *,
    db: Session = Depends(deps.get_db),
    patient_in: schemas.PatientCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new patient.
    """
    patient = crud.patient.create(db=db, obj_in=patient_in)
    return patient

@router.put("/{id}", response_model=schemas.Patient)
def update_patient(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    patient_in: schemas.PatientUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a patient.
    """
    patient = crud.patient.get(db=db, id=id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient = crud.patient.update(db=db, db_obj=patient, obj_in=patient_in)
    return patient

@router.get("/{id}", response_model=schemas.Patient)
def read_patient(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get patient by ID.
    """
    patient = crud.patient.get(db=db, id=id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.delete("/{id}", response_model=schemas.Patient)
def delete_patient(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a patient.
    """
    patient = crud.patient.get(db=db, id=id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient = crud.patient.remove(db=db, id=id)
    return patient