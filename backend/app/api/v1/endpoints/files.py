from typing import Any, List
import os
import uuid
from pathlib import Path
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from starlette.responses import FileResponse

from app import crud, schemas
from app.api import deps
from app.models.user import User
from app.core.config import settings
from app.services.file_storage_service import FileStorageService
from app.models.file import MedicalFileType, FileVersionType

router = APIRouter()

# Initialize file storage service
file_storage = FileStorageService()

@router.get("/", response_model=List[schemas.File])
def read_files(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve files.
    """
    files = crud.file.get_multi(db, skip=skip, limit=limit)
    return files

@router.post("/", response_model=schemas.File)
def create_file(
    *,
    db: Session = Depends(deps.get_db),
    file_in: schemas.FileCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new file.
    """
    file = crud.file.create(db=db, obj_in=file_in)
    return file

@router.put("/{id}", response_model=schemas.File)
def update_file(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    file_in: schemas.FileUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a file.
    """
    file = crud.file.get(db=db, id=id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    file = crud.file.update(db=db, db_obj=file, obj_in=file_in)
    return file

@router.get("/{id}", response_model=schemas.File)
def read_file(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get file by ID.
    """
    file = crud.file.get(db=db, id=id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return file

@router.delete("/{id}", response_model=schemas.File)
def delete_file(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a file.
    """
    file = crud.file.get(db=db, id=id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if user is admin or owner of the file
    if not crud.user.is_admin(current_user):
        # In a real implementation, we would check if the user owns the file
        # For now, we'll just check if they're an admin
        raise HTTPException(
            status_code=403,
            detail="Only administrators can delete files",
        )
    
    file = crud.file.remove(db=db, id=id)
    return file

@router.post("/upload-version/{file_id}", response_model=schemas.FileVersion)
async def upload_file_version(
    *,
    db: Session = Depends(deps.get_db),
    file_id: int,
    file: UploadFile = File(...),
    version_type: str = Form("followup"),
    version_description: str = Form(None),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Upload a new version of an existing file with context.
    """
    try:
        # Validate version type
        try:
            version_type_enum = FileVersionType(version_type)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid version type: {version_type}. Supported types: {[t.value for t in FileVersionType]}"
            )
        
        # Check if file exists
        existing_file = crud.file.get(db=db, id=file_id)
        if not existing_file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Read file content
        content = await file.read()
        
        # Check file size limit
        file_size = len(content)
        if file_size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Must be smaller than {settings.MAX_UPLOAD_SIZE} bytes ({settings.MAX_UPLOAD_SIZE / (1024*1024):.1f} MB)"
            )
        
        # Create new version
        new_version = crud.file.create_new_version(
            db=db, 
            file_id=file_id, 
            file_content=content,
            version_type=version_type_enum,
            version_description=version_description,
            user_id=current_user.id
        )
        
        return new_version
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file version: {str(e)}")

@router.get("/patient/{patient_id}/files")
def get_patient_files(
    *,
    db: Session = Depends(deps.get_db),
    patient_id: int,
    file_type: str = None,
    medical_category: str = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all files for a patient, optionally filtered by type and category.
    """
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
        
        # Convert SQLAlchemy models to Pydantic schemas
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
    """
    Get all files for a patient, grouped by file type.
    """
    try:
        files_grouped = crud.file.get_files_by_category(db=db, patient_id=patient_id)
        
        # Convert to response format
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
) -> Any:
    """
    Get storage information for a patient.
    """
    try:
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
) -> Any:
    """
    Clean up temporary files for a patient.
    """
    try:
        cleanup_result = file_storage.cleanup_temp_files(max_age_hours=max_age_hours)
        return cleanup_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cleanup temp files: {str(e)}")

@router.delete("/{id}/with-versions", response_model=dict)
def delete_file_with_versions(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a file and all its versions.
    """
    try:
        # Check if user is admin
        if not crud.user.is_admin(current_user):
            raise HTTPException(
                status_code=403,
                detail="Only administrators can delete files",
            )
        
        success = crud.file.delete_file_with_versions(db=db, file_id=id)
        
        if success:
            return {"message": "File and all versions deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="File not found")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

@router.get("/{id}/versions", response_model=List[schemas.FileVersion])
def get_file_versions(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all versions of a file.
    """
    file = crud.file.get(db=db, id=id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    versions = crud.file.get_versions(db=db, file_id=id)
    return versions

@router.get("/{id}/with-versions", response_model=schemas.FileWithVersions)
def get_file_with_versions(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get file with all its versions.
    """
    file = crud.file.get_file_with_versions(db=db, file_id=id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    return file

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
    """
    Upload a file with organized storage by patient and type.
    """
    try:
        # Validate file type
        try:
            medical_file_type = MedicalFileType(file_type)
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type: {file_type}. Supported types: {[t.value for t in MedicalFileType]}"
            )
        
        # Read file content first to check size
        content = await file.read()
        
        # Check file size limit (especially for CT scans)
        file_size = len(content)
        if medical_file_type == MedicalFileType.CT_SCAN and file_size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. CT scans must be smaller than {settings.MAX_UPLOAD_SIZE} bytes ({settings.MAX_UPLOAD_SIZE / (1024*1024):.1f} MB)"
            )
        elif file_size > settings.MAX_UPLOAD_SIZE:
            # General limit for all file types
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Must be smaller than {settings.MAX_UPLOAD_SIZE} bytes ({settings.MAX_UPLOAD_SIZE / (1024*1024):.1f} MB)"
            )
        
        # Parse study date if provided
        study_date_obj = None
        if study_date:
            try:
                study_date_obj = date.fromisoformat(study_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid study_date format. Use YYYY-MM-DD")
        
        # Create patient directories if needed
        file_storage.create_patient_directories(patient_id)
        
        # Generate file path using storage service
        file_path, unique_filename = file_storage.generate_file_path(
            patient_id=patient_id,
            file_type=medical_file_type,
            original_filename=file.filename,
            study_date=study_date_obj
        )
        
        # Create file record in database
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
        
        # Use CRUD to create with versioning
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
    """
    Download a file.
    """
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

def get_file_type(content_type: str) -> str:
    """
    Determine file type based on content type.
    """
    if content_type.startswith("image/"):
        return "image"
    elif content_type == "application/pdf":
        return "pdf"
    elif content_type in ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        return "document"
    else:
        return "other"