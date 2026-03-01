"""
Patient file operations.
Part of files endpoint - handles patient-specific file operations.
"""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.models.user import User
from app.models.file import MedicalFileType

router = APIRouter()


@router.get("/patient/{patient_id}/files")
def get_patient_files(
    *,
    db: Session = Depends(deps.get_db),
    patient_id: int,
    file_type: str = None,
    medical_category: str = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get all files for a patient, optionally filtered by type and category."""
    try:
        file_type_enum = None
        if file_type:
            try:
                file_type_enum = MedicalFileType(file_type)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file type: {file_type}"
                )
        
        files = crud.file.get_patient_files(
            db=db,
            patient_id=patient_id,
            file_type=file_type_enum,
            medical_category=medical_category
        )
        
        file_schemas = [schemas.File.model_validate(file) for file in files]
        return file_schemas
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get patient files: {str(e)}")


@router.get("/patient/{patient_id}/files/categorized")
def get_patient_files_categorized(
    *,
    db: Session = Depends(deps.get_db),
    patient_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get all files for a patient, grouped by file type."""
    try:
        files_grouped = crud.file.get_files_by_category(db=db, patient_id=patient_id)
        
        result = {}
        for file_type, files in files_grouped.items():
            result[file_type] = [schemas.File.model_validate(file) for file in files]
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get categorized files: {str(e)}")


@router.get("/patient/{patient_id}/storage-info")
def get_patient_storage_info(
    *,
    patient_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """Get storage information for a patient."""
    try:
        from app.services.file_storage_service import FileStorageService
        file_storage = FileStorageService()
        storage_info = file_storage.get_patient_storage_info(patient_id)
        return storage_info
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get storage info: {str(e)}")


@router.post("/patient/{patient_id}/cleanup")
def cleanup_patient_temp_files(
    *,
    patient_id: int,
    max_age_hours: int = 24,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """Clean up temporary files for a patient."""
    try:
        from app.services.file_storage_service import FileStorageService
        file_storage = FileStorageService()
        cleanup_result = file_storage.cleanup_temp_files(max_age_hours=max_age_hours)
        return cleanup_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cleanup temp files: {str(e)}")
