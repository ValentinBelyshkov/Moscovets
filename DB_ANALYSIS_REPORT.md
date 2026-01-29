# Анализ структуры базы данных
## OrthoCRM - Система ортодонтической диагностики и лечения

Дата анализа: 2025-01-29

---

## 1. Обзор текущей структуры БД

### Основные таблицы моделей:

#### Пациенты и пользователи
- **patients** - базовая информация о пациентах
- **users** - пользователи системы
- **doctors** - врачи (только в medical_crm_models.py, не используется)

#### Файлы и документы
- **files** - файлы пациентов (фото, рентген, документы)
- **file_versions** - версионирование файлов
- **documents** - сгенерированные документы (презентации, медкарты)

#### Медицинские записи
- **medical_records** - медицинские записи (cephalometry, ct)
- **medical_record_history** - история изменений мед. записей

#### 3D моделирование
- **three_d_models** - 3D модели для моделирования
- **modeling_sessions** - сессии моделирования

#### Биометрия
- **biometry_models** - 3D модели для биометрии
- **biometry_sessions** - сессии биометрии

#### Дополнительные таблицы (только в medical_crm_models.py, НЕ ИСПОЛЬЗУЮТСЯ)
- **visits** - визиты пациентов
- **diagnoses** - диагнозы
- **treatment_plans** - планы лечения
- **treatment_procedures** - процедуры лечения
- **measurements** - измерения
- **test_results** - результаты анализов
- **analysis_modules** - аналитические модули
- **analysis_module_history** - история изменений модулей
- **disease_history** - история болезней
- **prescriptions** - рецепты

---

## 2. Обнаруженные проблемы

### 2.1 Дублирование модели Patient (КРИТИЧНО)

**Проблема:** Есть два определения модели Patient с одинаковым `__tablename__ = "patients"`

**Локация 1:** `/backend/app/models/patient.py` (используется)
```python
class Patient(Base):
    __tablename__ = "patients"
    id: int = Column(Integer, primary_key=True, index=True)
    full_name: str = Column(String, nullable=False)
    birth_date: Date = Column(Date, nullable=False)
    gender: Gender = Column(Enum(Gender, name="gender"), nullable=False)
    contact_info: str = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
```

**Локация 2:** `/backend/app/models/medical_crm_models.py` (НЕ используется)
```python
class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    birth_date = Column(Date, nullable=False)
    gender = Column(String, nullable=False)
    contact_info = Column(Text, nullable=True)
    medical_card_number = Column(String, unique=True, index=True, nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact = Column(Text, nullable=True)
    insurance_info = Column(Text, nullable=True)
```

**Влияние:** SQLAlchemy будет использовать первое определение из patient.py, но это создает путаницу и потенциальные ошибки.

**Рекомендация:** Оставить только модель в patient.py, добавить недостающие поля (medical_card_number, address, emergency_contact, insurance_info) при необходимости.

---

### 2.2 Дублирование моделей 3D и биометрия (КРИТИЧНО)

**Проблема:** Тройное дублирование моделей

**ThreeDModel:**
1. `/backend/app/models/base_3d_model.py` - абстрактный базовый класс `BaseModel3D`
2. `/backend/app/models/modeling.py` - наследуемый класс `ThreeDModel(BaseModel3D)`
3. `/backend/app/models/medical_crm_models.py` - дублирующий класс `ThreeDModel(Base)` (строки 418-448)

**BiometryModel:**
1. `/backend/app/models/base_3d_model.py` - абстрактный базовый класс `BaseModel3D`
2. `/backend/app/models/biometry.py` - наследуемый класс `BiometryModel(BaseModel3D)`
3. `/backend/app/models/medical_crm_models.py` - дублирующий класс `BiometryModel(Base)` (строки 451-485)

**Влияние:** Конфликт имен и путаница при импорте.

**Рекомендация:** Удалить дубликаты из medical_crm_models.py, использовать только модели из modeling.py и biometry.py.

---

### 2.3 Медицинские записи - дублирование функционала (СРЕДНЯЯ)

**Проблема:** Два подхода к хранению медицинских данных

**Подход 1:** `MedicalRecord` в `/backend/app/models/medical_record.py`
```python
class MedicalRecordType(PyEnum):
    CEPHALOMETRY = "cephalometry"
    CT = "ct"

class MedicalRecord(Base):
    __tablename__ = "medical_records"
    patient_id: int = Column(Integer, ForeignKey("patients.id"), nullable=False)
    record_type: MedicalRecordType = Column(Enum(MedicalRecordType, name="medical_record_type"), nullable=False)
    data: str = Column(Text, nullable=True)  # JSON данные
    notes: str = Column(Text, nullable=True)
```

**Подход 2:** `AnalysisModule` в `/backend/app/models/medical_crm_models.py` (НЕ используется)
```python
class AnalysisModule(Base):
    __tablename__ = "analysis_modules"
    patient_id: int = Column(Integer, ForeignKey("patients.id"), nullable=False)
    module_type = Column(String, nullable=False)  # cephalometry, ct, biometry, photometry, modeling, other
    module_data = Column(JSON, nullable=False)  # JSON данные модуля
    status = Column(String, default="pending")
```

**Влияние:** `AnalysisModule` не используется, создает путаницу.

**Рекомендация:** Использовать только `MedicalRecord`, расширить `MedicalRecordType` для поддержки всех модулей.

---

### 2.4 Отсутствие специализированных таблиц для модулей (СРЕДНЯЯ)

**Проблема:** Нет отдельных таблиц для хранения результатов анализов

**Текущая ситуация:**
- Фотометрия (photometry): данные хранятся в `files` (фото) + `MedicalRecord` (JSON)
- Цефалометрия (cephalometry): данные хранятся в `files` (рентгены) + `MedicalRecord` (JSON)
- КТ (ct): данные хранятся в `files` (DICOM) + `MedicalRecord` (JSON)
- 3D модели (modeling): `three_d_models` + `modeling_sessions`
- Биометрия (biometry): `biometry_models` + `biometry_sessions`

**Фронтенд ожидает (из PatientCardRefactored.js):**
```javascript
const MODULE_TABS = [
  { id: 'overview', label: 'Медицинская карта', icon: '📋' },
  { id: 'photometry', label: 'Фотометрия', icon: '📷' },
  { id: 'cephalometry', label: 'Цефалометрия', icon: '🦴' },
  { id: 'biometry', label: 'Биометрия', icon: '📐' },
  { id: 'modeling', label: '3D Модели', icon: '🖥️' },
  { id: 'ct', label: 'КТ', icon: '🩻' },
  { id: 'history', label: 'История', icon: '📝' }
];
```

**Рекомендация:** Рассмотреть создание специализированных таблиц для каждого модуля:
- `photometry_analyses` - результаты фотометрического анализа
- `cephalometry_analyses` - результаты цефалометрического анализа
- `ct_analyses` - результаты КТ анализа

ИЛИ использовать универсальный подход с `MedicalRecord` + расширить структуру JSON.

---

### 2.5 Несоответствие полей Patient (МИНОРНАЯ)

**Проблема:** Фронтенд использует поле, которого нет в модели Patient

**Бэкенд модель (patient.py):**
```python
class Patient(Base):
    __tablename__ = "patients"
    id: int = Column(Integer, primary_key=True, index=True)
    full_name: str = Column(String, nullable=False)
    birth_date: Date = Column(Date, nullable=False)
    gender: Gender = Column(Enum(Gender, name="gender"), nullable=False)
    contact_info: str = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
```

**Фронтенд (PatientCardRefactored.js, строка 586):**
```javascript
<p className="text-gray-700">{patient?.complaints || 'Неровные зубы, неправильный прикус, эстетический дефект'}</p>
```

**Отсутствующее поле:** `complaints` - жалобы пациента

**Рекомендация:** Добавить поле `complaints` в модель Patient:
```python
complaints: str = Column(Text, nullable=True)  # Жалобы пациента
```

---

### 2.6 Лишние поля в File (МИНОРНАЯ)

**Проблема:** В модели File есть медицинские поля, которые могут быть избыточны

**File модель:**
```python
medical_category: str = Column(String(50), nullable=True)  # clinical, diagnostic, treatment, surgical
study_date: Date = Column(Date, nullable=True)  # Дата исследования/съемки
body_part: str = Column(String(100), nullable=True)  # Область тела (зубы, челюсть, и т.д.)
image_orientation: str = Column(String(50), nullable=True)  # orientation для медицинских изображений
```

**Анализ:** Эти поля специфичны для медицинских изображений, но File используется для всех типов файлов.

**Рекомендация:** Оставить поля, они полезны для фильтрации медицинских изображений.

---

### 2.7 Неиспользуемые таблицы (КРИТИЧНО для чистоты кода)

**Проблема:** `medical_crm_models.py` содержит много таблиц, которые не используются

**Неиспользуемые таблицы:**
- `doctors` - врачи
- `visits` - визиты пациентов
- `diagnoses` - диагнозы
- `treatment_plans` - планы лечения
- `treatment_procedures` - процедуры лечения
- `measurements` - измерения
- `test_results` - результаты анализов
- `analysis_modules` - аналитические модули
- `analysis_module_history` - история изменений модулей
- `disease_history` - история болезней
- `prescriptions` - рецепты
- `Doctor` - дублирует User
- `Patient` - дублирует Patient из patient.py
- `ThreeDModel` - дублирует ThreeDModel из modeling.py
- `BiometryModel` - дублирует BiometryModel из biometry.py
- `BiometrySession` - дублирует BiometrySession из biometry.py

**Рекомендация:** Полностью удалить файл `medical_crm_models.py` или переименовать его в `legacy_models.py` и добавить комментарий, что это старый код.

---

## 3. Соответствие фронтенду и бэкенду

### 3.1 Модуль Фотометрия (Photometry)

**Фронтенд ожидает:**
- Фотографии: frontal (анфас), profile (профиль), profile45 (профиль 45°), intraoral (интраоральные)
- Измерения: позиции губ, подбородка, пропорции лица
- Анализ: профильное фото, фронтальное фото

**Бэкенд:**
- Хранит фотографии в таблице `files` с `file_type = MedicalFileType.PHOTO`
- Результаты анализа хранятся в `MedicalRecord` с `record_type = "cephalometry"` (??)
- НЕТ отдельной таблицы для фотометрических анализов

**Проблема:**
- Нет таблицы `photometry_analyses` для хранения результатов
- Фотометрия и цефалометрия смешаны в типах медицинских записей

**Рекомендация:**
1. Создать таблицу `photometry_analyses`
2. Добавить `PHOTOMETRY` в `MedicalRecordType`
3. Хранить результаты фотометрического анализа в специализированной таблице

---

### 3.2 Модуль Цефалометрия (Cephalometry)

**Фронтенд ожидает:**
- Рентгеновские снимки: lateral (боковая), frontal (прямая)
- Точки цефалометрического анализа
- Измерения: SNA, SNB, ANB и др.
- Углы и расстояния

**Бэкенд:**
- Хранит снимки в таблице `files` с `file_type = MedicalFileType.XRAY`
- Результаты анализа хранятся в `MedicalRecord` с `record_type = "cephalometry"`
- Нет отдельной таблицы для точек и измерений

**Рекомендация:**
1. Создать таблицу `cephalometry_analyses`
2. Создать таблицу `cephalometry_points` для хранения точек
3. Хранить результаты в специализированных таблицах вместо JSON

---

### 3.3 Модуль КТ (CT Scan)

**Фронтенд ожидает:**
- DICOM файлы (ZIP архивы)
- Измерения: ВНЧС, срезы зубов, Pen-анализ, базальные измерения, воздухоносные пути
- Плоскости: sagittal, coronal, axial

**Бэкенд:**
- Хранит файлы в таблице `files` с `file_type = MedicalFileType.CT_SCAN` или `DICOM`
- Результаты анализа хранятся в `MedicalRecord` с `record_type = "ct"`
- Нет отдельной таблицы для КТ анализов

**Рекомендация:**
1. Создать таблицу `ct_analyses`
2. Создать таблицы для специфических измерений (tmj_measurements, tooth_measurements и т.д.)
3. Хранить результаты в специализированных таблицах

---

### 3.4 Модуль 3D Моделирование (Modeling)

**Фронтенд ожидает:**
- 3D модели: upper_jaw, lower_jaw, bite_1, bite_2, occlusion_pad
- Параметры моделирования: cement_gap, insertion_path, border_thickness, smoothing_strength
- Сессии моделирования

**Бэкенд:**
- `three_d_models` - хранит 3D модели ✓
- `modeling_sessions` - хранит сессии моделирования ✓
- Параметры моделирования в `modeling_sessions` ✓
- Связь между сессиями и моделями ✓

**Статус:** ✓ ПОЛНОСТЬЮ СООТВЕТСТВУЕТ

---

### 3.5 Модуль Биометрия (Biometry)

**Фронтенд ожидает:**
- 3D модели для биометрии
- Точки биометрии (model_points, map_points)
- Пары точек (pairs)
- Сессии биометрии
- Калибровка и матрица преобразования

**Бэкенд:**
- `biometry_models` - хранит 3D модели ✓
- `biometry_sessions` - хранит сессии ✓
- `calibration_points` - точки калибровки в JSON ✓
- `transformation_matrix` - матрица преобразования в JSON ✓
- API endpoints для model_points, map_points, pairs ✓

**Статус:** ✓ ПОЛНОСТЬЮ СООТВЕТСТВУЕТ

---

### 3.6 Медицинская карта (Medical Card)

**Фронтенд ожидает:**
- Персональные данные: ФИО, дата рождения, пол, контакт
- Анамнез
- Фотоанализ: профильное фото, фронтальное фото
- Интраоральный анализ: окклюзия, зубная формула
- Антропометрия: размеры челюстей, индексы
- Цефалометрия: ТРГ анализ
- 3D моделирование: модели и симуляции
- КТ анализ: findings и измерения
- Диагнозы
- План лечения
- Заключения

**Бэкенд:**
- `Patient` - персональные данные ✓
- `MedicalRecord` - медицинские записи с JSON ✓
- `files` - файлы и фотографии ✓
- НЕТ отдельных таблиц для анамнеза, диагнозов, плана лечения

**Рекомендация:**
1. Добавить поле `complaints` в `Patient`
2. Создать таблицы:
   - `anamnesis` - анамнез пациента
   - `diagnoses` - диагнозы пациента
   - `treatment_plans` - планы лечения
3. Использовать `MedicalRecord` для хранения результатов анализов

---

## 4. Рекомендации по оптимизации

### 4.1 Устранение дублирования (Приоритет: КРИТИЧЕСКИЙ)

1. **Удалить дубликаты из `medical_crm_models.py`:**
   - Patient (использовать только patient.py)
   - ThreeDModel (использовать только modeling.py)
   - BiometryModel (использовать только biometry.py)
   - BiometrySession (использовать только biometry.py)

2. **Оставить только работающие модели:**
   - Patient из `patient.py`
   - User из `user.py`
   - File, FileVersion из `file.py`
   - Document из `document.py`
   - MedicalRecord, MedicalRecordHistory из `medical_record.py`
   - ThreeDModel, ModelingSession из `modeling.py`
   - BiometryModel, BiometrySession из `biometry.py`

### 4.2 Расширение существующей модели (Приоритет: ВЫСОКИЙ)

1. **Добавить недостающие поля в Patient:**
   ```python
   complaints: str = Column(Text, nullable=True)  # Жалобы пациента
   medical_card_number: str = Column(String(50), unique=True, index=True, nullable=True)
   address: str = Column(Text, nullable=True)
   emergency_contact: str = Column(Text, nullable=True)
   insurance_info: str = Column(Text, nullable=True)
   ```

2. **Расширить MedicalRecordType:**
   ```python
   class MedicalRecordType(PyEnum):
       CEPHALOMETRY = "cephalometry"
       CT = "ct"
       PHOTOMETRY = "photometry"  # Добавить
       BIOMETRY = "biometry"      # Добавить
       MODELING = "modeling"      # Добавить
   ```

### 4.3 Создание специализированных таблиц (Приоритет: СРЕДНИЙ)

Вариант А - JSON-подход (проще, быстрее):
```python
# Использовать существующую структуру MedicalRecord
# Добавить все типы модулей в MedicalRecordType
# Хранить результаты анализа в JSON в поле data
```

Вариант Б - Нормализованный подход (лучше для сложных запросов):
```python
# Создать отдельные таблицы для каждого модуля
class PhotometryAnalysis(Base):
    __tablename__ = "photometry_analyses"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    analysis_date = Column(DateTime, nullable=False)
    frontal_photo_id = Column(Integer, ForeignKey("files.id"), nullable=True)
    profile_photo_id = Column(Integer, ForeignKey("files.id"), nullable=True)
    profile45_photo_id = Column(Integer, ForeignKey("files.id"), nullable=True)
    intraoral_photo_id = Column(Integer, ForeignKey("files.id"), nullable=True)
    upper_lip_position = Column(String(50), nullable=True)  # normal, protruding, retracted
    lower_lip_position = Column(String(50), nullable=True)
    chin_position = Column(String(50), nullable=True)
    measurements = Column(JSON, nullable=True)  # Дополнительные измерения
    created_at = Column(DateTime, server_default=func.now())

class CephalometryAnalysis(Base):
    __tablename__ = "cephalometry_analyses"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    analysis_date = Column(DateTime, nullable=False)
    lateral_xray_id = Column(Integer, ForeignKey("files.id"), nullable=True)
    frontal_xray_id = Column(Integer, ForeignKey("files.id"), nullable=True)
    points = Column(JSON, nullable=True)  # Цефалометрические точки
    measurements = Column(JSON, nullable=True)  # SNA, SNB, ANB и др.
    angles = Column(JSON, nullable=True)
    distances = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class CTAnalysis(Base):
    __tablename__ = "ct_analyses"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    scan_date = Column(Date, nullable=False)
    archive_id = Column(Integer, ForeignKey("files.id"), nullable=True)
    tmj_measurements = Column(JSON, nullable=True)
    tooth_measurements = Column(JSON, nullable=True)
    pen_analysis = Column(JSON, nullable=True)
    basal_width = Column(JSON, nullable=True)
    airway_measurements = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
```

### 4.4 Создание таблиц для медицинской карты (Приоритет: СРЕДНИЙ)

```python
class Anamnesis(Base):
    __tablename__ = "anamnesis"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    chief_complaint = Column(Text, nullable=True)  # Основная жалоба
    medical_history = Column(Text, nullable=True)  # Медицинская история
    family_history = Column(Text, nullable=True)  # Семейный анамнез
    allergies = Column(Text, nullable=True)  # Аллергии
    medications = Column(Text, nullable=True)  # Текущие лекарства
    surgical_history = Column(Text, nullable=True)  # Хирургические вмешательства
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Diagnosis(Base):
    __tablename__ = "diagnoses"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    diagnosis_code = Column(String(20), nullable=True)  # МКБ-10
    diagnosis_text = Column(Text, nullable=False)
    diagnosis_type = Column(String(50), nullable=True)  # preliminary, final, differential
    severity = Column(String(20), nullable=True)  # mild, moderate, severe
    is_chronic = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    diagnosed_date = Column(Date, nullable=False)
    resolved_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class TreatmentPlan(Base):
    __tablename__ = "treatment_plans"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    diagnosis_id = Column(Integer, ForeignKey("diagnoses.id"), nullable=True)
    plan_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=False)
    expected_end_date = Column(Date, nullable=True)
    actual_end_date = Column(Date, nullable=True)
    status = Column(String(50), default="active")  # active, completed, cancelled, suspended
    phases = Column(JSON, nullable=True)  # Фазы лечения
    objectives = Column(JSON, nullable=True)  # Цели лечения
    appliances = Column(JSON, nullable=True)  # Аппараты
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
```

---

## 5. Рекомендуемый план действий

### Этап 1: Критические исправления (НЕДЕЛЯ 1)

1. **Удалить дубликаты моделей:**
   - Удалить дубликаты Patient, ThreeDModel, BiometryModel, BiometrySession из `medical_crm_models.py`
   - Удалить или переименовать `medical_crm_models.py`

2. **Добавить недостающее поле в Patient:**
   - Добавить `complaints` поле в модель Patient
   - Создать миграцию для добавления поля в БД

3. **Расширить MedicalRecordType:**
   - Добавить PHOTOMETRY, BIOMETRY, MODELING в MedicalRecordType

### Этап 2: Специализация таблиц (НЕДЕЛЯ 2)

4. **Создать таблицы для анализов:**
   - Создать модели для PhotometryAnalysis
   - Создать модели для CephalometryAnalysis
   - Создать модели для CTAnalysis
   - Создать миграции для создания таблиц

5. **Создать таблицы для медицинской карты:**
   - Создать модель Anamnesis
   - Создать модель Diagnosis
   - Создать модель TreatmentPlan
   - Создать миграции для создания таблиц

### Этап 3: Миграция данных (НЕДЕЛЯ 3)

6. **Перенести данные из JSON в специализированные таблицы:**
   - Парсить JSON данные из MedicalRecord
   - Перенести данные в новые специализированные таблицы
   - Обновить API endpoints для работы с новыми таблицами

### Этап 4: Обновление фронтенда (НЕДЕЛЯ 4)

7. **Обновить фронтенд для работы с новой структурой:**
   - Обновить API сервисы для работы с новыми эндпоинтами
   - Обновить компоненты для отображения данных из новых таблиц
   - Протестировать интеграцию

---

## 6. Резюме

### Основные проблемы:

1. ❌ **Дублирование моделей** - критическая проблема, создающая конфликты
2. ❌ **Отсутствие поля `complaints` в Patient** - фронтенд использует его, но его нет в БД
3. ⚠️ **MedicalRecordType не содержит всех модулей** - нет фотометрии, биометрии, моделирования
4. ⚠️ **Нет специализированных таблиц для анализов** - данные хранятся в JSON, сложно делать запросы
5. ⚠️ **Нет таблиц для медицинской карты** - анамнез, диагнозы, план лечения

### Что соответствует фронтенду:
- ✅ Patient (нужно добавить complaints)
- ✅ File (со всеми медицинскими полями)
- ✅ ThreeDModel + ModelingSession
- ✅ BiometryModel + BiometrySession
- ✅ MedicalRecord (нужно расширить типы)

### Что НЕ соответствует фронтенду:
- ❌ Нет таблиц для фотометрического анализа
- ❌ Нет таблиц для цефалометрического анализа
- ❌ Нет таблиц для КТ анализа
- ❌ Нет таблиц для анамнеза, диагнозов, плана лечения

### Приоритеты:
1. 🔴 **КРИТИЧЕСКИЙ**: Устранить дублирование моделей
2. 🟠 **ВЫСОКИЙ**: Добавить поле complaints, расширить MedicalRecordType
3. 🟡 **СРЕДНИЙ**: Создать специализированные таблицы для анализов
4. 🟢 **НИЗКИЙ**: Создать таблицы для полной медицинской карты

---

## 7. Пример оптимальной структуры БД

```
patients
├── id, full_name, birth_date, gender, contact_info
├── complaints, medical_card_number, address, emergency_contact, insurance_info
└── created_at, updated_at

users
├── id, username, email, hashed_password, is_active
└── created_at, updated_at

files
├── id, patient_id, name, file_path, file_type
├── medical_category, study_date, body_part, image_orientation
├── file_size, mime_type, file_hash
└── created_at, updated_at, is_active

file_versions
├── id, file_id, version_number, file_path
├── file_hash, file_size, version_type, version_description
├── created_at, created_by
└── (связь с files и users)

medical_records
├── id, patient_id, record_type (cephalometry, ct, photometry, biometry, modeling)
├── data (JSON), notes
└── created_at, updated_at

medical_record_history
├── id, medical_record_id, data, notes, updated_by
└── created_at

photometry_analyses (НОВАЯ)
├── id, patient_id, analysis_date
├── frontal_photo_id, profile_photo_id, profile45_photo_id, intraoral_photo_id
├── upper_lip_position, lower_lip_position, chin_position
├── measurements (JSON)
└── created_at

cephalometry_analyses (НОВАЯ)
├── id, patient_id, analysis_date
├── lateral_xray_id, frontal_xray_id
├── points (JSON), measurements (JSON), angles (JSON), distances (JSON)
└── created_at

ct_analyses (НОВАЯ)
├── id, patient_id, scan_date, archive_id
├── tmj_measurements (JSON), tooth_measurements (JSON)
├── pen_analysis (JSON), basal_width (JSON), airway_measurements (JSON)
└── created_at

three_d_models
├── id, patient_id, model_type, model_format, file_path
├── original_filename, file_size, scale, position_x, position_y, position_z
├── rotation_x, rotation_y, rotation_z
├── vertices_count, faces_count, bounding_box (JSON)
└── created_at, updated_at, is_active

modeling_sessions
├── id, patient_id
├── upper_jaw_id, lower_jaw_id, bite1_id, bite2_id, occlusion_pad_id
├── cement_gap, insertion_path, border_thickness, smoothing_strength, auto_adaptation
├── status, modeling_parameters (JSON)
└── created_at, updated_at, is_active

biometry_models
├── id, patient_id, model_type, model_format, file_path
├── original_filename, file_size, scale, position_x, position_y, position_z
├── rotation_x, rotation_y, rotation_z
├── vertices_count, faces_count, bounding_box (JSON)
├── status (uploaded, analyzed, calibrated, exported)
└── created_at, updated_at, is_active

biometry_sessions
├── id, patient_id, model_id
├── calibration_points (JSON), transformation_matrix (JSON)
├── status
└── created_at, updated_at, is_active

anamnesis (НОВАЯ)
├── id, patient_id
├── chief_complaint, medical_history, family_history
├── allergies, medications, surgical_history
└── created_at, updated_at

diagnoses (НОВАЯ)
├── id, patient_id, diagnosis_code, diagnosis_text
├── diagnosis_type, severity, is_chronic, is_active
├── diagnosed_date, resolved_date, notes
└── created_at, updated_at

treatment_plans (НОВАЯ)
├── id, patient_id, diagnosis_id, plan_name, description
├── start_date, expected_end_date, actual_end_date, status
├── phases (JSON), objectives (JSON), appliances (JSON), notes
└── created_at, updated_at

documents
├── id, patient_id, document_type, file_path, format
├── generated_at, metadata_json (JSON)
└── (связь с patients)
```

---

**Конец анализа**
