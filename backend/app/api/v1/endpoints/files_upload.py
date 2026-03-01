"""
File upload operations.
Part of files endpoint - handles file uploads.
"""
from typing import Any

import os
from pathlib import Path
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from starlette.responses import FileResponse

from app import crud, schemas
from app.api import deps
from app.models.user import User
from app.models.file import MedicalFileType
from app.services.file_storage_service import FileStorageService
from app.core.config import settings

router = APIRouter()

file_storage = FileStorageService()


@router.post("/upload", response_model=schemas.File)
async def upload_file(
    *,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    patient_id: int = Form(...),
    file_type: str = Form(...),
    medical_category: str = Form(None),
    study_date: str = Form(None),
    body_part: str = Form(None),
    description: str = Form(None),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Upload a file with organized storage by patient and type."""
    try:
        # Validate file type
        try:
            medical_file_type = MedicalFileType(file_type)
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type: {file_type}. Supported types: {[t.value for t in MedicalFileType]}"
            )
        
        # Read file content to check size
        content = await file.read()
        
        file_size = len(content)
        if medical_file_type == MedicalFileType.CT_SCAN and file_size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. CT scans must be smaller than {settings.MAX_UPLOAD_SIZE} bytes"
            )
        elif file_size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Must be smaller than {settings.MAX_UPLOAD_SIZE} bytes"
            )
        
        # Parse study date
        study_date_obj = None
        if study_date:
            try:
                study_date_obj = date.fromisoformat(study_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid study_date format. Use YYYY-MM-DD")
        
        # Create patient directories
        file_storage.create_patient_directories(patient_id)
        
        # Generate file path
        file_path, unique_filename = file_storage.generate_file_path(
            patient_id=patient_id,
            file_type=medical_file_type,
            original_filename=file.filename,
            study_date=study_date_obj
        )
        
        # Create file record
        file_in = schemas.FileCreate(
            patient_id=patient_id,
            name=file.filename,
            file_path=str(file_path),
            file_type=medical_file_type.value,
            description=description,
            medical_category=medical_category,
            study_date=study_date_obj,
            body_part=body_part,
            mime_type=file.content_type,
            file_size=file_size
        )
        
        file_record = crud.file.create_with_version(
            db=db, 
            obj_in=file_in, 
            file_content=content,
            user_id=current_user.id
        )
        
        return file_record
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")


@router.get("/download/{id}")
async def download_file(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Download a file."""
    file = crud.file.get(db=db, id=id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if not os.path.exists(file.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=file.file_path,
        filename=Path(file.file_path).name,
        media_type="application/octet-stream"
    )
