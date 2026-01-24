import logging
import time
from datetime import datetime
from typing import Callable, Awaitable
from fastapi import Request, Response
from fastapi.responses import StreamingResponse
import json
from starlette.types import ASGIApp, Receive, Scope, Send


class LoggingMiddleware:
    """
    Middleware для логирования всех HTTP запросов и ответов
    """
    
    def __init__(self, app: ASGIApp):
        self.app = app
        self.logger = logging.getLogger("app.middleware.logging")
        
        # Настройка форматтера для этого логгера
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)
            self.logger.propagate = False
    
    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        start_time = time.time()
        
        # Сохраняем начальное время в состояние запроса
        request.state.request_start_time = datetime.utcnow()
        
        # Логируем только базовую информацию о запросе без чтения тела
        await self.log_request_basic(request, start_time)
        
        # Capture response
        response_body = b""
        
        async def capture_response(response_send):
            nonlocal response_body
            if response_send["type"] == "http.response.body":
                body = response_send.get("body", b"")
                response_body += body
            await send(response_send)
        
        try:
            await self.app(scope, receive, capture_response)
            
            # Determine response status
            response_status = getattr(request.state, 'response_status', 200)
            
            # Log request completion
            await self.log_response(
                request=request,
                response_body=response_body.decode('utf-8', errors='ignore'),
                start_time=start_time,
                status_code=response_status
            )
            
        except Exception as e:
            # Log error
            await self.log_error(request, e, start_time)
            raise
    
    async def log_request_basic(self, request: Request, start_time: float):
        """Log basic request information without reading the body"""
        try:
            client_host = request.client.host if request.client else "unknown"
            client_port = request.client.port if request.client else "unknown"
            
            self.logger.info(
                f"REQUEST - {request.method} {request.url.path} "
                f"from {client_host}:{client_port} "
                f"- Headers: {dict(request.headers)} "
                f"- Method: {request.method} "
                f"- Path: {request.url.path}"
            )
        except Exception as e:
            self.logger.warning(f"Failed to log request: {e}")
    
    async def log_response(self, request: Request, response_body: str, start_time: float, status_code: int):
        """Log outgoing response"""
        duration = time.time() - start_time
        
        try:
            client_host = request.client.host if request.client else "unknown"
            
            # Try to parse response body as JSON for better formatting
            response_content = response_body
            try:
                parsed_response = json.loads(response_body)
                response_content = json.dumps(parsed_response, ensure_ascii=False, indent=2)[:1000]
            except (json.JSONDecodeError, TypeError):
                response_content = response_body[:1000]
            
            self.logger.info(
                f"RESPONSE - {request.method} {request.url.path} "
                f"- Status: {status_code} "
                f"- Duration: {duration:.3f}s "
                f"- Client: {client_host} "
                f"- Content: {response_content[:500]}{'...' if len(response_content) > 500 else ''}"
            )
        except Exception as e:
            self.logger.warning(f"Failed to log response: {e}")
    
    async def log_error(self, request: Request, error: Exception, start_time: float):
        """Log errors"""
        duration = time.time() - start_time
        
        try:
            client_host = request.client.host if request.client else "unknown"
            
            self.logger.error(
                f"ERROR - {request.method} {request.url.path} "
                f"- Duration: {duration:.3f}s "
                f"- Client: {client_host} "
                f"- Error: {type(error).__name__}: {str(error)}",
                exc_info=True  # Include traceback
            )
        except Exception as e:
            self.logger.error(f"Failed to log error: {e}")
    
    async def log_request(self, request: Request, start_time: float):
        """Логирование входящего запроса"""
        try:
            # Получаем тело запроса если возможно, но НЕ потребляем его
            # Instead of consuming the request body here, we'll just log the headers and URL
            client_host = request.client.host if request.client else "unknown"
            client_port = request.client.port if request.client else "unknown"
            
            self.logger.info(
                f"REQUEST - {request.method} {request.url.path} "
                f"from {client_host}:{client_port} "
                f"- Headers: {dict(request.headers)}"
            )
        except Exception as e:
            self.logger.warning(f"Failed to log request: {e}")
    
    async def log_response(self, request: Request, response_body: str, start_time: float, status_code: int):
        """Логирование исходящего ответа"""
        duration = time.time() - start_time
        
        try:
            client_host = request.client.host if request.client else "unknown"
            
            # Попробуем распарсить тело ответа как JSON для лучшего отображения
            response_content = response_body
            try:
                parsed_response = json.loads(response_body)
                response_content = json.dumps(parsed_response, ensure_ascii=False, indent=2)[:1000]
            except (json.JSONDecodeError, TypeError):
                response_content = response_body[:1000]
            
            self.logger.info(
                f"RESPONSE - {request.method} {request.url.path} "
                f"- Status: {status_code} "
                f"- Duration: {duration:.3f}s "
                f"- Client: {client_host} "
                f"- Content: {response_content[:500]}{'...' if len(response_content) > 500 else ''}"
            )
        except Exception as e:
            self.logger.warning(f"Failed to log response: {e}")
    
    async def log_error(self, request: Request, error: Exception, start_time: float):
        """Логирование ошибок"""
        duration = time.time() - start_time
        
        try:
            client_host = request.client.host if request.client else "unknown"
            
            self.logger.error(
                f"ERROR - {request.method} {request.url.path} "
                f"- Duration: {duration:.3f}s "
                f"- Client: {client_host} "
                f"- Error: {type(error).__name__}: {str(error)}",
                exc_info=True  # Добавляем трейсбек ошибки
            )
        except Exception as e:
            self.logger.error(f"Failed to log error: {e}")