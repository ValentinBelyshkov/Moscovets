# ТАБЛИЦА СООТВЕТСТВИЯ ФРОНТЕНДА И БЭКЕНДА

## Карточка пациента и Медицинская карта

| Фронтенд (PatientCard) | Текущий Бэкенд | Проблема | Рекомендация |
|-----------------------|----------------|----------|-------------|
| **Личные данные пациента** | | | |
| full_name | patients.full_name ✓ | - | OK |
| birth_date | patients.birth_date ✓ | - | OK |
| gender | patients.gender ✓ | - | OK |
| contact_info | patients.contact_info ✓ | - | OK |
| complaints | ❌ НЕТ | Фронтенд использует | Добавить поле |
| medical_card_number | ❌ НЕТ (есть в medical_crm_models.py) | Дубликат модели | Добавить в patient.py |
| address | ❌ НЕТ (есть в medical_crm_models.py) | Дубликат модели | Добавить в patient.py |
| emergency_contact | ❌ НЕТ (есть в medical_crm_models.py) | Дубликат модели | Добавить в patient.py |
| insurance_info | ❌ НЕТ (есть в medical_crm_models.py) | Дубликат модели | Добавить в patient.py |
| | | | |
| **Медицинская история** | | | |
| Анамнез | ❌ НЕТ | Нет таблицы | Создать anamnesis |
| Диагнозы | ❌ НЕТ (есть в medical_crm_models.py) | Не используется | Создать diagnoses |
| План лечения | ❌ НЕТ (есть в medical_crm_models.py) | Не используется | Создать treatment_plans |
| Заключения | ❌ НЕТ | Нет таблицы | Добавить в anamnesis или treatment_plans |

---

## Модули анализов

### 1. Фотометрия (Photometry)

| Фронтенд (PhotometryModule) | Текущий Бэкенд | Проблема | Рекомендация |
|----------------------------|----------------|----------|-------------|
| **Фотографии** | | | |
| frontal (анфас) | files (file_type=photo) ✓ | OK | OK |
| profile (профиль) | files (file_type=photo) ✓ | OK | OK |
| profile45 (профиль 45°) | files (file_type=photo) ✓ | OK | OK |
| intraoral (интраоральные) | files (file_type=photo) ✓ | OK | OK |
| | | | |
| **Результаты анализа** | | | |
| upper_lip_position | ❌ НЕТ | Нет специализированной таблицы | Создать photometry_analyses |
| lower_lip_position | ❌ НЕТ | Нет специализированной таблицы | Создать photometry_analyses |
| chin_position | ❌ НЕТ | Нет специализированной таблицы | Создать photometry_analyses |
| face_type | ❌ НЕТ | Нет специализированной таблицы | Создать photometry_analyses |
| proportions | ❌ НЕТ | Нет специализированной таблицы | Создать photometry_analyses |
| measurements | ❌ НЕТ (можно в JSON) | Хранится в medical_records.data? | Создать photometry_analyses |
| | | | |
| **Медицинская запись** | medical_records (record_type) | | |
| Тип записи | ❌ PHOTOMETRY не существует | MedicalRecordType = {cephalometry, ct} | Добавить PHOTOMETRY |
| Данные | medical_records.data (JSON) | Не структурировано | Создать photometry_analyses |

**Итог по фотометрии:**
- ❌ Нет специализированной таблицы для результатов анализа
- ❌ Нет типа PHOTOMETRY в MedicalRecordType
- ✅ Файлы хранятся корректно

---

### 2. Цефалометрия (Cephalometry)

| Фронтенд (CephalometryModule) | Текущий Бэкенд | Проблема | Рекомендация |
|------------------------------|----------------|----------|-------------|
| **Рентгеновские снимки** | | | |
| lateral (боковая проекция) | files (file_type=xray/panoramic) ✓ | OK | OK |
| frontal (прямая проекция) | files (file_type=xray/panoramic) ✓ | OK | OK |
| | | | |
| **Цефалометрические точки** | | | |
| S, N, A, B и др. точки | ❌ НЕТ | Нет специализированной таблицы | Создать ceph_points или хранить в JSON |
| | | | |
| **Углы** | | | |
| SNA | ❌ НЕТ | Нет специализированной таблицы | Создать cephalometry_analyses |
| SNB | ❌ НЕТ | Нет специализированной таблицы | Создать cephalometry_analyses |
| ANB | ❌ НЕТ | Нет специализированной таблицы | Создать cephalometry_analyses |
| Gonial angle | ❌ НЕТ | Нет специализированной таблицы | Создать cephalometry_analyses |
| Y-axis | ❌ НЕТ | Нет специализированной таблицы | Создать cephalometry_analyses |
| | | | |
| **Расстояния** | | | |
| Sella-Nasion | ❌ НЕТ | Нет специализированной таблицы | Создать cephalometry_analyses |
| Nasion-A | ❌ НЕТ | Нет специализированной таблицы | Создать cephalometry_analyses |
| A-B | ❌ НЕТ | Нет специализированной таблицы | Создать cephalometry_analyses |
| | | | |
| **Медицинская запись** | medical_records ✓ | | |
| Тип записи | MedicalRecordType.CEPHALOMETRY ✓ | OK | OK |
| Данные | medical_records.data (JSON) | Не структурировано | Создать cephalometry_analyses |

**Итог по цефалометрии:**
- ⚠️ Есть тип CEPHALOMETRY в MedicalRecordType
- ❌ Нет специализированной таблицы для результатов анализа
- ❌ Точки, углы, расстояния хранятся в неструктурированном JSON

---

### 3. КТ анализ (CT Scan)

| Фронтенд (CTModule) | Текущий Бэкенд | Проблема | Рекомендация |
|---------------------|----------------|----------|-------------|
| **DICOM файлы** | | | |
| ZIP архивы | files (file_type=ct_scan/dicom) ✓ | OK | OK |
| Плоскости: sagittal, coronal, axial | files + metadata ✓ | OK | OK |
| | | | |
| **Измерения ВНЧС (TMJ)** | | | |
| rightClosedPositionX/Y | ❌ НЕТ | Нет специализированной таблицы | Создать ct_analyses |
| rightOpenPositionX/Y | ❌ НЕТ | Нет специализированной таблицы | Создать ct_analyses |
| leftClosedPositionX/Y | ❌ НЕТ | Нет специализированной таблицы | Создать ct_analyses |
| leftOpenPositionX/Y | ❌ НЕТ | Нет специализированной таблицы | Создать ct_analyses |
| | | | |
| **Срезы зубов** | | | |
| toothWidthUpper/Lower | ❌ НЕТ | Нет специализированной таблицы | Создать ct_analyses |
| boneThicknessUpper/Lower | ❌ НЕТ | Нет специализированной таблицы | Создать ct_analyses |
| | | | |
| **Pen-анализ** | | | |
| molarInclinationUpper | ❌ НЕТ | Нет специализированной таблицы | Создать ct_analyses |
| molarInclinationLower | ❌ НЕТ | Нет специализированной таблицы | Создать ct_analyses |
| | | | |
| **Базальные измерения** | | | |
| basalWidthUpper/Lower | ❌ НЕТ | Нет специализированной таблицы | Создать ct_analyses |
| basalWidthDeficit | ❌ НЕТ | Нет специализированной таблицы | Создать ct_analyses |
| | | | |
| **Воздухоносные пути** | | | |
| tonguePosition | ❌ НЕТ | Нет специализированной таблицы | Создать ct_analyses |
| airwayVolume | ❌ НЕТ | Нет специализированной таблицы | Создать ct_analyses |
| maxillarySinusVolume | ❌ НЕТ | Нет специализированной таблицы | Создать ct_analyses |
| nasalCavityVolume | ❌ НЕТ | Нет специализированной таблицы | Создать ct_analyses |
| | | | |
| **Другие измерения** | | | |
| maxillaryWidth, mandibularWidth | ❌ НЕТ | Нет специализированной таблицы | Создать ct_analyses |
| facial measurements (heights, angles) | ❌ НЕТ | Нет специализированной таблицы | Создать ct_analyses |
| | | | |
| **Медицинская запись** | medical_records ✓ | | |
| Тип записи | MedicalRecordType.CT ✓ | OK | OK |
| Данные | medical_records.data (JSON) | Не структурировано | Создать ct_analyses |

**Итог по КТ:**
- ⚠️ Есть тип CT в MedicalRecordType
- ❌ Нет специализированной таблицы для результатов анализа
- ❌ Измерения хранятся в неструктурированном JSON

---

### 4. 3D моделирование (Modeling)

| Фронтенд (ModelingModule) | Текущий Бэкенд | Проблема | Рекомендация |
|--------------------------|----------------|----------|-------------|
| **3D модели** | | | |
| upper_jaw | three_d_models (model_type=upper_jaw) ✓ | OK | OK |
| lower_jaw | three_d_models (model_type=lower_jaw) ✓ | OK | OK |
| bite_1 | three_d_models (model_type=bite_1) ✓ | OK | OK |
| bite_2 | three_d_models (model_type=bite_2) ✓ | OK | OK |
| occlusion_pad | three_d_models (model_type=occlusion_pad) ✓ | OK | OK |
| | | | |
| **Метаданные модели** | | | |
| vertices_count | three_d_models.vertices_count ✓ | OK | OK |
| faces_count | three_d_models.faces_count ✓ | OK | OK |
| bounding_box | three_d_models.bounding_box (JSON) ✓ | OK | OK |
| file_size | three_d_models.file_size ✓ | OK | OK |
| | | | |
| **Параметры моделирования** | | | |
| cement_gap | modeling_sessions.cement_gap ✓ | OK | OK |
| insertion_path | modeling_sessions.insertion_path ✓ | OK | OK |
| border_thickness | modeling_sessions.border_thickness ✓ | OK | OK |
| smoothing_strength | modeling_sessions.smoothing_strength ✓ | OK | OK |
| auto_adaptation | modeling_sessions.auto_adaptation ✓ | OK | OK |
| modeling_parameters | modeling_sessions.modeling_parameters (JSON) ✓ | OK | OK |
| | | | |
| **Трансформация** | | | |
| scale | three_d_models.scale ✓ | OK | OK |
| position_x/y/z | three_d_models.position_x/y/z ✓ | OK | OK |
| rotation_x/y/z | three_d_models.rotation_x/y/z ✓ | OK | OK |
| | | | |
| **Статус моделирования** | | | |
| status | modeling_sessions.status ✓ | OK | OK |

**Итог по 3D моделированию:**
- ✅ ПОЛНОСТЬЮ СООТВЕТСТВУЕТ фронтенду
- ✅ Все таблицы существуют
- ✅ Все поля присутствуют

---

### 5. Биометрия (Biometry)

| Фронтенд (BiometryModule) | Текущий Бэкенд | Проблема | Рекомендация |
|---------------------------|----------------|----------|-------------|
| **3D модели** | | | |
| biometry_model | biometry_models ✓ | OK | OK |
| | | | |
| **Метаданные модели** | | | |
| vertices_count | biometry_models.vertices_count ✓ | OK | OK |
| faces_count | biometry_models.faces_count ✓ | OK | OK |
| bounding_box | biometry_models.bounding_box (JSON) ✓ | OK | OK |
| file_size | biometry_models.file_size ✓ | OK | OK |
| | | | |
| **Трансформация** | | | |
| scale | biometry_models.scale ✓ | OK | OK |
| position_x/y/z | biometry_models.position_x/y/z ✓ | OK | OK |
| rotation_x/y/z | biometry_models.rotation_x/y/z ✓ | OK | OK |
| | | | |
| **Сессия биометрии** | | | |
| calibration_points | biometry_sessions.calibration_points (JSON) ✓ | OK | OK |
| transformation_matrix | biometry_sessions.transformation_matrix (JSON) ✓ | OK | OK |
| status | biometry_sessions.status ✓ | OK | OK |
| | | | |
| **Точки и пары** (API endpoints) | | | |
| model_points | /biometry/model-points ✓ | API endpoint | OK |
| map_points | /biometry/map-points ✓ | API endpoint | OK |
| pairs | /biometry/pairs ✓ | API endpoint | OK |

**Итог по биометрии:**
- ✅ ПОЛНОСТЬЮ СООТВЕТСТВУЕТ фронтенду
- ✅ Все таблицы существуют
- ✅ Все поля присутствуют
- ✅ API endpoints для точек и пар есть

---

## Общая сводка

| Модуль | Таблицы существуют | Поля соответствуют | Статус |
|--------|------------------|-------------------|--------|
| Пациент | patients (частично) | ❌ (нет complaints) | ⚠️ Требуется доработка |
| Фотометрия | files только | ❌ (нет photometry_analyses) | ❌ Требуется создание таблицы |
| Цефалометрия | files + medical_records | ⚠️ (нет структуры) | ⚠️ Требуется специализация |
| КТ анализ | files + medical_records | ⚠️ (нет структуры) | ⚠️ Требуется специализация |
| 3D моделирование | three_d_models + modeling_sessions | ✅ Все поля | ✅ Идеально |
| Биометрия | biometry_models + biometry_sessions | ✅ Все поля | ✅ Идеально |
| Медицинская карта | patients только | ❌ (нет anamnesis, diagnoses, plans) | ❌ Требуется создание таблиц |

---

## Что есть в medical_crm_models.py, но НЕ используется

| Модель | Назначение | Используется? | Рекомендация |
|--------|-----------|---------------|-------------|
| Doctor | Врачи системы | ❌ Нет | Удалить или адаптировать |
| Patient (дубликат) | Пациенты с доп. полями | ❌ Конфликт | Удалить дубликат |
| Visit | Визиты пациентов | ❌ Нет | Удалить |
| Diagnosis | Диагнозы | ❌ Нет | Создать заново без дубликатов |
| TreatmentPlan | Планы лечения | ❌ Нет | Создать заново без дубликатов |
| TreatmentProcedure | Процедуры лечения | ❌ Нет | Удалить |
| Measurement | Общие измерения | ❌ Нет | Удалить |
| TestResult | Результаты анализов | ❌ Нет | Удалить |
| AnalysisModule | Аналитические модули | ❌ Нет | Удалить (использовать MedicalRecord) |
| AnalysisModuleHistory | История модулей | ❌ Нет | Удалить |
| DiseaseHistory | История болезней | ❌ Нет | Удалить |
| Prescription | Рецепты | ❌ Нет | Удалить |
| ThreeDModel (дубликат) | 3D модели | ❌ Конфликт | Удалить дубликат |
| BiometryModel (дубликат) | Модели биометрии | ❌ Конфликт | Удалить дубликат |
| BiometrySession (дубликат) | Сессии биометрии | ❌ Конфликт | Удалить дубликат |

---

## Приоритеты исправления

### Приоритет 1 - КРИТИЧЕСКИЕ проблемы
1. ❌ Удалить дубликаты моделей (Patient, ThreeDModel, BiometryModel)
2. ❌ Добавить поле complaints в Patient
3. ❌ Добавить типы PHOTOMETRY, BIOMETRY, MODELING в MedicalRecordType

### Приоритет 2 - Специализация данных
4. ⚠️ Создать таблицу photometry_analyses
5. ⚠️ Создать таблицу cephalometry_analyses
6. ⚠️ Создать таблицу ct_analyses
7. ⚠️ Структурировать JSON данные в полях

### Приоритет 3 - Медицинская карта
8. ❌ Создать таблицу anamnesis
9. ❌ Создать таблицу diagnoses
10. ❌ Создать таблицу treatment_plans

### Приоритет 4 - Очистка кода
11. ❌ Удалить или переименовать medical_crm_models.py
12. ❌ Удалить неиспользуемые импорты из __init__.py
