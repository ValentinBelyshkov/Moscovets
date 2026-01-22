from typing import Any, List
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from starlette.responses import FileResponse

from app import crud, schemas
from app.api import deps
from app.models.user import User
from app.core.config import settings

router = APIRouter()

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
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Upload a new version of an existing file.
    """
    # Check if file exists
    existing_file = crud.file.get(db=db, id=file_id)
    if not existing_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Read file content
    content = await file.read()
    
    # Create new version
    new_version = crud.file.create_new_version(db=db, file_id=file_id, file_content=content)
    if not new_version:
        raise HTTPException(status_code=404, detail="File not found")
    
    return new_version

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
    description: str = Form(None),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Upload a file.
    """
    # Create uploads directory if it doesn't exist
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = upload_dir / unique_filename
    
    # Save file to disk
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Create file record in database
    file_in = schemas.FileCreate(
        patient_id=patient_id,
        file_path=str(file_path),
        file_type=get_file_type(file.content_type),
        description=description,
    )
    file_record = crud.file.create(db=db, obj_in=file_in)
    
    return file_record

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