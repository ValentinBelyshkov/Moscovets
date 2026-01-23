# Руководство по использованию логирования в модуле 4

## Быстрый старт

### 1. Запуск приложения

После добавления логирования, при запуске приложения автоматически создаются файлы логов:

```bash
# Запуск backend
cd backend
python main.py

# Или через Docker
docker-compose up
```

### 2. Просмотр логов

#### В реальном времени
```bash
# Просмотр логов биометрии
tail -f logs/biometry.log

# Просмотр логов моделирования
tail -f logs/modeling.log

# Просмотр общих логов
tail -f logs/app.log
```

#### Поиск по логам
```bash
# Поиск ошибок
grep "ERROR" logs/biometry.log

# Поиск загрузки моделей
grep "upload" logs/modeling.log

# Поиск операций с точками
grep "point" logs/biometry.log
```

### 3. Уровни логирования

#### Изменение уровня логирования

Для изменения уровня логирования можно модифицировать `backend/app/logging_config.py`:

```python
# Для более подробного логирования
biometry_logger.setLevel(logging.DEBUG)
modeling_logger.setLevel(logging.DEBUG)

# Для менее подробного логирования
biometry_logger.setLevel(logging.WARNING)
modeling_logger.setLevel(logging.ERROR)
```

### 4. Примеры использования

#### Мониторинг загрузки моделей

```bash
# Открываем терминал и наблюдаем за загрузкой
tail -f logs/modeling.log | grep "upload"

# Вывод:
# 2025-12-05 13:08:15 - app.api.v1.endpoints.modeling - INFO - Starting 3D model upload: upper_jaw.stl, patient_id: 123, type: upper_jaw
# 2025-12-05 13:08:15 - app.services.assimp_service - INFO - Model loaded successfully: uploads/3d_models/upper_jaw_123456.stl, vertices: 15000, faces: 30000, defects: 2
# 2025-12-05 13:08:15 - app.api.v1.endpoints.modeling - INFO - 3D model successfully uploaded with ID: 456
```

#### Отладка операций с точками

```bash
# Наблюдаем за операциями с точками
tail -f logs/biometry.log | grep "point"

# Вывод:
# 2025-12-05 13:09:20 - app.api.v1.biometry - INFO - Adding model point with coordinates: x=10.5, y=20.3, z=5.2
# 2025-12-05 13:09:20 - app.services.biometry_storage - DEBUG - Added model point 1: x=10.5, y=20.3, z=5.2
# 2025-12-05 13:09:21 - app.api.v1.biometry - INFO - Adding map point with coordinates: lat=55.7558, lng=37.6176
# 2025-12-05 13:09:21 - app.services.biometry_storage - DEBUG - Added map point 1: lat=55.7558, lng=37.6176
# 2025-12-05 13:09:22 - app.api.v1.biometry - INFO - Creating pair between model point 1 and map point 1
# 2025-12-05 13:09:22 - app.services.biometry_storage - INFO - Created new pair 1: model point 1 -> map point 1
```

#### Мониторинг создания окклюзионных накладок

```bash
# Наблюдаем за созданием накладок
tail -f logs/modeling.log | grep "occlusion"

# Вывод:
# 2025-12-05 13:10:30 - app.api.v1.endpoints.modeling - INFO - Creating occlusion pad: upper=uploads/upper.stl, lower=uploads/lower.stl, output=uploads/pad.stl
# 2025-12-05 13:10:30 - app.services.assimp_service - INFO - Loading upper jaw model
# 2025-12-05 13:10:30 - app.services.assimp_service - INFO - Loading lower jaw model
# 2025-12-05 13:10:30 - app.services.assimp_service - DEBUG - Finding contact surface between jaws
# 2025-12-05 13:10:30 - app.services.assimp_service - INFO - Occlusion pad created successfully: uploads/pad.stl
```

### 5. Анализ проблем

#### Поиск ошибок загрузки моделей

```bash
# Поиск ошибок при загрузке
grep -A 5 -B 5 "ERROR.*upload" logs/modeling.log

# Пример вывода:
# 2025-12-05 13:08:15 - app.api.v1.endpoints.modeling - INFO - Starting 3D model upload: broken_model.stl, patient_id: 123, type: upper_jaw
# 2025-12-05 13:08:15 - app.services.assimp_service - ERROR - Error loading model uploads/3d_models/broken_model_123456.stl: File is corrupted
# 2025-12-05 13:08:15 - app.api.v1.endpoints.modeling - ERROR - Error uploading 3D model broken_model.stl: File is corrupted
```

#### Поиск проблем с дефектами моделей

```bash
# Поиск моделей с дефектами
grep "defects:" logs/modeling.log

# Вывод:
# 2025-12-05 13:08:15 - app.services.assimp_service - INFO - Model loaded successfully: uploads/3d_models/model1.stl, vertices: 15000, faces: 30000, defects: 2
# 2025-12-05 13:08:16 - app.services.assimp_service - INFO - Model loaded successfully: uploads/3d_models/model2.stl, vertices: 12000, faces: 24000, defects: 0
# 2025-12-05 13:08:17 - app.services.assimp_service - INFO - Model loaded successfully: uploads/3d_models/model3.stl, vertices: 18000, faces: 36000, defects: 5
```

#### Мониторинг производительности

```bash
# Поиск времени выполнения операций
grep "completed successfully" logs/modeling.log

# Вывод:
# 2025-12-05 13:08:15 - app.api.v1.endpoints.modeling - INFO - 3D model successfully uploaded with ID: 456
# 2025-12-05 13:08:20 - app.api.v1.endpoints.modeling - INFO - Model analysis completed: vertices=15000, faces=30000
# 2025-12-05 13:10:30 - app.services.assimp_service - INFO - Occlusion pad created successfully: uploads/pad.stl
```

### 6. Полезные команды

#### Архивирование старых логов

```bash
# Архивирование логов за предыдущий месяц
tar -czf logs_$(date -d "last month" +%Y-%m).tar.gz logs/*.log

# Очистка старых логов (осторожно!)
> logs/biometry.log
> logs/modeling.log
> logs/app.log
```

#### Фильтрация логов по времени

```bash
# Просмотр логов за определенный период
sed -n '/2025-12-05 13:00:00/,/2025-12-05 14:00:00/p' logs/modeling.log

# Использование awk для фильтрации по времени
awk '$1 >= "2025-12-05" && $2 >= "13:00:00"' logs/biometry.log
```

#### Статистика по операциям

```bash
# Подсчет операций загрузки
grep -c "Starting 3D model upload" logs/modeling.log

# Подсчет созданных накладок
grep -c "Occlusion pad created successfully" logs/modeling.log

# Подсчет добавленных точек
grep -c "Adding model point" logs/biometry.log
```

### 7. Интеграция с системами мониторинга

#### Для Prometheus/Grafana

Можно использовать инструменты вроде `promtail` для отправки логов в Loki:

```yaml
# promtail-config.yml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: biometry-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: biometry
          __path__: /app/logs/biometry.log
    pipeline_stages:
      - json:
          expressions:
            timestamp: timestamp
            level: level
            logger: logger
            message: message
      - timestamp:
          source: timestamp
          format: RFC3339
      - labels:
          level:
          logger:
```

#### Для ELK Stack

Использование Filebeat для отправки логов в Elasticsearch:

```yaml
# filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /app/logs/biometry.log
    - /app/logs/modeling.log
    - /app/logs/app.log
  fields:
    service: moskovets3d
    module: biometry
  fields_under_root: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "moskovets3d-logs-%{+yyyy.MM.dd}"
```

### 8. Советы и рекомендации

1. **Регулярно очищайте логи** - они могут занимать много места на диске
2. **Используйте фильтрацию** - для поиска конкретных проблем используйте grep с ключевыми словами
3. **Мониторьте производительность** - логирование может влиять на производительность при высокой нагрузке
4. **Настройте ротацию логов** - используйте logrotate для автоматической ротации файлов логов
5. **Храните логи безопасно** - убедитесь, что логи не содержат конфиденциальной информации

### 9. Примеры logrotate конфигурации

```bash
# /etc/logrotate.d/moskovets3d
/app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        # Команда для перезапуска приложения (если нужно)
        # systemctl restart moskovets3d
    endscript
}
```

Теперь вы можете эффективно использовать логирование для мониторинга, отладки и анализа работы модуля 4!