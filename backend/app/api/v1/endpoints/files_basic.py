"""
Basic file CRUD operations.
Part of files endpoint - handles basic CRUD operations.
"""
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.models.user import User
from app.models.file import MedicalFileType

router = APIRouter()


@router.get("/", response_model=List[schemas.File])
def read_files(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Retrieve files."""
    files = crud.file.get_multi(db, skip=skip, limit=limit)
    return files


@router.post("/", response_model=schemas.File)
def create_file(
    *,
    db: Session = Depends(deps.get_db),
    file_in: schemas.FileCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Create new file."""
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
    """Update a file."""
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
    """Get file by ID."""
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
    """Delete a file."""
    file = crud.file.get(db=db, id=id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if not crud.user.is_admin(current_user):
        raise HTTPException(
            status_code=403,
            detail="Only administrators can delete files",
        )
    
    file = crud.file.remove(db=db, id=id)
    return file
