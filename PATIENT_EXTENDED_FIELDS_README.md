# Расширенные поля пациента

## Обзор

В проект добавлены расширенные поля для хранения детальной информации о пациентах:
- **Место регистрации** (адрес с подробной детализацией)
- **Социально-демографические данные** (местность, семейное положение, образование)
- **Кефалометрия** (осмотр лица - анфас и профиль)

## Что было добавлено

### Backend (Python/FastAPI)

1. **Модель базы данных** (`backend/app/models/patient.py`)
   - Добавлено 6 новых enum типов:
     - `LocalityType` - городская/сельская местность
     - `MaritalStatus` - семейное положение (4 варианта)
     - `EducationLevel` - уровень образования (6 вариантов)
     - `ProfileType` - тип профиля лица
     - `LipPosition` - положение верхней губы
     - `ChinShift` - смещение подбородка
   - Добавлено 26 новых полей в таблицу `patients`

2. **Pydantic схемы** (`backend/app/schemas/patient.py`)
   - Обновлены схемы `PatientBase`, `PatientCreate`, `PatientUpdate`, `Patient`
   - Все новые поля включены в API

3. **Миграции базы данных**
   - `backend/migrations/add_patient_extended_fields.sql` - миграция для PostgreSQL
   - `backend/migrations/rollback_patient_extended_fields.sql` - откат миграции
   - Автоматическое создание через SQLAlchemy для SQLite

4. **Тестовый скрипт**
   - `backend/test_patient_api.py` - тестирование всех новых полей

### Frontend (React)

1. **Константы enum** (`frontend/src/constants/patientEnums.js`)
   - Все enum значения с русскими labels
   - Утилиты для работы с select-полями
   - Функции преобразования значений в текст

### Документация

1. **Backend документация** (`backend/PATIENT_FIELDS_DOCUMENTATION.md`)
   - Подробное описание всех полей
   - Примеры API запросов
   - Типы данных и валидация

2. **Этот README** - инструкции для разработчиков

## Использование

### Backend

#### Создание пациента со всеми полями

```python
from app.crud.crud_patient import patient as patient_crud
from app.schemas.patient import PatientCreate
from app.models.patient import Gender, LocalityType, MaritalStatus, EducationLevel, ProfileType, LipPosition, ChinShift
from datetime import date

patient_data = PatientCreate(
    full_name="Иванов Иван Иванович",
    birth_date=date(1985, 5, 15),
    gender=Gender.MALE,
    contact_info="+7 (999) 123-45-67",
    
    # Место регистрации
    registration_city="Москва",
    registration_street="Ленина",
    registration_house="10",
    registration_apartment="5",
    
    # Социально-демографические данные
    locality_type=LocalityType.URBAN,
    marital_status=MaritalStatus.REGISTERED_MARRIAGE,
    education_level=EducationLevel.HIGHER,
    
    # Кефалометрия
    cephalometry_zy_zy=145.5,
    cephalometry_n_me=120.3,
    face_symmetric=True,
    profile_type=ProfileType.STRAIGHT
)

patient = patient_crud.create(db=db, obj_in=patient_data)
```

#### Обновление только некоторых полей

```python
from app.schemas.patient import PatientUpdate

update_data = PatientUpdate(
    cephalometry_zy_zy=146.0,
    profile_type=ProfileType.CONVEX
)

updated_patient = patient_crud.update(db=db, db_obj=patient, obj_in=update_data)
```

### Frontend

#### Использование enum констант в React

```javascript
import PatientEnums from '../constants/patientEnums';

// В компоненте формы
function PatientForm() {
  return (
    <select>
      {PatientEnums.getGenderOptions().map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// Отображение значения
function PatientDetails({ patient }) {
  return (
    <div>
      <p>Пол: {PatientEnums.getGenderLabel(patient.gender)}</p>
      <p>Образование: {PatientEnums.getEducationLevelLabel(patient.education_level)}</p>
      <p>Тип профиля: {PatientEnums.getProfileTypeLabel(patient.profile_type)}</p>
    </div>
  );
}
```

### API Endpoints

Все эндпоинты пациентов поддерживают новые поля:

- `GET /api/v1/patients/` - получить список пациентов
- `POST /api/v1/patients/` - создать пациента
- `GET /api/v1/patients/{id}` - получить пациента по ID
- `PUT /api/v1/patients/{id}` - обновить пациента
- `DELETE /api/v1/patients/{id}` - удалить пациента

#### Пример запроса создания пациента

```bash
curl -X POST "http://localhost:8000/api/v1/patients/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Иванов Иван Иванович",
    "birth_date": "1985-05-15",
    "gender": "male",
    "registration_city": "Москва",
    "locality_type": "urban",
    "marital_status": "registered_marriage",
    "education_level": "higher",
    "cephalometry_zy_zy": 145.5,
    "profile_type": "straight"
  }'
```

## База данных

### Пересоздание базы данных

Для локальной разработки с SQLite:

```bash
cd backend
source venv/bin/activate  # или activate.bat на Windows
python recreate_db.py
```

### Миграция PostgreSQL

Для production с PostgreSQL:

```bash
cd backend
psql -U your_user -d your_database -f migrations/add_patient_extended_fields.sql
```

### Откат миграции PostgreSQL

```bash
cd backend
psql -U your_user -d your_database -f migrations/rollback_patient_extended_fields.sql
```

## Тестирование

### Backend тесты

```bash
cd backend
source venv/bin/activate
python test_patient_api.py
```

Тестовый скрипт проверяет:
- ✅ Создание пациента со всеми полями
- ✅ Получение пациента из БД
- ✅ Обновление отдельных полей
- ✅ Все enum значения работают корректно

### Проверка схемы БД (SQLite)

```bash
cd backend
sqlite3 test.db ".schema patients"
```

## Структура полей

### 1. Основные поля (обязательные)
- `full_name` - ФИО
- `birth_date` - дата рождения
- `gender` - пол

### 2. Место регистрации (8 полей, все опциональные)
- republic, district, city, settlement
- street, house, apartment, phone

### 3. Социально-демографические данные (3 enum поля)
- `locality_type` - городская/сельская
- `marital_status` - семейное положение
- `education_level` - образование

### 4. Кефалометрия - лицо анфас (8 полей)
- 3 измерения (float): zy-zy, n-me, n-sn
- 4 boolean флага: symmetric, mental_fold, lips_closed, gummy_smile
- 1 enum: chin_shift

### 5. Кефалометрия - лицо в профиль (2 enum поля)
- `profile_type` - тип профиля
- `upper_lip_position` - положение верхней губы

## Важные замечания

1. **Все новые поля опциональные** - можно создать пациента только с базовыми полями
2. **Enum значения на английском** - в БД хранятся английские значения, в UI отображаются русские
3. **Даты в ISO формате** - все даты должны быть в формате `YYYY-MM-DD`
4. **Float для измерений** - кефалометрические измерения в миллиметрах с дробной частью
5. **Обратная совместимость** - старые данные продолжат работать, новые поля будут `null`

## Следующие шаги

1. Обновить формы создания/редактирования пациента на фронтенде
2. Добавить отображение новых полей в карточку пациента
3. Добавить фильтрацию и поиск по новым полям
4. Добавить экспорт данных с новыми полями
5. Создать компонент для визуализации кефалометрических данных

## Поддержка

Если у вас есть вопросы или проблемы:
1. Проверьте документацию в `backend/PATIENT_FIELDS_DOCUMENTATION.md`
2. Запустите тестовый скрипт: `python test_patient_api.py`
3. Проверьте схему БД: `sqlite3 test.db ".schema patients"`
