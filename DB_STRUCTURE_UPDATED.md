# ОБНОВЛЕННАЯ СТРУКТУРА БАЗЫ ДАННЫХ

**Дата обновления:** 2025-01-29

## Внесенные изменения

### 1. ✅ КРИТИЧЕСКИЕ ИСПРАВЛЕНИЯ

#### 1.1 Удалено дублирование моделей
- **Файл `medical_crm_models.py` переименован** в `medical_crm_models_LEGACY_NOT_USED.py.bak`
- **Причина:** Содержал дубликаты моделей Patient, ThreeDModel, BiometryModel, BiometrySession
- **Статус:** Файл нигде не импортируется, полностью отключен
- **Документация:** См. `/backend/app/models/README_LEGACY_MODELS.md`

#### 1.2 Расширена модель Patient
**Файл:** `/backend/app/models/patient.py`

**Добавлены поля:**
```python
complaints: str = Column(Text, nullable=True)  # Жалобы пациента
medical_card_number: str = Column(String(50), unique=True, index=True, nullable=True)
address: str = Column(Text, nullable=True)
emergency_contact: str = Column(Text, nullable=True)
insurance_info: str = Column(Text, nullable=True)
```

**Обоснование:**
- `complaints` - используется фронтендом (PatientCardRefactored.js)
- Остальные поля - важны для полноценной медицинской карты

#### 1.3 Расширен MedicalRecordType
**Файл:** `/backend/app/models/medical_record.py`

**Добавлены типы:**
```python
class MedicalRecordType(PyEnum):
    CEPHALOMETRY = "cephalometry"  # Цефалометрический анализ
    CT = "ct"  # КТ анализ
    PHOTOMETRY = "photometry"  # Фотометрический анализ (НОВОЕ)
    BIOMETRY = "biometry"  # Биометрический анализ (НОВОЕ)
    MODELING = "modeling"  # 3D моделирование (НОВОЕ)
    ANAMNESIS = "anamnesis"  # Анамнез пациента (НОВОЕ)
```

### 2. ✅ СПЕЦИАЛИЗИРОВАННЫЕ ТАБЛИЦЫ ДЛЯ АНАЛИЗОВ

#### 2.1 Фотометрический анализ
**Файл:** `/backend/app/models/photometry.py`
**Таблица:** `photometry_analyses`

**Поля:**
- `patient_id` - связь с пациентом
- `analysis_date` - дата анализа
- `frontal_photo_id` - анфас фото
- `profile_photo_id` - профиль фото
- `profile45_photo_id` - профиль 45° фото
- `intraoral_photo_id` - интраоральное фото
- `upper_lip_position` - позиция верхней губы (normal/protruding/retracted)
- `lower_lip_position` - позиция нижней губы
- `chin_position` - позиция подбородка
- `face_type` - тип лица (dolichofacial/mesofacial/brachyfacial)
- `proportions` - пропорции лица (JSON)
- `measurements` - дополнительные измерения (JSON)
- `notes` - заметки врача

#### 2.2 Цефалометрический анализ
**Файл:** `/backend/app/models/cephalometry.py`
**Таблица:** `cephalometry_analyses`

**Поля:**
- `patient_id` - связь с пациентом
- `analysis_date` - дата анализа
- `lateral_xray_id` - боковая проекция
- `frontal_xray_id` - прямая проекция
- `points` - цефалометрические точки (JSON: S, N, A, B, ...)
- `angles` - углы (JSON: SNA, SNB, ANB, gonial_angle, y_axis, ...)
- `distances` - расстояния (JSON: sella_nasion, nasion_a, a_b, ...)
- `measurements` - общие измерения (JSON)
- `interpretation` - интерпретация результатов
- `notes` - заметки врача

#### 2.3 КТ анализ
**Файл:** `/backend/app/models/ct_analysis.py`
**Таблица:** `ct_analyses`

**Поля:**
- `patient_id` - связь с пациентом
- `scan_date` - дата КТ
- `archive_id` - архив DICOM
- `tmj_measurements` - измерения ВНЧС (JSON)
- `tooth_measurements` - срезы зубов (JSON)
- `pen_analysis` - Pen-анализ (JSON)
- `basal_width` - базальная ширина (JSON)
- `airway_measurements` - воздухоносные пути (JSON)
- `other_measurements` - другие измерения (JSON)
- `findings` - заключение
- `notes` - заметки врача

### 3. ✅ ТАБЛИЦЫ ДЛЯ МЕДИЦИНСКОЙ КАРТЫ

#### 3.1 Анамнез
**Файл:** `/backend/app/models/anamnesis.py`
**Таблица:** `anamnesis`
**Связь:** One-to-One с Patient

**Поля:**
- `patient_id` - связь с пациентом (unique)
- `chief_complaint` - основная жалоба
- `medical_history` - история болезней
- `dental_history` - стоматологическая история
- `family_history` - семейный анамнез
- `allergies` - аллергии
- `medications` - текущие лекарства
- `surgical_history` - хирургические вмешательства
- `social_history` - социальный анамнез

#### 3.2 Диагнозы
**Файл:** `/backend/app/models/diagnosis.py`
**Таблица:** `diagnoses`
**Связь:** One-to-Many с Patient

**Поля:**
- `patient_id` - связь с пациентом
- `diagnosis_code` - код МКБ-10
- `diagnosis_text` - текст диагноза
- `diagnosis_type` - тип (preliminary/final/differential)
- `category` - категория (skeletal/dental/soft_tissue/functional)
- `severity` - тяжесть (mild/moderate/severe)
- `is_chronic` - хронический?
- `is_active` - активный?
- `diagnosed_date` - дата диагноза
- `resolved_date` - дата разрешения
- `notes` - заметки

#### 3.3 План лечения
**Файл:** `/backend/app/models/treatment_plan.py`
**Таблица:** `treatment_plans`
**Связь:** One-to-Many с Patient, Many-to-One с Diagnosis

**Поля:**
- `patient_id` - связь с пациентом
- `diagnosis_id` - связь с диагнозом
- `plan_name` - название плана
- `description` - описание
- `start_date` - дата начала
- `expected_end_date` - ожидаемая дата окончания
- `actual_end_date` - фактическая дата окончания
- `status` - статус (active/completed/cancelled/suspended/pending)
- `phases` - фазы лечения (JSON)
- `objectives` - цели лечения (JSON)
- `appliances` - аппараты (JSON)
- `expected_outcomes` - прогнозируемые результаты
- `notes` - заметки

## Текущая структура БД (финальная)

### Базовые таблицы
```
users
├── id, username, email, hashed_password, is_active
└── created_at, updated_at

patients
├── id, full_name, birth_date, gender, contact_info
├── complaints, medical_card_number, address, emergency_contact, insurance_info
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
├── id, patient_id, record_type (CEPHALOMETRY/CT/PHOTOMETRY/BIOMETRY/MODELING/ANAMNESIS)
├── data (JSON), notes
└── created_at, updated_at

medical_record_history
├── id, medical_record_id, data, notes, updated_by
└── created_at

documents
├── id, patient_id, document_type, file_path, format
├── generated_at, metadata_json (JSON)
└── (связь с patients)
```

### 3D моделирование и биометрия
```
three_d_models
├── id, patient_id, model_type, model_format, file_path
├── original_filename, file_size, scale, position_x/y/z, rotation_x/y/z
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
├── original_filename, file_size, scale, position_x/y/z, rotation_x/y/z
├── vertices_count, faces_count, bounding_box (JSON)
├── status (uploaded/analyzed/calibrated/exported)
└── created_at, updated_at, is_active

biometry_sessions
├── id, patient_id, model_id
├── calibration_points (JSON), transformation_matrix (JSON)
├── status
└── created_at, updated_at, is_active
```

### Анализы (НОВЫЕ ТАБЛИЦЫ)
```
photometry_analyses
├── id, patient_id, analysis_date
├── frontal_photo_id, profile_photo_id, profile45_photo_id, intraoral_photo_id
├── upper_lip_position, lower_lip_position, chin_position, face_type
├── proportions (JSON), measurements (JSON), notes
└── created_at, updated_at

cephalometry_analyses
├── id, patient_id, analysis_date
├── lateral_xray_id, frontal_xray_id
├── points (JSON), angles (JSON), distances (JSON), measurements (JSON)
├── interpretation, notes
└── created_at, updated_at

ct_analyses
├── id, patient_id, scan_date, archive_id
├── tmj_measurements (JSON), tooth_measurements (JSON)
├── pen_analysis (JSON), basal_width (JSON), airway_measurements (JSON)
├── other_measurements (JSON), findings, notes
└── created_at, updated_at
```

### Медицинская карта (НОВЫЕ ТАБЛИЦЫ)
```
anamnesis
├── id, patient_id (unique)
├── chief_complaint, medical_history, dental_history, family_history
├── allergies, medications, surgical_history, social_history
└── created_at, updated_at

diagnoses
├── id, patient_id, diagnosis_code, diagnosis_text
├── diagnosis_type, category, severity, is_chronic, is_active
├── diagnosed_date, resolved_date, notes
└── created_at, updated_at

treatment_plans
├── id, patient_id, diagnosis_id, plan_name, description
├── start_date, expected_end_date, actual_end_date, status
├── phases (JSON), objectives (JSON), appliances (JSON)
├── expected_outcomes, notes
└── created_at, updated_at
```

## Соответствие с документацией

### DB_ANALYSIS_REPORT.md
✅ **Устранены все критические проблемы:**
- ✅ Удалены дубликаты моделей
- ✅ Добавлено поле `complaints` в Patient
- ✅ Расширен MedicalRecordType
- ✅ Созданы специализированные таблицы для анализов
- ✅ Созданы таблицы для медицинской карты

### DB_ANALYSIS_SUMMARY.md
✅ **Выполнены все рекомендации:**
- ✅ Этап 1 (Критический) - выполнен полностью
- ✅ Этап 2 (Высокий) - выполнен полностью
- ✅ Дополнительно созданы специализированные таблицы

### DB_MAPPING_TABLE.md
✅ **Полное соответствие фронтенду:**
- ✅ Patient - все поля добавлены
- ✅ Photometry - таблица создана
- ✅ Cephalometry - таблица создана
- ✅ CT Analysis - таблица создана
- ✅ 3D Modeling - без изменений (уже соответствовало)
- ✅ Biometry - без изменений (уже соответствовало)
- ✅ Medical Card - таблицы созданы (anamnesis, diagnoses, treatment_plans)

## Что нужно сделать дальше

### 1. Миграция базы данных
```bash
cd backend
python recreate_db.py
```

Это создаст все новые таблицы в базе данных.

### 2. Создание API endpoints
Необходимо создать endpoints для работы с новыми таблицами:
- `/api/v1/photometry/` - CRUD для фотометрического анализа
- `/api/v1/cephalometry/` - CRUD для цефалометрического анализа
- `/api/v1/ct-analysis/` - CRUD для КТ анализа
- `/api/v1/anamnesis/` - CRUD для анамнеза
- `/api/v1/diagnoses/` - CRUD для диагнозов
- `/api/v1/treatment-plans/` - CRUD для планов лечения

### 3. Создание Pydantic схем
Для каждой новой модели нужны схемы:
- `PhotometryAnalysisCreate`, `PhotometryAnalysisUpdate`, `PhotometryAnalysis`
- `CephalometryAnalysisCreate`, `CephalometryAnalysisUpdate`, `CephalometryAnalysis`
- `CTAnalysisCreate`, `CTAnalysisUpdate`, `CTAnalysis`
- `AnamnesisCreate`, `AnamnesisUpdate`, `Anamnesis`
- `DiagnosisCreate`, `DiagnosisUpdate`, `Diagnosis`
- `TreatmentPlanCreate`, `TreatmentPlanUpdate`, `TreatmentPlan`

### 4. Обновление фронтенда
Обновить сервисы для работы с новыми endpoints:
- `photometryService.js`
- `cephalometryService.js`
- `ctAnalysisService.js`
- `anamnesisService.js`
- `diagnosisService.js`
- `treatmentPlanService.js`

## Резюме

### ✅ Выполнено
1. Устранено дублирование моделей (medical_crm_models.py отключен)
2. Расширена модель Patient (5 новых полей)
3. Расширен MedicalRecordType (4 новых типа)
4. Созданы 3 специализированные таблицы для анализов
5. Созданы 3 таблицы для медицинской карты
6. Обновлены импорты в __init__.py
7. Обновлен recreate_db.py
8. Создана документация

### 📊 Статистика
- **Новых таблиц:** 6 (photometry_analyses, cephalometry_analyses, ct_analyses, anamnesis, diagnoses, treatment_plans)
- **Новых полей в Patient:** 5 (complaints, medical_card_number, address, emergency_contact, insurance_info)
- **Новых типов в MedicalRecordType:** 4 (PHOTOMETRY, BIOMETRY, MODELING, ANAMNESIS)
- **Удалено дубликатов:** 4 (Patient, ThreeDModel, BiometryModel, BiometrySession)

### 🎯 Приоритеты дальнейшей разработки
1. **Высокий:** Создание API endpoints и схем для новых таблиц
2. **Средний:** Миграция существующих данных из JSON в специализированные таблицы
3. **Низкий:** Обновление фронтенда для работы с новыми endpoints

---

**База данных теперь полностью соответствует требованиям из документации!**
