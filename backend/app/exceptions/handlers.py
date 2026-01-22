"""
Обработчики исключений для модуля биометрии (модуль 4)
"""
import logging
import traceback
from typing import Dict, Any, Optional
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

# Настройка логирования для обработчиков исключений
logger = logging.getLogger(__name__)

class BiometryError(Exception):
    """Базовый класс для исключений модуля биометрии"""
    def __init__(self, message: str, error_code: str = "", details: Dict[str, Any] = {}):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)

class ModelNotFoundError(BiometryError):
    """Исключение: модель не найдена"""
    def __init__(self, model_id: int, details: Dict[str, Any] = {}):
        super().__init__(
            message=f"Model with ID {model_id} not found",
            error_code="MODEL_NOT_FOUND",
            details={"model_id": model_id, **(details or {})}
        )

class SessionNotFoundError(BiometryError):
    """Исключение: сессия не найдена"""
    def __init__(self, session_id: int, details: Dict[str, Any] = {}):
        super().__init__(
            message=f"Session with ID {session_id} not found",
            error_code="SESSION_NOT_FOUND",
            details={"session_id": session_id, **(details or {})}
        )

class FileValidationError(BiometryError):
    """Исключение: ошибка валидации файла"""
    def __init__(self, filename: str, error_details: str, details: Dict[str, Any] = {}):
        super().__init__(
            message=f"File validation error for {filename}: {error_details}",
            error_code="FILE_VALIDATION_ERROR",
            details={"filename": filename, "error_details": error_details, **(details or {})}
        )

class ModelProcessingError(BiometryError):
    """Исключение: ошибка обработки модели"""
    def __init__(self, operation: str, model_id: Optional[int] = None, error_details: str = "", details: Dict[str, Any] = {}):
        super().__init__(
            message=f"Error during {operation} for model {model_id}: {error_details}",
            error_code="MODEL_PROCESSING_ERROR",
            details={
                "operation": operation,
                "model_id": model_id,
                "error_details": error_details,
                **(details or {})
            }
        )

class StorageError(BiometryError):
    """Исключение: ошибка хранилища"""
    def __init__(self, operation: str, error_details: str, details: Dict[str, Any] = {}):
        super().__init__(
            message=f"Storage error during {operation}: {error_details}",
            error_code="STORAGE_ERROR",
            details={"operation": operation, "error_details": error_details, **(details or {})}
        )

class DatabaseError(BiometryError):
    """Исключение: ошибка базы данных"""
    def __init__(self, operation: str, error_details: str, details: Dict[str, Any] = {}):
        super().__init__(
            message=f"Database error during {operation}: {error_details}",
            error_code="DATABASE_ERROR",
            details={"operation": operation, "error_details": error_details, **(details or {})}
        )

async def biometry_error_handler(request: Request, exc: BiometryError) -> JSONResponse:
    """
    Обработчик исключений модуля биометрии
    
    Args:
        request: HTTP запрос
        exc: Исключение BiometryError
        
    Returns:
        JSONResponse с деталями ошибки
    """
    # Логируем исключение
    logger.error(
        f"Biometry error: {exc.error_code} - {exc.message}",
        extra={
            "error_code": exc.error_code,
            "message": exc.message,
            "details": exc.details,
            "url": str(request.url),
            "method": request.method,
            "client": request.client.host if request.client else None
        }
    )
    
    # Формируем ответ
    return JSONResponse(
        status_code=400,
        content={
            "error": True,
            "error_code": exc.error_code,
            "message": exc.message,
            "details": exc.details,
            "timestamp": str(request.state.request_start_time) if hasattr(request.state, 'request_start_time') else None
        }
    )

async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Обработчик HTTP исключений
    
    Args:
        request: HTTP запрос
        exc: HTTPException
        
    Returns:
        JSONResponse с деталями ошибки
    """
    # Логируем HTTP исключение
    logger.warning(
        f"HTTP {exc.status_code}: {exc.detail}",
        extra={
            "status_code": exc.status_code,
            "detail": exc.detail,
            "url": str(request.url),
            "method": request.method,
            "client": request.client.host if request.client else None
        }
    )
    
    # Формируем ответ
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "status_code": exc.status_code,
            "message": exc.detail,
            "timestamp": str(request.state.request_start_time) if hasattr(request.state, 'request_start_time') else None
        }
    )

async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """
    Обработчик SQLAlchemy исключений
    
    Args:
        request: HTTP запрос
        exc: SQLAlchemyError
        
    Returns:
        JSONResponse с деталями ошибки
    """
    # Логируем SQLAlchemy исключение
    logger.error(
        f"SQLAlchemy error: {str(exc)}",
        exc_info=True,
        extra={
            "error_type": type(exc).__name__,
            "error_message": str(exc),
            "url": str(request.url),
            "method": request.method,
            "client": request.client.host if request.client else None,
            "traceback": traceback.format_exc()
        }
    )
    
    # Формируем ответ
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "error_code": "DATABASE_ERROR",
            "message": "Database operation failed",
            "details": {
                "error_type": type(exc).__name__,
                "error_message": str(exc)
            },
            "timestamp": str(request.state.request_start_time) if hasattr(request.state, 'request_start_time') else None
        }
    )

async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Обработчик общих исключений
    
    Args:
        request: HTTP запрос
        exc: Любое исключение
        
    Returns:
        JSONResponse с деталями ошибки
    """
    # Логируем общее исключение
    logger.error(
        f"Unhandled exception: {type(exc).__name__}: {str(exc)}",
        exc_info=True,
        extra={
            "error_type": type(exc).__name__,
            "error_message": str(exc),
            "url": str(request.url),
            "method": request.method,
            "client": request.client.host if request.client else None,
            "traceback": traceback.format_exc()
        }
    )
    
    # Формируем ответ
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "error_code": "INTERNAL_ERROR",
            "message": "Internal server error",
            "details": {
                "error_type": type(exc).__name__,
                "error_message": str(exc) if logger.level <= logging.DEBUG else "See server logs for details"
            },
            "timestamp": str(request.state.request_start_time) if hasattr(request.state, 'request_start_time') else None
        }
    )

def setup_exception_handlers(app):
    """
    Настройка обработчиков исключений для приложения
    
    Args:
        app: FastAPI приложение
    """
    logger.info("Настройка обработчиков исключений для модуля биометрии")
    
    # Регистрируем обработчики исключений
    app.add_exception_handler(BiometryError, biometry_error_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(SQLAlchemyError, sqlalchemy_error_handler)
    app.add_exception_handler(Exception, general_exception_handler)
    
    logger.info("Обработчики исключений успешно настроены")