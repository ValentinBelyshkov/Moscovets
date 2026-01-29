#!/usr/bin/env python3
"""
Скрипт для пересоздания базы данных с моделями
"""

import os
import sys
from pathlib import Path

# Добавляем путь до директории app
sys.path.insert(0, str(Path(__file__).parent))

from app.db.base import Base
from app.db.session import engine
from app.models.user import User
from app.models.patient import Patient
from app.models.medical_record import MedicalRecord
from app.models.file import File
from app.models.document import Document
from app.models.modeling import ThreeDModel, ModelingSession

def recreate_database():
    """Пересоздает базу данных"""
    print(f"Инициализация базы данных ({settings.DATABASE_URL})...")
    
    # Для PostgreSQL мы не можем просто удалить файл, 
    # но мы можем удалить все таблицы
    print("Удаление существующих таблиц...")
    Base.metadata.drop_all(bind=engine)
    
    print("Создание новых таблиц...")
    Base.metadata.create_all(bind=engine)
    
    print("База данных успешно создана!")

if __name__ == "__main__":
    from app.core.config import settings
    recreate_database()