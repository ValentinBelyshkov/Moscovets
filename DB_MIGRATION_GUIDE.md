# РУКОВОДСТВО ПО МИГРАЦИИ БАЗЫ ДАННЫХ

## Обзор изменений

Данное руководство описывает процесс обновления структуры базы данных в соответствии с требованиями из документов:
- `DB_ANALYSIS_REPORT.md`
- `DB_ANALYSIS_SUMMARY.md`
- `DB_MAPPING_TABLE.md`

## Что было сделано

### 1. Устранение дубликатов
- ✅ Файл `medical_crm_models.py` переименован в `medical_crm_models_LEGACY_NOT_USED.py.bak`
- ✅ Создан `README_LEGACY_MODELS.md` с объяснением

### 2. Расширение модели Patient
Добавлены поля:
- `complaints` (TEXT) - жалобы пациента
- `medical_card_number` (VARCHAR(50), UNIQUE) - номер медицинской карты
- `address` (TEXT) - адрес пациента
- `emergency_contact` (TEXT) - контакт для экстренных случаев
- `insurance_info` (TEXT) - информация о страховке

### 3. Расширение MedicalRecordType
Добавлены типы:
- `PHOTOMETRY` - фотометрический анализ
- `BIOMETRY` - биометрический анализ
- `MODELING` - 3D моделирование
- `ANAMNESIS` - анамнез пациента

### 4. Новые таблицы для анализов
- `photometry_analyses` - фотометрический анализ
- `cephalometry_analyses` - цефалометрический анализ
- `ct_analyses` - КТ анализ

### 5. Новые таблицы для медицинской карты
- `anamnesis` - анамнез пациента
- `diagnoses` - диагнозы
- `treatment_plans` - планы лечения

## Варианты миграции

### Вариант 1: Полное пересоздание БД (рекомендуется для разработки)

**Когда использовать:**
- Локальная разработка
- Тестовая среда
- Нет важных данных в БД

**Команды:**
```bash
cd backend
python recreate_db.py
```

**Что происходит:**
1. Удаляются все таблицы
2. Создаются новые таблицы со всеми изменениями
3. Создается admin пользователь (admin/admin123)

**Плюсы:**
- ✅ Простота
- ✅ Гарантированная чистота структуры
- ✅ Нет проблем с миграциями

**Минусы:**
- ❌ Все данные будут потеряны

---

### Вариант 2: Миграция существующей БД (для продакшена)

**Когда использовать:**
- Продакшен среда
- В БД есть важные данные
- Нужно сохранить существующие записи

**Команды:**
```bash
cd backend
python migrate_db_add_new_tables.py
```

**Что происходит:**
1. Добавляются новые поля в `patients`
2. Обновляется enum `MedicalRecordType` (для PostgreSQL)
3. Создаются новые таблицы
4. Существующие данные сохраняются

**Плюсы:**
- ✅ Данные сохраняются
- ✅ Безопасная миграция

**Минусы:**
- ⚠️ Требует больше внимания
- ⚠️ Может потребоваться ручная корректировка для сложных случаев

---

## Пошаговая инструкция

### Шаг 1: Проверка структуры

Проверьте что все модели корректно определены:

```bash
cd backend
python verify_db_structure.py
```

Вы должны увидеть:
```
✅ Все модели успешно импортированы
✅ Все обязательные поля присутствуют
✅ Все обязательные типы присутствуют
✅ Все relationships присутствуют
```

Если есть ошибки - исправьте их перед продолжением.

---

### Шаг 2: Резервное копирование (для варианта 2)

**Только для продакшена!** Создайте бэкап базы данных:

#### PostgreSQL:
```bash
pg_dump -U postgres -d orthocrm > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### SQLite:
```bash
cp backend/app/ortho_crm.db backend/app/ortho_crm.db.backup_$(date +%Y%m%d_%H%M%S)
```

---

### Шаг 3: Миграция

#### Вариант 1 (Разработка):
```bash
cd backend
python recreate_db.py
```

#### Вариант 2 (Продакшен):
```bash
cd backend
python migrate_db_add_new_tables.py
# Введите 'yes' для подтверждения
```

---

### Шаг 4: Проверка результата

Запустите backend и проверьте что все работает:

```bash
cd backend
python main.py
```

Проверьте в логах:
- ✅ Backend запустился без ошибок
- ✅ Все таблицы созданы
- ✅ API endpoints доступны

---

### Шаг 5: Тестирование API

Протестируйте базовые операции:

```bash
# Получить список пациентов
curl http://localhost:8000/api/v1/patients/

# Создать пациента с новыми полями
curl -X POST http://localhost:8000/api/v1/patients/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "full_name": "Тестовый Пациент",
    "birth_date": "1990-01-01",
    "gender": "male",
    "contact_info": "+7 (999) 123-45-67",
    "complaints": "Неровные зубы",
    "medical_card_number": "MC-2025-001",
    "address": "г. Москва, ул. Тестовая, д. 1",
    "emergency_contact": "+7 (999) 987-65-43",
    "insurance_info": "Полис ОМС №1234567890"
  }'
```

---

## Возможные проблемы и решения

### Проблема 1: Ошибка импорта моделей

**Симптомы:**
```
ModuleNotFoundError: No module named 'app.models.photometry'
```

**Решение:**
Убедитесь что все новые файлы созданы:
- `/backend/app/models/photometry.py`
- `/backend/app/models/cephalometry.py`
- `/backend/app/models/ct_analysis.py`
- `/backend/app/models/anamnesis.py`
- `/backend/app/models/diagnosis.py`
- `/backend/app/models/treatment_plan.py`

---

### Проблема 2: Конфликт enum типов (PostgreSQL)

**Симптомы:**
```
ERROR: type "medical_record_type" already exists
```

**Решение:**
PostgreSQL требует специальной обработки enum. Используйте миграционный скрипт:
```bash
python migrate_db_add_new_tables.py
```

---

### Проблема 3: Дубликаты таблиц

**Симптомы:**
```
sqlalchemy.exc.InvalidRequestError: Table 'patients' is already defined
```

**Решение:**
Убедитесь что файл `medical_crm_models.py` переименован:
```bash
ls -la backend/app/models/ | grep medical_crm
# Должен быть только: medical_crm_models_LEGACY_NOT_USED.py.bak
```

---

### Проблема 4: Ошибки relationships

**Симптомы:**
```
sqlalchemy.exc.ArgumentError: Mapper mapped class... could not assemble any primary key columns
```

**Решение:**
Проверьте порядок импортов в новых моделях. Relationship к Patient должен быть в конце файла:
```python
from app.models.patient import Patient
Patient.photometry_analyses = relationship(...)
```

---

## Проверочный чеклист

После миграции проверьте:

- [ ] ✅ Backend запускается без ошибок
- [ ] ✅ Таблица `patients` имеет все новые поля
- [ ] ✅ Таблицы `photometry_analyses`, `cephalometry_analyses`, `ct_analyses` созданы
- [ ] ✅ Таблицы `anamnesis`, `diagnoses`, `treatment_plans` созданы
- [ ] ✅ Enum `MedicalRecordType` содержит все типы
- [ ] ✅ API endpoint `/api/v1/patients/` возвращает новые поля
- [ ] ✅ Можно создать пациента с новыми полями
- [ ] ✅ Файл `medical_crm_models.py` переименован или удален

---

## Следующие шаги

После успешной миграции:

1. **Создать API endpoints** для новых таблиц:
   - `/api/v1/photometry/`
   - `/api/v1/cephalometry/`
   - `/api/v1/ct-analysis/`
   - `/api/v1/anamnesis/`
   - `/api/v1/diagnoses/`
   - `/api/v1/treatment-plans/`

2. **Создать Pydantic схемы** в `/backend/app/schemas/`:
   - `photometry.py`
   - `cephalometry.py`
   - `ct_analysis.py`
   - `anamnesis.py`
   - `diagnosis.py`
   - `treatment_plan.py`

3. **Создать CRUD операции** в `/backend/app/crud/`:
   - `crud_photometry.py`
   - `crud_cephalometry.py`
   - `crud_ct_analysis.py`
   - `crud_anamnesis.py`
   - `crud_diagnosis.py`
   - `crud_treatment_plan.py`

4. **Обновить фронтенд** для работы с новыми endpoints:
   - Создать сервисы в `/frontend/src/services/`
   - Обновить компоненты для отображения данных

---

## Откат изменений

Если что-то пошло не так и нужно откатить изменения:

### Вариант 1 (Разработка):
```bash
# Просто восстановите из git
cd backend
git checkout app/models/
```

### Вариант 2 (Продакшен):
```bash
# Восстановите из бэкапа
# PostgreSQL:
psql -U postgres -d orthocrm < backup_YYYYMMDD_HHMMSS.sql

# SQLite:
cp backend/app/ortho_crm.db.backup_YYYYMMDD_HHMMSS backend/app/ortho_crm.db
```

---

## Поддержка

При возникновении проблем:

1. Проверьте логи backend
2. Проверьте структуру БД: `python verify_db_structure.py`
3. Проверьте документацию: `DB_STRUCTURE_UPDATED.md`
4. Обратитесь к разработчикам

---

**Дата создания:** 2025-01-29
**Версия:** 1.0
