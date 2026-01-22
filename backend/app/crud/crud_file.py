from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.file import File, FileVersion
from app.schemas.file import FileCreate, FileUpdate
import shutil
import os
from pathlib import Path

class CRUDFile(CRUDBase[File, FileCreate, FileUpdate]):
    def create_with_version(self, db: Session, *, obj_in: FileCreate, file_content: bytes) -> File:
        # Create the file record
        db_obj = File(
            patient_id=obj_in.patient_id,
            file_path=obj_in.file_path,
            file_type=obj_in.file_type,
            description=obj_in.description,
            metadata_json=obj_in.metadata_json,
            is_active=True
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Create the first version
        version_obj = FileVersion(
            file_id=db_obj.id,
            version_number=1,
            file_path=obj_in.file_path
        )
        db.add(version_obj)
        db.commit()
        
        # Save file content to disk
        file_path = Path(obj_in.file_path)
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        return db_obj
    
    def create_new_version(self, db: Session, *, file_id: int, file_content: bytes) -> FileVersion:
        # Get the file
        file = db.query(File).filter(File.id == file_id).first()
        if not file:
            return None
            
        # Get the latest version number
        latest_version = db.query(FileVersion).filter(FileVersion.file_id == file_id).order_by(FileVersion.version_number.desc()).first()
        new_version_number = (latest_version.version_number if latest_version else 0) + 1
        
        # Generate new file path for version
        file_path = Path(file.file_path)
        version_path = file_path.parent / f"{file_path.stem}_v{new_version_number}{file_path.suffix}"
        
        # Create new version record
        version_obj = FileVersion(
            file_id=file_id,
            version_number=new_version_number,
            file_path=str(version_path)
        )
        db.add(version_obj)
        db.commit()
        
        # Save file content to disk
        with open(version_path, "wb") as f:
            f.write(file_content)
            
        # Update the main file path to point to the new version
        file.file_path = str(version_path)
        file.updated_at = version_obj.created_at
        db.commit()
        
        return version_obj
    
    def get_versions(self, db: Session, *, file_id: int) -> list:
        return db.query(FileVersion).filter(FileVersion.file_id == file_id).order_by(FileVersion.version_number).all()
    
    def get_file_with_versions(self, db: Session, *, file_id: int) -> File:
        file = db.query(File).filter(File.id == file_id).first()
        if file:
            file.versions = self.get_versions(db, file_id=file_id)
        return file

file = CRUDFile(File)