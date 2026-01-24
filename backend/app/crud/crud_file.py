from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.file import File, FileVersion, MedicalFileType, FileVersionType
from app.schemas.file import FileCreate, FileUpdate
import shutil
import os
import hashlib
from pathlib import Path
from datetime import date

class CRUDFile(CRUDBase[File, FileCreate, FileUpdate]):
    def create_with_version(self, db: Session, *, obj_in: FileCreate, file_content: bytes, user_id: int = None) -> File:
        # Calculate file hash and size
        file_hash = hashlib.sha256(file_content).hexdigest()
        file_size = len(file_content)
        
        # Create the file record
        db_obj = File(
            patient_id=obj_in.patient_id,
            file_path=obj_in.file_path,
            file_type=MedicalFileType(obj_in.file_type),
            description=obj_in.description,
            metadata_json=obj_in.metadata_json,
            medical_category=obj_in.medical_category,
            study_date=obj_in.study_date,
            body_part=obj_in.body_part,
            image_orientation=obj_in.image_orientation,
            file_size=file_size,
            mime_type=obj_in.mime_type,
            file_hash=file_hash,
            is_active=True
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Create the first version
        version_obj = FileVersion(
            file_id=db_obj.id,
            version_number=1,
            file_path=obj_in.file_path,
            file_hash=file_hash,
            file_size=file_size,
            version_type=FileVersionType.BASELINE,
            created_by=user_id
        )
        db.add(version_obj)
        db.commit()
        
        # Save file content to disk
        file_path = Path(obj_in.file_path)
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        return db_obj
    
    def create_new_version(self, db: Session, *, file_id: int, file_content: bytes, version_type: FileVersionType = FileVersionType.FOLLOWUP, version_description: str = None, user_id: int = None) -> FileVersion:
        # Get the file
        file = db.query(File).filter(File.id == file_id).first()
        if not file:
            return None
            
        # Get the latest version number
        latest_version = db.query(FileVersion).filter(FileVersion.file_id == file_id).order_by(FileVersion.version_number.desc()).first()
        new_version_number = (latest_version.version_number if latest_version else 0) + 1
        
        # Calculate hash and size
        file_hash = hashlib.sha256(file_content).hexdigest()
        file_size = len(file_content)
        
        # Create new version record
        version_obj = FileVersion(
            file_id=file_id,
            version_number=new_version_number,
            file_path=file.file_path,  # Main file path
            file_hash=file_hash,
            file_size=file_size,
            version_type=version_type,
            version_description=version_description,
            created_by=user_id
        )
        db.add(version_obj)
        db.commit()
        
        # Update main file info
        file.file_hash = file_hash
        file.file_size = file_size
        file.updated_at = version_obj.created_at
        db.commit()
        
        # Overwrite main file with new content
        with open(file.file_path, "wb") as f:
            f.write(file_content)
            
        return version_obj
    
    def get_versions(self, db: Session, *, file_id: int) -> list:
        return db.query(FileVersion).filter(FileVersion.file_id == file_id).order_by(FileVersion.version_number).all()
    
    def get_file_with_versions(self, db: Session, *, file_id: int) -> File:
        file = db.query(File).filter(File.id == file_id).first()
        if file:
            file.versions = self.get_versions(db, file_id=file_id)
        return file
    
    def get_patient_files(self, db: Session, *, patient_id: int, file_type: MedicalFileType = None, medical_category: str = None) -> list:
        query = db.query(File).filter(File.patient_id == patient_id, File.is_active == True)
        
        if file_type:
            query = query.filter(File.file_type == file_type)
            
        if medical_category:
            query = query.filter(File.medical_category == medical_category)
            
        return query.order_by(File.created_at.desc()).all()
    
    def get_files_by_category(self, db: Session, *, patient_id: int, category: str) -> dict:
        """Возвращает файлы пациента, сгруппированные по типам"""
        files = self.get_patient_files(db, patient_id=patient_id)
        grouped = {}
        
        for file in files:
            file_type = file.file_type.value
            if file_type not in grouped:
                grouped[file_type] = []
            grouped[file_type].append(file)
            
        return grouped
    
    def delete_file_with_versions(self, db: Session, *, file_id: int) -> bool:
        """Удаляет файл и все его версии с диска"""
        file = self.get(db=db, id=file_id)
        if not file:
            return False
            
        # Delete all versions from disk
        for version in file.versions:
            if os.path.exists(version.file_path):
                try:
                    os.remove(version.file_path)
                except OSError:
                    pass  # Continue even if file deletion fails
        
        # Delete from database (cascade will handle versions)
        self.remove(db=db, id=file_id)
        return True

file = CRUDFile(File)