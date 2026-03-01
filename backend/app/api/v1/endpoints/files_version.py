"""
File version operations.
Part of files endpoint - handles file versions.
"""
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.models.user import User
from app.models.file import FileVersionType
from app.core.config import settings

router = APIRouter()


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
    """Upload a new version of an existing file."""
    try:
        try:
            version_type_enum = FileVersionType(version_type)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid version type: {version_type}"
            )
        
        existing_file = crud.file.get(db=db, id=file_id)
        if not existing_file:
            raise HTTPException(status_code=404, detail="File not found")
        
        content = await file.read()
        file_size = len(content)
        
        if file_size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Must be smaller than {settings.MAX_UPLOAD_SIZE} bytes"
            )
        
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


@router.get("/{id}/versions", response_model=List[schemas.FileVersion])
def get_file_versions(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get all versions of a file."""
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
    """Get file with all its versions."""
    file = crud.file.get_file_with_versions(db=db, file_id=id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    return file


@router.delete("/{id}/with-versions", response_model=dict)
def delete_file_with_versions(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Delete a file and all its versions."""
    try:
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
