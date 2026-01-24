import os
import uuid
from pathlib import Path
from datetime import date
from typing import Optional, Tuple
from app.models.file import MedicalFileType

class FileStorageService:
    """Сервис для организации файлов по пациентам и типам"""
    
    def __init__(self, base_storage_path: str = "storage"):
        self.base_storage_path = Path(base_storage_path)
        self.base_storage_path.mkdir(exist_ok=True)
        
        # Создаем основные директории
        self.storage_structure = {
            'patients': self.base_storage_path / 'patients',
            'temp': self.base_storage_path / 'temp',
            'backups': self.base_storage_path / 'backups'
        }
        
        for path in self.storage_structure.values():
            path.mkdir(exist_ok=True)
    
    def generate_file_path(self, 
                          patient_id: int, 
                          file_type: MedicalFileType, 
                          original_filename: str,
                          study_date: Optional[date] = None) -> Tuple[Path, str]:
        """
        Генерирует путь для файла на основе пациента и типа
        
        Returns:
            tuple: (full_path, unique_filename)
        """
        # Определяем поддиректорию для типа файла
        type_mapping = {
            MedicalFileType.PHOTO: 'photos',
            MedicalFileType.XRAY: 'xrays',
            MedicalFileType.PANORAMIC: 'panoramics',
            MedicalFileType.CT_SCAN: 'ct_scans',
            MedicalFileType.DICOM: 'dicom',
            MedicalFileType.MRI: 'mri',
            MedicalFileType.STL_MODEL: 'stl_models',
            MedicalFileType.OBJ_MODEL: 'obj_models',
            MedicalFileType.PLY_MODEL: 'ply_models',
            MedicalFileType.PDF: 'documents',
            MedicalFileType.DOCUMENT: 'documents',
            MedicalFileType.REPORT: 'reports',
            MedicalFileType.OTHER: 'other'
        }
        
        subtype_dir = type_mapping.get(file_type, 'other')
        
        # Создаем структуру папок
        patient_dir = self.storage_structure['patients'] / f'patient_{patient_id}' / subtype_dir
        patient_dir.mkdir(parents=True, exist_ok=True)
        
        # Генерируем уникальное имя файла
        file_extension = Path(original_filename).suffix
        unique_filename = self._generate_unique_filename(
            patient_id=patient_id,
            file_type=file_type,
            study_date=study_date,
            original_filename=original_filename,
            extension=file_extension
        )
        
        full_path = patient_dir / unique_filename
        return full_path, unique_filename
    
    def _generate_unique_filename(self, 
                                patient_id: int, 
                                file_type: MedicalFileType, 
                                study_date: Optional[date],
                                original_filename: str,
                                extension: str) -> str:
        """Генерирует уникальное имя файла"""
        
        # Используем дату исследования или текущую дату
        file_date = study_date if study_date else date.today()
        
        # Определяем префикс на основе типа файла
        type_prefix = {
            MedicalFileType.PHOTO: 'photo',
            MedicalFileType.XRAY: 'xray',
            MedicalFileType.PANORAMIC: 'panoramic',
            MedicalFileType.CT_SCAN: 'ct',
            MedicalFileType.DICOM: 'dicom',
            MedicalFileType.MRI: 'mri',
            MedicalFileType.STL_MODEL: 'stl',
            MedicalFileType.OBJ_MODEL: 'obj',
            MedicalFileType.PLY_MODEL: 'ply',
            MedicalFileType.PDF: 'doc',
            MedicalFileType.DOCUMENT: 'doc',
            MedicalFileType.REPORT: 'report',
            MedicalFileType.OTHER: 'file'
        }.get(file_type, 'file')
        
        # Генерируем UUID для уникальности
        uuid_part = str(uuid.uuid4())[:8]
        
        # Формат: {date}_{type}_{uuid}{extension}
        filename = f"{file_date.strftime('%Y%m%d')}_{type_prefix}_{uuid_part}{extension}"
        
        return filename.lower()
    
    def create_patient_directories(self, patient_id: int) -> dict:
        """Создает все необходимые директории для пациента"""
        patient_base = self.storage_structure['patients'] / f'patient_{patient_id}'
        
        type_directories = [
            'photos', 'xrays', 'panoramics', 'ct_scans', 'dicom', 'mri',
            'stl_models', 'obj_models', 'ply_models', 'documents', 'reports', 'other'
        ]
        
        created_dirs = []
        for type_dir in type_directories:
            dir_path = patient_base / type_dir
            dir_path.mkdir(parents=True, exist_ok=True)
            created_dirs.append(str(dir_path))
        
        return {
            'patient_base': str(patient_base),
            'type_directories': created_dirs
        }
    
    def get_patient_storage_info(self, patient_id: int) -> dict:
        """Возвращает информацию о хранилище пациента"""
        patient_dir = self.storage_structure['patients'] / f'patient_{patient_id}'
        
        if not patient_dir.exists():
            return {
                'exists': False,
                'total_size': 0,
                'file_count': 0,
                'directories': {}
            }
        
        info = {
            'exists': True,
            'total_size': 0,
            'file_count': 0,
            'directories': {}
        }
        
        for type_dir in patient_dir.iterdir():
            if type_dir.is_dir():
                files = list(type_dir.rglob('*'))
                file_count = len([f for f in files if f.is_file()])
                dir_size = sum(f.stat().st_size for f in files if f.is_file())
                
                info['directories'][type_dir.name] = {
                    'path': str(type_dir),
                    'file_count': file_count,
                    'size_bytes': dir_size,
                    'size_mb': round(dir_size / (1024 * 1024), 2)
                }
                
                info['file_count'] += file_count
                info['total_size'] += dir_size
        
        info['total_size_mb'] = round(info['total_size'] / (1024 * 1024), 2)
        
        return info
    
    def cleanup_temp_files(self, max_age_hours: int = 24):
        """Очищает временные файлы старше указанного возраста"""
        import time
        
        temp_dir = self.storage_structure['temp']
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        cleaned_count = 0
        total_size = 0
        
        for file_path in temp_dir.rglob('*'):
            if file_path.is_file():
                file_age = current_time - file_path.stat().st_mtime
                if file_age > max_age_seconds:
                    file_size = file_path.stat().st_size
                    file_path.unlink()
                    cleaned_count += 1
                    total_size += file_size
        
        return {
            'cleaned_files': cleaned_count,
            'freed_bytes': total_size,
            'freed_mb': round(total_size / (1024 * 1024), 2)
        }