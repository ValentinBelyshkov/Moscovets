"""
Вспомогательные функции для логирования
"""
import time
import logging
from functools import wraps
from typing import Callable, Any


def log_execution_time(logger: logging.Logger):
    """
    Декоратор для логирования времени выполнения функции
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs) -> Any:
            start_time = time.time()
            func_name = func.__name__
            logger.info(f"Начало выполнения: {func_name}")
            
            try:
                result = await func(*args, **kwargs)
                execution_time = time.time() - start_time
                logger.info(f"Успешное завершение {func_name} за {execution_time:.3f} сек")
                return result
            except Exception as e:
                execution_time = time.time() - start_time
                logger.error(f"Ошибка в {func_name} за {execution_time:.3f} сек: {str(e)}")
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs) -> Any:
            start_time = time.time()
            func_name = func.__name__
            logger.info(f"Начало выполнения: {func_name}")
            
            try:
                result = func(*args, **kwargs)
                execution_time = time.time() - start_time
                logger.info(f"Успешное завершение {func_name} за {execution_time:.3f} сек")
                return result
            except Exception as e:
                execution_time = time.time() - start_time
                logger.error(f"Ошибка в {func_name} за {execution_time:.3f} сек: {str(e)}")
                raise
        
        return async_wrapper if hasattr(func, '__await__') or hasattr(func, '__aiter__') else sync_wrapper
    
    return decorator
