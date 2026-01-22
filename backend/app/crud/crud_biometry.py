from sqlalchemy.orm import Session
import logging
import time
from app.crud.base import CRUDBase
from app.models.biometry import BiometryModel, BiometrySession
from app.schemas.biometry import BiometryModelCreate, BiometryModelUpdate, BiometrySessionCreate, BiometrySessionUpdate
from typing import Optional, List, Dict, Any
import os
import uuid
from pathlib import Path

# Настройка логирования для CRUD операций биометрии
logger = logging.getLogger(__name__)

class CRUDBiometryModel(CRUDBase[BiometryModel, BiometryModelCreate, BiometryModelUpdate]):
    def create_with_file(self, db: Session, *, obj_in: BiometryModelCreate, file_content: bytes) -> BiometryModel:
        logger.info(f"Создание записи модели биометрии: patient_id={obj_in.patient_id}, type={obj_in.model_type}, format={obj_in.model_format}")
        
        # Create the model record
        db_obj = BiometryModel(
            patient_id=obj_in.patient_id,
            model_type=obj_in.model_type,
            model_format=obj_in.model_format,
            file_path=obj_in.file_path,
            original_filename=obj_in.original_filename,
            file_size=obj_in.file_size,
            scale=obj_in.scale,
            position_x=obj_in.position_x,
            position_y=obj_in.position_y,
            position_z=obj_in.position_z,
            rotation_x=obj_in.rotation_x,
            rotation_y=obj_in.rotation_y,
            rotation_z=obj_in.rotation_z,
            vertices_count=obj_in.vertices_count,
            faces_count=obj_in.faces_count,
            bounding_box=obj_in.bounding_box,
            status=obj_in.status,
            is_active=True
        )
        
        try:
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            logger.debug(f"Запись в базе данных создана с ID: {db_obj.id}")
            
            # Save file content to disk
            file_path = Path(obj_in.file_path)
            file_path.parent.mkdir(parents=True, exist_ok=True)
            logger.debug(f"Сохранение файла на диск: {file_path}")
            with open(file_path, "wb") as f:
                f.write(file_content)
            
            logger.info(f"Модель биометрии успешно создана: ID={db_obj.id}, файл={obj_in.original_filename}")
            return db_obj
        except Exception as e:
            logger.error(f"Ошибка создания модели биометрии: {str(e)}")
            db.rollback()
            raise

class CRUDBiometrySession(CRUDBase[BiometrySession, BiometrySessionCreate, BiometrySessionUpdate]):
    def create_with_model(self, db: Session, *, obj_in: BiometrySessionCreate) -> BiometrySession:
        """
        Создание сессии биометрии с привязкой модели.
        
        Args:
            db: Сессия базы данных
            obj_in: Данные для создания сессии
            
        Returns:
            Созданная сессия биометрии
        """
        start_time = time.time()
        logger.info(f"Начало создания сессии биометрии для пациента {obj_in.patient_id}")
        logger.debug(f"Параметры сессии: model_id={obj_in.model_id}, calibration_points={obj_in.calibration_points}")
        
        # Создаем запись сессии
        db_obj = BiometrySession(
            patient_id=obj_in.patient_id,
            model_id=obj_in.model_id,
            calibration_points=obj_in.calibration_points,
            transformation_matrix=obj_in.transformation_matrix,
            status=obj_in.status,
            is_active=True
        )
        
        try:
            logger.debug("Добавление сессии в базу данных")
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            
            execution_time = time.time() - start_time
            logger.info(f"Сессия биометрии успешно создана за {execution_time:.3f} секунд:")
            logger.info(f"  - ID: {db_obj.id}")
            logger.info(f"  - Пациент: {db_obj.patient_id}")
            logger.info(f"  - Модель: {db_obj.model_id}")
            logger.info(f"  - Статус: {db_obj.status}")
            
            return db_obj
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Ошибка создания сессии биометрии за {execution_time:.3f} секунд: {str(e)}")
            db.rollback()
            raise
    
    def get_by_patient(self, db: Session, *, patient_id: int, skip: int = 0, limit: int = 100) -> List[BiometrySession]:
        """
        Получение сессий биометрии по пациенту.
        
        Args:
            db: Сессия базы данных
            patient_id: ID пациента
            skip: Количество пропускаемых записей
            limit: Максимальное количество возвращаемых записей
            
        Returns:
            Список сессий биометрии
        """
        start_time = time.time()
        logger.debug(f"Получение сессий биометрии по пациенту {patient_id}, skip={skip}, limit={limit}")
        
        try:
            sessions = db.query(BiometrySession).filter(
                BiometrySession.patient_id == patient_id,
                BiometrySession.is_active == True
            ).offset(skip).limit(limit).all()
            
            execution_time = time.time() - start_time
            logger.debug(f"Получено {len(sessions)} сессий за {execution_time:.3f} секунд")
            
            return sessions
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Ошибка получения сессий биометрии по пациенту за {execution_time:.3f} секунд: {str(e)}")
            raise
    
    def get_with_model(self, db: Session, *, session_id: int) -> Optional[BiometrySession]:
        """
        Получение сессии биометрии с загруженной моделью.
        
        Args:
            db: Сессия базы данных
            session_id: ID сессии
            
        Returns:
            Сессия биометрии с моделью или None
        """
        start_time = time.time()
        logger.debug(f"Получение сессии биометрии с моделью: {session_id}")
        
        try:
            session = db.query(BiometrySession).filter(BiometrySession.id == session_id).first()
            if session and session.model_id:
                logger.debug(f"Загрузка модели для сессии: {session.model_id}")
                session.model = db.query(BiometryModel).filter(BiometryModel.id == session.model_id).first()
            
            execution_time = time.time() - start_time
            if session:
                logger.debug(f"Сессия найдена за {execution_time:.3f} секунд: id={session.id}, model_id={session.model_id}")
            else:
                logger.debug(f"Сессия не найдена за {execution_time:.3f} секунд")
            
            return session
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Ошибка получения сессии биометрии с моделью за {execution_time:.3f} секунд: {str(e)}")
            raise
    
    def update_session_parameters(self, db: Session, *, db_obj: BiometrySession, parameters: Dict[str, Any]) -> BiometrySession:
        """
        Обновление параметров сессии биометрии.
        
        Args:
            db: Сессия базы данных
            db_obj: Объект сессии для обновления
            parameters: Параметры для обновления
            
        Returns:
            Обновленная сессия биометрии
        """
        start_time = time.time()
        logger.info(f"Начало обновления параметров сессии биометрии для ID: {db_obj.id}")
        logger.debug(f"Параметры для обновления: {parameters}")
        
        # Логируем текущее состояние сессии
        logger.debug(f"Текущее состояние сессии: model_id={db_obj.model_id}, status={db_obj.status}")
        
        # Обновляем поля
        updated_fields = []
        for field, value in parameters.items():
            if hasattr(db_obj, field):
                old_value = getattr(db_obj, field)
                setattr(db_obj, field, value)
                updated_fields.append(f"{field}: {old_value} -> {value}")
                logger.debug(f"Обновлено {field}: {old_value} -> {value}")
        
        try:
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            
            execution_time = time.time() - start_time
            logger.info(f"Параметры сессии биометрии успешно обновлены за {execution_time:.3f} секунд:")
            logger.info(f"  - ID: {db_obj.id}")
            logger.info(f"  - Обновленные поля: {', '.join(updated_fields)}")
            logger.info(f"  - Новое состояние: model_id={db_obj.model_id}, status={db_obj.status}")
            
            return db_obj
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Ошибка обновления параметров сессии биометрии за {execution_time:.3f} секунд: {str(e)}")
            db.rollback()
            raise

# Utility functions for file handling
def generate_biometry_file_path(original_filename: str, model_type: str) -> str:
    """Generate unique file path for biometry model"""
    file_extension = Path(original_filename).suffix
    unique_filename = f"{model_type}_{uuid.uuid4()}{file_extension}"
    return f"uploads/biometry_models/{unique_filename}"

def get_file_size(file_content: bytes) -> int:
    """Get file size in bytes"""
    return len(file_content)

def validate_biometry_file(filename: str) -> bool:
    """Validate if file is a supported biometry model format"""
    supported_extensions = ['.stl', '.obj']
    file_extension = Path(filename).suffix.lower()
    return file_extension in supported_extensions

# Create CRUD instances
biometry_model = CRUDBiometryModel(BiometryModel)
biometry_session = CRUDBiometrySession(BiometrySession)