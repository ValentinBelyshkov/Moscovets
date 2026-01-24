#!/usr/bin/env python3
"""
Скрипт миграции файлов в новую систему управления файлами
"""

import os
import shutil
import sqlite3
from pathlib import Path
from datetime import datetime, date
from typing import Dict, Any

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.models.file import MedicalFileType, FileVersionType
from app.services.file_storage_service import FileStorageService

class FileMigrationService:
    """Сервис для миграции файлов в новую систему"""
    
    def __init__(self, database_url: str = "sqlite:///./patients.db", storage_path: str = "storage"):
        self.database_url = database_url
        self.storage_path = Path(storage_path)
        self.engine = create_engine(database_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.storage_service = FileStorageService(str(self.storage_path))
    
    def migrate_existing_files(self) -> Dict[str, Any]:
        """Мигрирует существующие файлы в новую систему"""
        print("Начинаем миграцию файлов...")
        
        session = self.SessionLocal()
        results = {
            'total_files': 0,
            'migrated_files': 0,
            'errors': [],
            'skipped_files': 0
        }
        
        try:
            # Получаем все существующие файлы
            existing_files = session.execute(text("""
                SELECT id, patient_id, file_path, file_type, description, created_at 
                FROM files WHERE is_active = 1
            """)).fetchall()
            
            results['total_files'] = len(existing_files)
            print(f"Найдено файлов для миграции: {results['total_files']}")
            
            for file_row in existing_files:
                try:
                    self._migrate_single_file(session, file_row)
                    results['migrated_files'] += 1
                    
                    if results['migrated_files'] % 10 == 0:
                        print(f"Мигрировано файлов: {results['migrated_files']}")
                        
                except Exception as e:
                    error_msg = f"Ошибка миграции файла ID {file_row[0]}: {str(e)}"
                    print(f"ОШИБКА: {error_msg}")
                    results['errors'].append(error_msg)
            
            session.commit()
            print(f"Миграция завершена. Успешно: {results['migrated_files']}, Ошибки: {len(results['errors'])}")
            
        except Exception as e:
            session.rollback()
            results['errors'].append(f"Критическая ошибка миграции: {str(e)}")
            print(f"КРИТИЧЕСКАЯ ОШИБКА: {str(e)}")
        
        finally:
            session.close()
        
        return results
    
    def _migrate_single_file(self, session, file_row):
        """Мигрирует один файл в новую систему"""
        file_id, patient_id, old_file_path, old_file_type, description, created_at = file_row
        
        # Создаем директории для пациента
        self.storage_service.create_patient_directories(patient_id)
        
        # Определяем новый тип файла
        new_file_type = self._convert_old_file_type(old_file_type)
        
        # Если файл существует на диске, перемещаем его
        if os.path.exists(old_file_path):
            new_file_path, filename = self.storage_service.generate_file_path(
                patient_id=patient_id,
                file_type=new_file_type,
                original_filename=os.path.basename(old_file_path),
                study_date=None  # Дата создания файла недоступна
            )
            
            # Создаем директорию если не существует
            new_file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Перемещаем файл
            shutil.move(old_file_path, new_file_path)
            
            # Получаем размер файла
            file_size = os.path.getsize(new_file_path)
            
            # Обновляем запись в базе данных
            session.execute(text("""
                UPDATE files 
                SET file_path = :new_path,
                    file_type = :new_type,
                    file_size = :file_size,
                    medical_category = 'clinical',
                    updated_at = :updated_at
                WHERE id = :file_id
            """), {
                'new_path': str(new_file_path),
                'new_type': new_file_type.value,
                'file_size': file_size,
                'updated_at': datetime.now(),
                'file_id': file_id
            })
            
            # Создаем запись о версии
            session.execute(text("""
                INSERT INTO file_versions (file_id, version_number, file_path, created_at)
                VALUES (:file_id, 1, :new_path, :created_at)
            """), {
                'file_id': file_id,
                'new_path': str(new_file_path),
                'created_at': created_at
            })
            
            print(f"Файл {file_id} перемещен: {old_file_path} -> {new_file_path}")
            
        else:
            # Файл не найден на диске, обновляем только метаданные
            session.execute(text("""
                UPDATE files 
                SET file_type = :new_type,
                    medical_category = 'clinical',
                    updated_at = :updated_at
                WHERE id = :file_id
            """), {
                'new_type': new_file_type.value,
                'updated_at': datetime.now(),
                'file_id': file_id
            })
            print(f"Метаданные обновлены для файла {file_id} (файл не найден на диске)")
    
    def _convert_old_file_type(self, old_type: str) -> MedicalFileType:
        """Конвертирует старый тип файла в новый"""
        conversion_map = {
            'image': MedicalFileType.PHOTO,
            'pdf': MedicalFileType.PDF,
            'document': MedicalFileType.DOCUMENT,
            'other': MedicalFileType.OTHER
        }
        
        if old_type in conversion_map:
            return conversion_map[old_type]
        else:
            # Если тип не распознан, используем общий
            return MedicalFileType.OTHER
    
    def create_backup(self) -> str:
        """Создает резервную копию базы данных"""
        backup_dir = self.storage_path / 'backups'
        backup_dir.mkdir(exist_ok=True)
        
        backup_filename = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
        backup_path = backup_dir / backup_filename
        
        # Копируем файл базы данных
        db_path = Path("patients.db")
        if db_path.exists():
            shutil.copy2(db_path, backup_path)
            print(f"Резервная копия создана: {backup_path}")
            return str(backup_path)
        else:
            print("Файл базы данных не найден")
            return ""
    
    def cleanup_old_structure(self):
        """Очищает старую структуру файлов (uploads/)"""
        uploads_dir = Path("uploads")
        if uploads_dir.exists():
            print("Удаляем старую структуру uploads/...")
            shutil.rmtree(uploads_dir)
            print("Старая структура удалена")
    
    def verify_migration(self) -> Dict[str, Any]:
        """Проверяет корректность миграции"""
        session = self.SessionLocal()
        verification = {
            'total_files_in_db': 0,
            'total_files_on_disk': 0,
            'missing_files': [],
            'orphaned_files': []
        }
        
        try:
            # Проверяем файлы в базе данных
            db_files = session.execute(text("""
                SELECT id, file_path FROM files WHERE is_active = 1
            """)).fetchall()
            
            verification['total_files_in_db'] = len(db_files)
            
            # Проверяем существование файлов на диске
            for file_row in db_files:
                file_path = Path(file_row[1])
                if not file_path.exists():
                    verification['missing_files'].append(str(file_path))
            
            # Ищем файлы на диске, которых нет в БД
            storage_files = list(self.storage_path.rglob('*'))
            storage_files = [f for f in storage_files if f.is_file()]
            verification['total_files_on_disk'] = len(storage_files)
            
        finally:
            session.close()
        
        return verification

def main():
    """Основная функция миграции"""
    print("=== Система миграции файлов ===")
    print(f"Время начала: {datetime.now()}")
    
    # Создаем сервис миграции
    migration_service = FileMigrationService()
    
    # Создаем резервную копию
    print("\n1. Создание резервной копии...")
    backup_path = migration_service.create_backup()
    
    # Проверяем исходное состояние
    print("\n2. Проверка исходного состояния...")
    if not Path("patients.db").exists():
        print("Файл базы данных не найден. Завершаем миграцию.")
        return
    
    # Выполняем миграцию
    print("\n3. Выполнение миграции...")
    results = migration_service.migrate_existing_files()
    
    # Проверяем результаты
    print("\n4. Проверка результатов миграции...")
    verification = migration_service.verify_migration()
    
    # Выводим итоговый отчет
    print("\n=== ИТОГИ МИГРАЦИИ ===")
    print(f"Всего файлов в базе: {verification['total_files_in_db']}")
    print(f"Файлов найдено на диске: {verification['total_files_on_disk']}")
    print(f"Успешно мигрировано: {results['migrated_files']}")
    print(f"Ошибок при миграции: {len(results['errors'])}")
    print(f"Отсутствующих файлов: {len(verification['missing_files'])}")
    
    if results['errors']:
        print("\nОШИБКИ МИГРАЦИИ:")
        for error in results['errors']:
            print(f"  - {error}")
    
    if verification['missing_files']:
        print("\nОТСУТСТВУЮЩИЕ ФАЙЛЫ:")
        for missing_file in verification['missing_files']:
            print(f"  - {missing_file}")
    
    # Предлагаем очистить старую структуру
    if results['migrated_files'] > 0:
        print(f"\n5. Очистка старой структуры...")
        response = input("Удалить старую папку uploads/? (y/N): ")
        if response.lower() == 'y':
            migration_service.cleanup_old_structure()
        else:
            print("Старая структура сохранена для ручной очистки")
    
    print(f"\nВремя завершения: {datetime.now()}")
    print("=== МИГРАЦИЯ ЗАВЕРШЕНА ===")

if __name__ == "__main__":
    main()