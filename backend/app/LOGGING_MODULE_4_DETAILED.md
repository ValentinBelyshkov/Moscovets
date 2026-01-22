# Детальное логгирование модуля 4 (Биометрия)

## Содержание

1. [Обзор системы логгирования](#обзор-системы-логгирования)
2. [Архитектура логгирования](#архитектура-логгирования)
3. [Уровни логгирования](#уровни-логгирования)
4. [Формат логов](#формат-логов)
5. [Логгирование в различных компонентах](#логгирование-в-различных-компонентах)
6. [Обработка ошибок и исключений](#обработка-ошибок-и-исключений)
7. [Примеры использования](#примеры-использования)
8. [Мониторинг и анализ логов](#мониторинг-и-анализ-логов)
9. [Рекомендации по настройке](#рекомендации-по-настройке)

## Обзор системы логгирования

Модуль 4 (биометрия) использует многоуровневую систему логгирования для отслеживания всех операций, связанных с 3D моделями челюстей пациентов. Система логгирования охватывает все компоненты модуля:

- API эндпоинты
- Сервисы обработки моделей
- CRUD операции
- Модели данных
- Схемы валидации
- Обработку ошибок и исключений

## Архитектура логгирования

### Логгеры

Система использует иерархию логгеров:

```
app.api.v1.biometry.*           - API эндпоинты
app.services.biometry_storage   - Сервис хранения точек
app.services.assimp_service     - Сервис обработки 3D моделей
app.crud.crud_biometry.*        - CRUD операции
app.models.biometry             - Модели данных
app.schemas.biometry            - Схемы валидации
app.exceptions.handlers         - Обработчики исключений
```

### Обработчики

- **Консольный обработчик**: Вывод в stdout для разработки
- **Файловый обработчик**: Запись в файлы `logs/biometry.log` и `logs/modeling.log`

### Форматы

- **Консольный формат**: Краткая информация для разработки
- **Файловый формат**: Подробная информация с номерами строк для анализа

## Уровни логгирования

### DEBUG
Детальная информация о процессах:
- Загрузка и анализ моделей
- Операции с базой данных
- Внутренние состояния компонентов

Примеры:
```
DEBUG - app.api.v1.biometry - Загрузка 3D модели: test_model.stl
DEBUG - app.services.assimp_service - Загрузка меша с помощью trimesh
DEBUG - app.crud.crud_biometry - Добавление записи в базу данных
```

### INFO
Основные события и операции:
- Начало и завершение операций
- Создание и обновление записей
- Успешные операции

Примеры:
```
INFO - app.api.v1.biometry - Начало загрузки 3D модели для биометрии
INFO - app.services.biometry_storage - Точка модели 1 успешно добавлена
INFO - app.crud.crud_biometry - Модель биометрии успешно создана
```

### WARNING
Предупреждения и потенциальные проблемы:
- Несуществующие объекты
- Дублирующие операции
- Нестандартные ситуации

Примеры:
```
WARNING - app.services.biometry_storage - Попытка соединения несуществующей точки модели
WARNING - app.api.v1.biometry - Сессия биометрии не найдена
WARNING - app.services.assimp_service - Контактная поверхность не найдена
```

### ERROR
Ошибки и исключения:
- Ошибки валидации
- Ошибки базы данных
- Ошибки обработки файлов

Примеры:
```
ERROR - app.api.v1.biometry - Ошибка загрузки 3D модели биометрии
ERROR - app.crud.crud_biometry - Ошибка создания модели биометрии
ERROR - app.services.assimp_service - Ошибка конвертации модели
```

## Формат логов

### Консольный формат
```
%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

Пример:
```
2025-12-10 11:30:45,123 - app.api.v1.biometry - INFO - Начало загрузки 3D модели для биометрии
```

### Файловый формат
```
%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s
```

Пример:
```
2025-12-10 11:30:45,123 - app.api.v1.biometry - INFO - biometry.py:37 - Начало загрузки 3D модели для биометрии
```

## Логгирование в различных компонентах

### API Эндпоинты

#### Загрузка моделей
```python
logger.info(f"Начало загрузки 3D модели для биометрии: {file.filename}, ID пациента: {patient_id}, тип: {model_type.value}")
logger.debug(f"Чтение содержимого файла: {file.filename}")
logger.info(f"Файл успешно прочитан, размер: {len(file_content)} байт")
```

#### Калибровка
```python
start_time = time.time()
logger.info(f"Начало калибровки биометрии: session_id={calibration_request.session_id}, user_id={current_user.id}")
# ... операции ...
execution_time = time.time() - start_time
logger.info(f"Калибровка биометрии завершена успешно: session_id={calibration_request.session_id} за {execution_time:.3f} секунд")
```

#### Экспорт моделей
```python
start_time = time.time()
logger.info(f"Начало экспорта 3D модели биометрии: session_id={export_request.session_id}, format={export_request.export_format.value}, user_id={current_user.id}")
# ... операции ...
execution_time = time.time() - start_time
logger.info(f"Модель успешно экспортирована за {execution_time:.3f} секунд")
```

### Сервисы

#### Хранение точек
```python
def add_model_point(self, data: dict) -> dict:
    start_time = time.time()
    logger.debug(f"Начало добавления точки модели с координатами: {data}")
    # ... операции ...
    execution_time = time.time() - start_time
    logger.info(f"Точка модели {point['id']} успешно добавлена за {execution_time:.3f} секунд")
```

#### Обработка 3D моделей
```python
def load_model(self, file_path: str) -> Dict[str, Any]:
    start_time = time.time()
    logger.info(f"Начало загрузки 3D модели: {file_path}")
    # ... операции ...
    execution_time = time.time() - start_time
    logger.info(f"Модель успешно загружена за {execution_time:.3f} секунд")
```

### CRUD Операции

#### Создание моделей
```python
def create_with_file(self, db: Session, *, obj_in: BiometryModelCreate, file_content: bytes) -> BiometryModel:
    start_time = time.time()
    logger.info(f"Начало создания записи модели биометрии: patient_id={obj_in.patient_id}, type={obj_in.model_type}")
    # ... операции ...
    execution_time = time.time() - start_time
    logger.info(f"Модель биометрии успешно создана за {execution_time:.3f} секунд")
```

#### Обновление параметров
```python
def update_model_parameters(self, db: Session, *, db_obj: BiometryModel, parameters: Dict[str, Any]) -> BiometryModel:
    start_time = time.time()
    logger.info(f"Начало обновления параметров модели биометрии для ID: {db_obj.id}")
    # ... операции ...
    execution_time = time.time() - start_time
    logger.info(f"Параметры модели биометрии успешно обновлены за {execution_time:.3f} секунд")
```

## Обработка ошибок и исключений

### Иерархия исключений

```
BiometryError (базовый класс)
├── ModelNotFoundError
├── SessionNotFoundError
├── FileValidationError
├── ModelProcessingError
├── StorageError
└── DatabaseError
```

### Обработчики исключений

#### Общий обработчик
```python
async def biometry_error_handler(request: Request, exc: BiometryError) -> JSONResponse:
    logger.error(
        f"Biometry error: {exc.error_code} - {exc.message}",
        extra={
            "error_code": exc.error_code,
            "message": exc.message,
            "details": exc.details,
            "url": str(request.url),
            "method": request.method
        }
    )
```

#### Обработчик HTTP исключений
```python
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    logger.warning(
        f"HTTP {exc.status_code}: {exc.detail}",
        extra={
            "status_code": exc.status_code,
            "detail": exc.detail,
            "url": str(request.url),
            "method": request.method
        }
    )
```

#### Обработчик SQLAlchemy исключений
```python
async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    logger.error(
        f"SQLAlchemy error: {str(exc)}",
        exc_info=True,
        extra={
            "error_type": type(exc).__name__,
            "error_message": str(exc),
            "traceback": traceback.format_exc()
        }
    )
```

## Примеры использования

### Анализ производительности

Для анализа производительности операций используются таймеры:

```python
start_time = time.time()
# ... операция ...
execution_time = time.time() - start_time
logger.info(f"Операция завершена за {execution_time:.3f} секунд")
```

Пример лога:
```
INFO - app.services.assimp_service - Модель успешно загружена за 2.345 секунд
INFO - app.api.v1.biometry - Калибровка биометрии завершена успешно за 0.123 секунд
```

### Отслеживание состояния системы

Для отслеживания состояния системы используются детальные логи:

```python
logger.debug(f"Текущее состояние модели: scale={db_obj.scale}, position=({db_obj.position_x}, {db_obj.position_y}, {db_obj.position_z})")
logger.info(f"Общее количество точек модели: {len(self.model_points)}")
```

### Диагностика проблем

Для диагностики проблем используются специальные метки:

```python
logger.error(f"Файл модели не найден на диске: {model.file_path}")
logger.warning(f"Попытка удаления несуществующей пары: {pair_id}")
```

## Мониторинг и анализ логов

### Ключевые метрики

1. **Время выполнения операций**:
   - Загрузка моделей
   - Анализ моделей
   - Калибровка
   - Экспорт моделей

2. **Количество операций**:
   - Загруженных моделей
   - Созданных сессий
   - Обработанных точек

3. **Ошибки и исключения**:
   - Типы ошибок
   - Частота возникновения
   - Время возникновения

### Примеры запросов для анализа

#### Поиск медленных операций
```
grep "за.*секунд" logs/biometry.log | sort -k8 -nr | head -20
```

#### Статистика по ошибкам
```
grep "ERROR" logs/biometry.log | cut -d'-' -f4 | sort | uniq -c | sort -nr
```

#### Анализ производительности загрузки
```
grep "Начало загрузки 3D модели" logs/biometry.log -A 1 | grep "успешно загружена"
```

## Рекомендации по настройке

### Для разработки

Установите уровень DEBUG для детального анализа:

```python
logging.getLogger("app.api.v1.biometry").setLevel(logging.DEBUG)
logging.getLogger("app.services").setLevel(logging.DEBUG)
logging.getLogger("app.crud").setLevel(logging.DEBUG)
```

### Для production

Используйте уровень INFO и выше:

```python
logging.getLogger("app.api.v1.biometry").setLevel(logging.INFO)
logging.getLogger("app.services").setLevel(logging.INFO)
logging.getLogger("app.crud").setLevel(logging.INFO)
```

### Для диагностики проблем

Включите уровень DEBUG только для проблемных компонентов:

```python
# Только для API
logging.getLogger("app.api.v1.biometry").setLevel(logging.DEBUG)

# Только для сервисов
logging.getLogger("app.services").setLevel(logging.DEBUG)

# Только для CRUD операций
logging.getLogger("app.crud").setLevel(logging.DEBUG)
```

### Ротация логов

Для предотвращения переполнения диска настройте ротацию логов:

```python
from logging.handlers import RotatingFileHandler

file_handler = RotatingFileHandler(
    BIOMETRY_LOG_FILE,
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5,
    encoding='utf-8'
)
```

## Заключение

Система логгирования модуля 4 (биометрия) предоставляет:

1. **Полный контроль** над всеми операциями
2. **Детальную диагностику** проблем
3. **Анализ производительности** системы
4. **Удобный мониторинг** состояния модуля
5. **Гибкую настройку** уровней логгирования

Для эффективного использования системы логгирования рекомендуется:

- Регулярно анализировать логи на предмет ошибок
- Мониторить производительность операций
- Настроить алерты на критические ошибки
- Использовать логи для оптимизации производительности
- Документировать типичные проблемы и их решения

---

**Версия документации**: 1.0  
**Дата создания**: 2025-12-10  
**Автор**: Система логгирования модуля 4