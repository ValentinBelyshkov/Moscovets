from typing import Any, List
import io
import zipfile
from pathlib import Path
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.models.user import User
from app.core.config import settings
from app.services.file_storage_service import FileStorageService
from app.models.file import MedicalFileType

router = APIRouter()

# Initialize file storage service
file_storage = FileStorageService()

@router.post("/upload-archive", response_model=dict)
async def upload_ct_archive(
    *,
    db: Session = Depends(deps.get_db),
    archive: UploadFile = File(...),
    patient_id: int = Form(...),
    scan_date: str = Form(...),
    description: str = Form(None),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Upload a ZIP archive containing DICOM files and extract them to a date-specific folder.
    
    Files will be stored in: storage/patients/patient_{patient_id}/dicom/{scan_date}/
    """
    try:
        # Validate scan date format
        try:
            scan_date_obj = date.fromisoformat(scan_date)
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail="Invalid scan_date format. Use YYYY-MM-DD"
            )
        
        # Check if archive is a ZIP file
        if not archive.filename.lower().endswith('.zip'):
            raise HTTPException(
                status_code=400,
                detail="Only ZIP archives are supported"
            )
        
        # Read archive content
        archive_content = await archive.read()
        
        # Check file size
        archive_size = len(archive_content)
        if archive_size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"Archive too large. Must be smaller than {settings.MAX_UPLOAD_SIZE / (1024*1024):.1f} MB"
            )
        
        # Create patient directories
        file_storage.create_patient_directories(patient_id)
        
        # Extract files from ZIP archive
        uploaded_files = []
        dicom_count = 0
        
        try:
            with zipfile.ZipFile(io.BytesIO(archive_content), 'r') as zip_ref:
                # Get list of files in archive
                file_list = zip_ref.namelist()
                
                for file_path in file_list:
                    # Skip directories
                    if file_path.endswith('/'):
                        continue
                    
                    # Check if file is DICOM
                    file_path_lower = file_path.lower()
                    if not (file_path_lower.endswith('.dcm') or 'dicom' in file_path_lower):
                        continue
                    
                    # Extract file content
                    file_content = zip_ref.read(file_path)
                    
                    # Get original filename
                    original_filename = Path(file_path).name
                    
                    # Generate file path with scan date
                    file_path_result, unique_filename = file_storage.generate_file_path(
                        patient_id=patient_id,
                        file_type=MedicalFileType.DICOM,
                        original_filename=original_filename,
                        study_date=scan_date_obj
                    )
                    
                    # Write file to disk
                    with open(file_path_result, 'wb') as f:
                        f.write(file_content)
                    
                    # Create file record in database
                    file_in = schemas.FileCreate(
                        patient_id=patient_id,
                        file_path=str(file_path_result),
                        file_type=MedicalFileType.DICOM.value,
                        description=f"{description or 'DICOM from archive'} - {original_filename}",
                        medical_category='ct',
                        study_date=scan_date_obj,
                        body_part=None,
                        mime_type='application/dicom',
                        file_size=len(file_content)
                    )
                    
                    file_record = crud.file.create_with_version(
                        db=db,
                        obj_in=file_in,
                        file_content=file_content,
                        user_id=current_user.id
                    )
                    
                    uploaded_files.append({
                        'id': file_record.id,
                        'name': original_filename,
                        'size': len(file_content),
                        'path': str(file_path_result),
                        'data_url': f'/api/v1/files/download/{file_record.id}'
                    })
                    
                    dicom_count += 1
        
        except zipfile.BadZipFile:
            raise HTTPException(
                status_code=400,
                detail="Invalid ZIP file format"
            )
        
        if dicom_count == 0:
            raise HTTPException(
                status_code=400,
                detail="No DICOM files found in the archive. Please ensure the archive contains .dcm files."
            )
        
        return {
            'success': True,
            'uploadedFiles': uploaded_files,
            'dicomFiles': dicom_count,
            'totalExtracted': dicom_count,
            'scanDate': scan_date,
            'storagePath': f'patients/patient_{patient_id}/dicom/{scan_date_obj.strftime("%d.%m.%Y")}'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CT archive: {str(e)}")

@router.get("/patient/{patient_id}/scan-dates")
def get_patient_ct_scan_dates(
    *,
    db: Session = Depends(deps.get_db),
    patient_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all unique scan dates for CT/DICOM files of a patient.
    """
    try:
        files = crud.file.get_patient_files(
            db=db,
            patient_id=patient_id,
            file_type=MedicalFileType.DICOM,
            medical_category='ct'
        )
        
        # Extract unique dates
        unique_dates = set()
        for file in files:
            if file.study_date:
                unique_dates.add(file.study_date.isoformat())
        
        return {
            'patient_id': patient_id,
            'scanDates': sorted(list(unique_dates), reverse=True)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scan dates: {str(e)}")

@router.get("/patient/{patient_id}/files-by-date/{scan_date}")
def get_patient_ct_files_by_date(
    *,
    db: Session = Depends(deps.get_db),
    patient_id: int,
    scan_date: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all CT/DICOM files for a patient for a specific scan date.
    """
    try:
        # Validate scan date format
        try:
            scan_date_obj = date.fromisoformat(scan_date)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid scan_date format. Use YYYY-MM-DD"
            )
        
        files = crud.file.get_patient_files(
            db=db,
            patient_id=patient_id,
            file_type=MedicalFileType.DICOM,
            medical_category='ct'
        )
        
        # Filter by study date
        filtered_files = [
            file for file in files 
            if file.study_date and file.study_date == scan_date_obj
        ]
        
        # Convert to response format
        file_schemas = [schemas.File.model_validate(file) for file in filtered_files]
        
        return {
            'patient_id': patient_id,
            'scanDate': scan_date,
            'files': file_schemas
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get files by date: {str(e)}")
