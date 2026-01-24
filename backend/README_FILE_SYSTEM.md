# Руководство по системе управления файлами с версионированием

## Краткое описание

Реализована улучшенная система управления бинарными файлами для медицинского проекта с поддержкой:

- **Организации по пациентам**: Файлы автоматически структурируются по пациентам и типам
- **Медицинских форматов**: Поддержка фото, рентгенов, КТ, МРТ, STL моделей, документов
- **Версионирования**: Полная история изменений с контекстом (baseline, followup, treatment, surgical, final)
- **Контроля целостности**: SHA256 хеширование всех файлов
- **Метаданных**: Богатые медицинские метаданные (даты исследований, области тела, категории)

## Быстрый старт

### 1. Миграция существующих данных

```bash
cd backend

# Сначала мигрируем схему базы данных
python migrate_schema.py --dry-run  # Проверить план
python migrate_schema.py            # Применить изменения

# Затем мигрируем существующие файлы
python migrate_files.py
```

### 2. Использование новых API endpoints

#### Загрузка медицинского файла

```bash
# Загрузка КТ скана
curl -X POST "http://localhost:8000/api/v1/files/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@ct_scan.dcm" \
  -F "patient_id=1" \
  -F "file_type=ct_scan" \
  -F "medical_category=diagnostic" \
  -F "study_date=2024-01-15" \
  -F "body_part=upper_jaw"

# Загрузка STL модели
curl -X POST "http://localhost:8000/api/v1/files/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@model.stl" \
  -F "patient_id=1" \
  -F "file_type=stl_model" \
  -F "medical_category=treatment" \
  -F "description=3D модель для планирования лечения"
```

#### Получение файлов пациента

```bash
# Все файлы пациента
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/api/v1/files/patient/1/files"

# Только КТ сканы
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/api/v1/files/patient/1/files?file_type=ct_scan"

# Группировка по типам
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/api/v1/files/patient/1/files/categorized"
```

#### Создание новой версии

```bash
curl -X POST "http://localhost:8000/api/v1/files/upload-version/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@follow_up_ct.dcm" \
  -F "version_type=followup" \
  -F "version_description=Контроль через 6 месяцев после лечения"
```

### 3. Использование в Python коде

```python
from app.services.file_storage_service import FileStorageService
from app.models.file import MedicalFileType
from datetime import date

# Создание экземпляра сервиса
storage = FileStorageService()

# Генерация пути для файла
file_path, filename = storage.generate_file_path(
    patient_id=123,
    file_type=MedicalFileType.CT_SCAN,
    original_filename="scan.dcm",
    study_date=date(2024, 1, 15)
)

print(f"Файл будет сохранен как: {file_path}")

# Информация о хранилище пациента
info = storage.get_patient_storage_info(patient_id=123)
print(f"Всего файлов: {info['file_count']}")
print(f"Общий размер: {info['total_size_mb']} MB")
```

## Структура файловой системы

После миграции ваши файлы будут организованы следующим образом:

```
storage/
├── patients/
│   ├── patient_1/
│   │   ├── photos/
│   │   │   ├── 20240115_photo_a1b2c3d4.jpg
│   │   │   └── 20240120_photo_f5g6h7i8.jpg
│   │   ├── ct_scans/
│   │   │   ├── 20240110_ct_j9k0l1m2.dcm
│   │   │   └── 20240125_ct_n3o4p5q6.dcm
│   │   ├── stl_models/
│   │   │   └── 20240112_stl_r7s8t9u0.stl
│   │   └── documents/
│   │       └── 20240118_doc_v1w2x3y4.pdf
│   └── patient_2/
│       └── photos/
│           └── 20240115_photo_z9a8b7c6.jpg
├── temp/
└── backups/
```

## Типы файлов и их назначение

### Медицинские изображения
- **photo**: Клинические фотографии пациента
- **xray**: Рентгенограммы
- **panoramic**: Панорамные снимки зубов

### КТ и МРТ данные  
- **ct_scan**: Компьютерная томография
- **dicom**: DICOM формат (универсальный медицинский)
- **mri**: Магнитно-резонансная томография

### 3D модели
- **stl_model**: STL для 3D печати
- **obj_model**: OBJ 3D модели
- **ply_model**: PLY формат

### Документы
- **pdf**: PDF документы
- **document**: Word, текстовые файлы  
- **report**: Медицинские отчеты

## Типы версий файлов

- **baseline**: Исходная версия файла
- **followup**: Контрольная версия (последующие снимки)
- **treatment**: Версия, связанная с лечением
- **surgical**: Хирургическая версия
- **final**: Финальная версия

## API Reference

### Основные endpoints

#### `POST /api/v1/files/upload`
Загрузка нового файла с автоматической организацией.

**Параметры:**
- `file` (file): Файл для загрузки
- `patient_id` (int): ID пациента  
- `file_type` (string): Тип файла (обязательно)
- `medical_category` (string): Категория (clinical/diagnostic/treatment/surgical)
- `study_date` (string): Дата исследования (YYYY-MM-DD)
- `body_part` (string): Область тела
- `description` (string): Описание

#### `GET /api/v1/files/patient/{patient_id}/files`
Получение файлов пациента.

**Параметры запроса:**
- `file_type` (string): Фильтр по типу
- `medical_category` (string): Фильтр по категории

#### `POST /api/v1/files/upload-version/{file_id}`
Загрузка новой версии файла.

**Параметры:**
- `file` (file): Новый файл
- `version_type` (string): Тип версии
- `version_description` (string): Описание изменений

#### `GET /api/v1/files/patient/{patient_id}/storage-info`
Информация о хранилище пациента.

#### `GET /api/v1/files/patient/{patient_id}/files/categorized`
Файлы пациента, сгруппированные по типам.

### Примеры ответов

#### Информация о хранилище
```json
{
  "exists": true,
  "total_size": 157286400,
  "total_size_mb": 150.0,
  "file_count": 25,
  "directories": {
    "photos": {
      "path": "storage/patients/patient_1/photos",
      "file_count": 8,
      "size_bytes": 52428800,
      "size_mb": 50.0
    },
    "ct_scans": {
      "path": "storage/patients/patient_1/ct_scans", 
      "file_count": 3,
      "size_bytes": 104857600,
      "size_mb": 100.0
    }
  }
}
```

#### Файлы сгруппированные по типам
```json
{
  "photo": [
    {
      "id": 1,
      "patient_id": 1,
      "file_path": "storage/patients/patient_1/photos/20240115_photo_a1b2c3d4.jpg",
      "file_type": "photo",
      "medical_category": "clinical",
      "study_date": "2024-01-15",
      "body_part": "face",
      "description": "Исходное фото",
      "file_size": 1048576,
      "mime_type": "image/jpeg"
    }
  ],
  "ct_scan": [
    {
      "id": 2,
      "patient_id": 1,
      "file_path": "storage/patients/patient_1/ct_scans/20240110_ct_f5g6h7i8.dcm",
      "file_type": "ct_scan",
      "medical_category": "diagnostic",
      "study_date": "2024-01-10",
      "body_part": "upper_jaw",
      "file_size": 52428800,
      "mime_type": "application/dicom"
    }
  ]
}
```

## Преимущества новой системы

### 1. Производительность
- **Быстрые запросы**: SQLite отлично подходит для метаданных
- **Эффективное хранение**: Большие файлы не загружают БД
- **Индексация**: Быстрый поиск по пациентам и типам

### 2. Масштабируемость
- **Разделение данных**: Метаданные отделены от содержимого
- **Горизонтальное масштабирование**: Можно перенести файлы на отдельный сервер
- **Поддержка больших файлов**: КТ, МРТ, 3D модели

### 3. Безопасность и целостность
- **SHA256 хеши**: Контроль целостности файлов
- **Версионирование**: История изменений с возможностью отката
- **Аудит**: Отслеживание кто и когда создал версию

### 4. Медицинская специфика
- **Поддержка форматов**: DICOM, STL, медицинские изображения
- **Категоризация**: clinical, diagnostic, treatment, surgical
- **Метаданные**: Даты исследований, области тела

### 5. Управляемость
- **Автоматическая организация**: Файлы структурируются сами
- **Очистка**: Автоматическая очистка временных файлов
- **Мониторинг**: Статистика использования хранилища

## Безопасность

### Контроль доступа
- Все endpoints требуют аутентификации (JWT токен)
- Только администраторы могут удалять файлы
- Пользователи видят только свои файлы (можно расширить)

### Резервное копирование
- Регулярное создание резервных копий БД
- Копирование всей папки storage/
- Проверка целостности через SHA256 хеши

### Рекомендации
- Настройте регулярное резервное копирование
- Мониторьте использование дискового пространства
- Ограничьте размер загружаемых файлов
- Регулярно очищайте временные файлы

## Миграция

### Автоматическая миграция
Скрипты `migrate_schema.py` и `migrate_files.py` автоматически:
1. Создают резервную копию
2. Обновляют схему БД
3. Перемещают файлы в новую структуру
4. Проверяют целостность данных

### Ручная проверка после миграции
```python
from app.services.file_storage_service import FileStorageService

storage = FileStorageService()

# Проверка структуры пациента
info = storage.get_patient_storage_info(patient_id=1)
print(f"Файлов: {info['file_count']}, Размер: {info['total_size_mb']} MB")

# Проверка конкретных файлов
from app.crud.crud_file import file
files = file.get_patient_files(db=db, patient_id=1)
for f in files:
    print(f"Файл: {f.file_path}, Тип: {f.file_type.value}")
```

## Устранение неполадок

### Частые проблемы

#### "File not found on disk"
- Файл был удален с диска, но остался в БД
- Запустите скрипт очистки: `python migrate_files.py --cleanup`

#### "Invalid file type"
- Используйте только поддерживаемые типы из MedicalFileType
- Проверьте список: `/api/v1/files/types` (если добавить такой endpoint)

#### "Permission denied"
- Проверьте права доступа к папке storage/
- Убедитесь что пользователь может читать/писать файлы

#### "Database locked"
- Закройте все соединения с БД
- Перезапустите сервер приложений

### Логи
Включите подробное логирование:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Диагностика
```bash
# Проверка структуры хранилища
ls -la storage/patients/

# Проверка размеров
du -sh storage/patients/*

# Проверка базы данных
sqlite3 patients.db ".schema files"
```

## Заключение

Новая система управления файлами обеспечивает:

✅ **Организованность**: Автоматическая структура по пациентам и типам  
✅ **Версионирование**: Полная история изменений  
✅ **Производительность**: Быстрая работа с метаданными  
✅ **Масштабируемость**: Поддержка больших медицинских файлов  
✅ **Безопасность**: Контроль целостности и аудит  
✅ **Медицинскую специфику**: Поддержка DICOM, STL и других форматов  

Система готова к продуктивному использованию и может быть легко расширена под новые требования.