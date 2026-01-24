"""
Конфигурация логирования для модуля биометрии (модуль 4)
"""
import logging
import sys
from pathlib import Path

# Создаем директорию для логов
LOGS_DIR = Path(__file__).parent.parent.parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# Конфигурация логирования для модуля биометрии
BIOMETRY_LOG_FILE = LOGS_DIR / "biometry.log"
MODELING_LOG_FILE = LOGS_DIR / "modeling.log"

# Формат логов
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
FILE_LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s'

def setup_biometry_logging():
    """Настройка логирования для модуля биометрии"""
    
    # Создаем логгер для модуля биометрии
    biometry_logger = logging.getLogger("app.api.v1.biometry")
    biometry_logger.setLevel(logging.DEBUG)
    
    # Создаем логгер для сервиса хранения биометрии
    storage_logger = logging.getLogger("app.services.biometry_storage")
    storage_logger.setLevel(logging.DEBUG)
    
    # Создаем логгер для модуля моделирования
    modeling_logger = logging.getLogger("app.api.v1.endpoints.modeling")
    modeling_logger.setLevel(logging.DEBUG)
    
    # Создаем логгер для API эндпоинтов биометрии
    biometry_api_logger = logging.getLogger("app.api.v1.endpoints.biometry")
    biometry_api_logger.setLevel(logging.DEBUG)
    
    # Создаем логгер для CRUD операций биометрии
    biometry_crud_logger = logging.getLogger("app.crud.crud_biometry")
    biometry_crud_logger.setLevel(logging.DEBUG)
    
    # Создаем логгер для сервиса Assimp
    assimp_logger = logging.getLogger("app.services.assimp_service")
    assimp_logger.setLevel(logging.DEBUG)
    
    # Создаем логгер для CRUD операций моделирования
    crud_logger = logging.getLogger("app.crud.crud_modeling")
    crud_logger.setLevel(logging.DEBUG)
    
    # Создаем логгер для API
    api_logger = logging.getLogger("app.api.v1.api")
    api_logger.setLevel(logging.DEBUG)  # Изменяем на DEBUG для более подробного вывода в консоль
    
    # Создаем логгер для middleware
    middleware_logger = logging.getLogger("app.middleware.logging")
    middleware_logger.setLevel(logging.INFO)
    
    # Создаем обработчики для консоли
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)  # Изменяем на DEBUG для более подробного вывода в консоль
    console_formatter = logging.Formatter(LOG_FORMAT)
    console_handler.setFormatter(console_formatter)
    
    # Создаем обработчики для файлов
    biometry_file_handler = logging.FileHandler(BIOMETRY_LOG_FILE, encoding='utf-8')
    biometry_file_handler.setLevel(logging.DEBUG)
    biometry_file_formatter = logging.Formatter(FILE_LOG_FORMAT)
    biometry_file_handler.setFormatter(biometry_file_formatter)
    
    modeling_file_handler = logging.FileHandler(MODELING_LOG_FILE, encoding='utf-8')
    modeling_file_handler.setLevel(logging.DEBUG)
    modeling_file_formatter = logging.Formatter(FILE_LOG_FORMAT)
    modeling_file_handler.setFormatter(modeling_file_formatter)
    
    # Добавляем обработчики к логгерам
    biometry_logger.addHandler(console_handler)
    biometry_logger.addHandler(biometry_file_handler)

    storage_logger.addHandler(console_handler)
    storage_logger.addHandler(biometry_file_handler)

    modeling_logger.addHandler(console_handler)
    modeling_logger.addHandler(modeling_file_handler)
    
    biometry_api_logger.addHandler(console_handler)
    biometry_api_logger.addHandler(biometry_file_handler)

    biometry_crud_logger.addHandler(console_handler)
    biometry_crud_logger.addHandler(biometry_file_handler)
    
    assimp_logger.addHandler(console_handler)
    assimp_logger.addHandler(modeling_file_handler)
    
    crud_logger.addHandler(console_handler)
    crud_logger.addHandler(modeling_file_handler)
    
    api_logger.addHandler(console_handler)
    api_logger.addHandler(modeling_file_handler)
    
    middleware_logger.addHandler(console_handler)
    middleware_logger.addHandler(biometry_file_handler)
    
    # Предотвращаем дублирование логов в родительских логгерах
    biometry_logger.propagate = False
    storage_logger.propagate = False
    biometry_api_logger.propagate = False
    biometry_crud_logger.propagate = False
    modeling_logger.propagate = False
    assimp_logger.propagate = False
    crud_logger.propagate = False
    api_logger.propagate = False
    middleware_logger.propagate = False
    
    # Логируем успешную настройку
    biometry_logger.info("Логирование модуля биометрии настроено успешно")
    modeling_logger.info("Логирование модуля моделирования настроено успешно")
    biometry_api_logger.info("Логирование API биометрии настроено успешно")
    biometry_crud_logger.info("Логирование CRUD биометрии настроено успешно")
    middleware_logger.info("Логирование middleware настроено успешно")

def get_biometry_logger(name: str):
    """Получение логгера для модуля биометрии"""
    return logging.getLogger(f"app.api.v1.biometry.{name}")

def get_modeling_logger(name: str):
    """Получение логгера для модуля моделирования"""
    return logging.getLogger(f"app.api.v1.endpoints.modeling.{name}")

# Автоматическая настройка логирования при импорте модуля
setup_biometry_logging()