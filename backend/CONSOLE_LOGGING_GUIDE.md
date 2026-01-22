# Логирование в консоль для модуля 4

## Обзор

Теперь все логи модуля 4 (биометрия) выводятся в консоль в реальном времени, что позволяет оперативно отслеживать работу системы.

## Как работает

### Уровни логирования в консоли

- **DEBUG** - Самые подробные сообщения, включая внутренние операции
- **INFO** - Общая информация о ходе выполнения операций
- **WARNING** - Предупреждения о потенциальных проблемах
- **ERROR** - Ошибки, требующие внимания

### Что выводится в консоль

1. **Загрузка 3D моделей**
   ```
   2025-12-05 13:08:15 - app.api.v1.endpoints.modeling - INFO - Starting 3D model upload: upper_jaw.stl, patient_id: 123, type: upper_jaw
   2025-12-05 13:08:15 - app.services.assimp_service - DEBUG - Loading mesh with trimesh: uploads/3d_models/upper_jaw_123456.stl
   2025-12-05 13:08:15 - app.services.assimp_service - INFO - Model loaded successfully: uploads/3d_models/upper_jaw_123456.stl, vertices: 15000, faces: 30000, defects: 2
   ```

2. **Операции с точками**
   ```
   2025-12-05 13:09:20 - app.api.v1.biometry - INFO - Adding model point with coordinates: x=10.5, y=20.3, z=5.2
   2025-12-05 13:09:20 - app.services.biometry_storage - DEBUG - Added model point 1: x=10.5, y=20.3, z=5.2
   2025-12-05 13:09:21 - app.api.v1.biometry - INFO - Adding map point with coordinates: lat=55.7558, lng=37.6176
   ```

3. **Создание окклюзионных накладок**
   ```
   2025-12-05 13:10:30 - app.api.v1.endpoints.modeling - INFO - Creating occlusion pad: upper=uploads/upper.stl, lower=uploads/lower.stl, output=uploads/pad.stl
   2025-12-05 13:10:30 - app.services.assimp_service - DEBUG - Loading upper jaw model
   2025-12-05 13:10:30 - app.services.assimp_service - DEBUG - Loading lower jaw model
   2025-12-05 13:10:30 - app.services.assimp_service - INFO - Occlusion pad created successfully: uploads/pad.stl
   ```

4. **CRUD операции**
   ```
   2025-12-05 13:11:45 - app.crud.crud_modeling - DEBUG - Creating database record for 3D model
   2025-12-05 13:11:45 - app.crud.crud_modeling - INFO - 3D model successfully created: ID=456, file=upper_jaw.stl
   2025-12-05 13:11:46 - app.crud.crud_modeling - DEBUG - Updated scale: 1.0 -> 1.2
   2025-12-05 13:11:46 - app.crud.crud_modeling - INFO - Model parameters updated successfully for ID: 456
   ```

## Как проверить работу логирования

### 1. Запуск тестового скрипта

```bash
cd backend
python test_logging.py
```

Этот скрипт выведет примеры всех типов логов в консоль.

### 2. Запуск приложения

```bash
cd backend
python main.py
```

Или через Docker:
```bash
docker-compose up
```

После запуска вы увидите сообщения:
```
2025-12-05 18:37:00 - root - INFO - FastAPI application starting...
2025-12-05 18:37:00 - app.api.v1.api - INFO - API routers initialized, including modeling module
2025-12-05 18:37:00 - app.api.v1.endpoints.modeling - INFO - Modeling module logging configured successfully
2025-12-05 18:37:00 - app.api.v1.biometry - INFO - Biometry module logging configured successfully
2025-12-05 18:37:00 - root - INFO - FastAPI application startup completed
```

### 3. Выполнение операций

После запуска приложения, выполните любые операции через API, и вы увидите соответствующие логи в консоли:

- Загрузка моделей: `POST /api/v1/modeling/upload-model`
- Добавление точек: `POST /api/v1/biometry/add-model-point`
- Создание накладок: `POST /api/v1/modeling/create-occlusion-pad`
- И т.д.

## Фильтрация логов в консоли

### Просмотр только определенных компонентов

```bash
# Просмотр только логов моделирования
python main.py 2>&1 | grep "modeling"

# Просмотр только логов биометрии
python main.py 2>&1 | grep "biometry"

# Просмотр только логов Assimp
python main.py 2>&1 | grep "assimp_service"
```

### Просмотр только ошибок

```bash
python main.py 2>&1 | grep "ERROR"
```

### Просмотр только информационных сообщений

```bash
python main.py 2>&1 | grep "INFO"
```

## Настройка уровней логирования

Если нужно изменить уровень детализации логов в консоли:

### Вариант 1: Через logging_config.py

```python
# Для менее подробного логирования (только INFO и выше)
console_handler.setLevel(logging.INFO)

# Для более подробного логирования (все уровни)
console_handler.setLevel(logging.DEBUG)

# Для показа только предупреждений и ошибок
console_handler.setLevel(logging.WARNING)
```

### Вариант 2: Через переменные окружения

Создайте файл `.env` в директории backend:

```bash
# Уровень логирования для всего приложения
LOG_LEVEL=DEBUG

# Или для конкретных модулей
BIOMETRY_LOG_LEVEL=INFO
MODELING_LOG_LEVEL=DEBUG
ASSIMP_LOG_LEVEL=WARNING
```

### Вариант 3: Через аргументы командной строки

```bash
# Запуск с определенным уровнем логирования
python main.py --log-level DEBUG
```

## Примеры использования в реальной работе

### 1. Мониторинг загрузки моделей

Откройте терминал и запустите приложение:
```bash
cd backend
python main.py
```

В другом терминале выполните загрузку модели:
```bash
curl -X POST "http://localhost:8000/api/v1/modeling/upload-model" \
  -H "accept: application/json" \
  -F "file=@upper_jaw.stl" \
  -F "patient_id=123" \
  -F "model_type=upper_jaw" \
  -F "model_format=STL"
```

В первом терминале вы увидите подробные логи:
```
2025-12-05 18:38:00 - app.api.v1.endpoints.modeling - INFO - Starting 3D model upload: upper_jaw.stl, patient_id: 123, type: upper_jaw
2025-12-05 18:38:00 - app.api.v1.endpoints.modeling - DEBUG - Reading file content: upper_jaw.stl
2025-12-05 18:38:00 - app.api.v1.endpoints.modeling - INFO - File read successfully, size: 2048576 bytes
2025-12-05 18:38:00 - app.api.v1.endpoints.modeling - DEBUG - Generated file path: uploads/3d_models/upper_jaw_123456.stl
2025-12-05 18:38:00 - app.services.assimp_service - INFO - Loading 3D model: uploads/3d_models/upper_jaw_123456.stl
2025-12-05 18:38:01 - app.services.assimp_service - DEBUG - Loading mesh with trimesh: uploads/3d_models/upper_jaw_123456.stl
2025-12-05 18:38:01 - app.services.assimp_service - DEBUG - Calculating mesh metadata
2025-12-05 18:38:01 - app.services.assimp_service - INFO - Model loaded successfully: uploads/3d_models/upper_jaw_123456.stl, vertices: 15000, faces: 30000, defects: 2
2025-12-05 18:38:01 - app.api.v1.endpoints.modeling - DEBUG - Creating database record for 3D model
2025-12-05 18:38:01 - app.api.v1.endpoints.modeling - INFO - 3D model successfully uploaded with ID: 456
```

### 2. Отладка проблем

Если что-то работает не так, включите DEBUG уровень и ищите сообщения:
```bash
# В коде измените уровень на DEBUG
console_handler.setLevel(logging.DEBUG)
```

Теперь вы увидите все внутренние операции, что поможет в диагностике проблем.

## Советы и рекомендации

1. **Для разработки** используйте уровень DEBUG - вы увидите все детали работы системы
2. **Для продакшена** рекомендуется уровень INFO - достаточно информации, но не перегружает консоль
3. **Для поиска ошибок** используйте уровень WARNING и ERROR
4. **Для мониторинга производительности** ищите сообщения "completed successfully" и измеряйте время между операциями

## Проблемы и решения

### Проблема: Логи не выводятся в консоль
**Решение:**
- Проверьте, что `console_handler` добавлен к логгерам
- Убедитесь, что уровень логирования не слишком высокий
- Проверьте, что `propagate = False` не блокирует вывод

### Проблема: Слишком много логов
**Решение:**
- Увеличьте уровень логирования до INFO или WARNING
- Используйте фильтрацию через grep
- Отключите DEBUG логирование для определенных модулей

### Проблема: Логи выводятся, но не в том формате
**Решение:**
- Проверьте формат в `console_formatter`
- Убедитесь, что используется правильный обработчик

Теперь вы можете видеть все логи модуля 4 прямо в консоли во время работы приложения!