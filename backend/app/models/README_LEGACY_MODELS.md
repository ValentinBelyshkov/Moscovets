# LEGACY MODELS - НЕ ИСПОЛЬЗУЮТСЯ

## Файл: medical_crm_models_LEGACY_NOT_USED.py.bak

Этот файл содержит старые модели, которые **НЕ ИСПОЛЬЗУЮТСЯ** в текущей системе.

### Причины отключения:

1. **Дублирование моделей** - содержит дубликаты существующих моделей:
   - `Patient` - дублирует `/app/models/patient.py`
   - `ThreeDModel` - дублирует `/app/models/modeling.py`
   - `BiometryModel` - дублирует `/app/models/biometry.py`
   - `BiometrySession` - дублирует `/app/models/biometry.py`

2. **Конфликт имен таблиц** - все дубликаты используют одинаковые `__tablename__`, что создает конфликты в SQLAlchemy

3. **Нигде не импортируется** - проверка кодовой базы показала, что этот файл не импортируется ни в одном месте

### Что использовать вместо этого:

#### Активные модели (в /app/models/):
- ✅ `patient.py` - Patient
- ✅ `user.py` - User (вместо Doctor)
- ✅ `file.py` - File, FileVersion
- ✅ `document.py` - Document
- ✅ `medical_record.py` - MedicalRecord, MedicalRecordHistory
- ✅ `modeling.py` - ThreeDModel, ModelingSession
- ✅ `biometry.py` - BiometryModel, BiometrySession

#### Неиспользуемые модели из legacy файла:
- ❌ `Doctor` - не используется (используется User)
- ❌ `Visit` - не используется
- ❌ `Diagnosis` - будет создана новая версия
- ❌ `TreatmentPlan` - будет создана новая версия
- ❌ `TreatmentProcedure` - не используется
- ❌ `Measurement` - не используется
- ❌ `TestResult` - не используется
- ❌ `AnalysisModule` - не используется (используется MedicalRecord)
- ❌ `AnalysisModuleHistory` - не используется
- ❌ `DiseaseHistory` - не используется
- ❌ `Prescription` - не используется

### История изменений:

**2025-01-29**: Файл переименован в `.bak` и отключен из-за дублирования моделей и отсутствия использования в коде.

### Что делать дальше:

Если нужны дополнительные поля из legacy моделей (например, `medical_card_number`, `address`, `emergency_contact` из Patient), они будут добавлены в активные модели через миграции.

Для новых функций (диагнозы, планы лечения, анамнез) будут созданы новые чистые модели без дублирования.
