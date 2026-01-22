"""
Вспомогательные функции для работы с файлами
"""
import os
import uuid
import hashlib
from typing import Optional, List


def create_temp_file(content: bytes, filename: str) -> str:
    """
    Создает временный файл с заданным содержимым
    
    Args:
        content: Содержимое файла
        filename: Исходное имя файла
        
    Returns:
        Путь к временному файлу
    """
    temp_path = f"/tmp/{uuid.uuid4()}_{filename}"
    with open(temp_path, "wb") as temp_file:
        temp_file.write(content)
    return temp_path


def remove_temp_file(file_path: str) -> None:
    """
    Удаляет временный файл
    
    Args:
        file_path: Путь к файлу
    """
    if os.path.exists(file_path):
        os.remove(file_path)


def calculate_file_hash(file_path: str) -> str:
    """
    Вычисляет MD5 хэш файла
    
    Args:
        file_path: Путь к файлу
        
    Returns:
        MD5 хэш в виде строки
    """
    try:
        with open(file_path, 'rb') as f:
            file_hash = hashlib.md5()
            for chunk in iter(lambda: f.read(4096), b""):
                file_hash.update(chunk)
        return file_hash.hexdigest()
    except Exception:
        return "unknown"


def get_file_size(content: bytes) -> int:
    """
    Возвращает размер содержимого в байтах
    
    Args:
        content: Содержимое файла
        
    Returns:
        Размер в байтах
    """
    return len(content)


def validate_file_format(filename: Optional[str], allowed_formats: List[str]) -> bool:
    """
    Проверяет формат файла
    
    Args:
        filename: Имя файла
        allowed_formats: Список разрешенных форматов (например, ['stl', 'obj'])
        
    Returns:
        True если формат поддерживается
    """
    if not filename:
        return False
    
    file_extension = filename.lower().split('.')[-1]
    return file_extension in [fmt.lower() for fmt in allowed_formats]
