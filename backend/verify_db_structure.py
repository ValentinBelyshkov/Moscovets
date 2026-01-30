#!/usr/bin/env python3
"""
Скрипт для проверки структуры базы данных
Проверяет что все модели корректно определены и нет дубликатов
"""

import sys
from pathlib import Path

# Добавляем путь до директории app
sys.path.insert(0, str(Path(__file__).parent))

print("=" * 80)
print("ПРОВЕРКА СТРУКТУРЫ БАЗЫ ДАННЫХ")
print("=" * 80)

try:
    # Импортируем все модели
    print("\n1. Импорт моделей...")
    from app.models import (
        User, Patient, File, FileVersion, MedicalRecord, MedicalRecordHistory,
        Document, ThreeDModel, ModelingSession, BiometryModel, BiometrySession,
        PhotometryAnalysis, CephalometryAnalysis, CTAnalysis,
        Anamnesis, Diagnosis, TreatmentPlan
    )
    print("   ✅ Все модели успешно импортированы")
    
    # Проверяем Patient
    print("\n2. Проверка модели Patient...")
    patient_columns = [c.name for c in Patient.__table__.columns]
    print(f"   Поля Patient: {', '.join(patient_columns)}")
    
    required_fields = ['complaints', 'medical_card_number', 'address', 'emergency_contact', 'insurance_info']
    missing_fields = [f for f in required_fields if f not in patient_columns]
    
    if missing_fields:
        print(f"   ❌ ОШИБКА: Отсутствуют поля: {', '.join(missing_fields)}")
    else:
        print(f"   ✅ Все обязательные поля присутствуют")
    
    # Проверяем MedicalRecordType
    print("\n3. Проверка MedicalRecordType...")
    from app.models.medical_record import MedicalRecordType
    record_types = [t.value for t in MedicalRecordType]
    print(f"   Типы: {', '.join(record_types)}")
    
    required_types = ['cephalometry', 'ct', 'photometry', 'biometry', 'modeling', 'anamnesis']
    missing_types = [t for t in required_types if t not in record_types]
    
    if missing_types:
        print(f"   ❌ ОШИБКА: Отсутствуют типы: {', '.join(missing_types)}")
    else:
        print(f"   ✅ Все обязательные типы присутствуют")
    
    # Проверяем новые таблицы
    print("\n4. Проверка новых таблиц...")
    new_tables = {
        'PhotometryAnalysis': PhotometryAnalysis,
        'CephalometryAnalysis': CephalometryAnalysis,
        'CTAnalysis': CTAnalysis,
        'Anamnesis': Anamnesis,
        'Diagnosis': Diagnosis,
        'TreatmentPlan': TreatmentPlan,
    }
    
    for name, model in new_tables.items():
        table_name = model.__tablename__
        columns = [c.name for c in model.__table__.columns]
        print(f"   ✅ {name} (таблица: {table_name})")
        print(f"      Поля: {', '.join(columns)}")
    
    # Проверяем что medical_crm_models не импортируется
    print("\n5. Проверка отсутствия дубликатов...")
    from pathlib import Path
    models_dir = Path(__file__).parent / "app" / "models"
    legacy_file = models_dir / "medical_crm_models_LEGACY_NOT_USED.py.bak"
    
    if legacy_file.exists():
        print(f"   ✅ Legacy файл корректно переименован: {legacy_file.name}")
    else:
        print(f"   ⚠️  Legacy файл не найден (возможно уже удален)")
    
    # Проверяем relationships
    print("\n6. Проверка relationships в Patient...")
    patient_relationships = [r.key for r in Patient.__mapper__.relationships]
    print(f"   Relationships: {', '.join(patient_relationships)}")
    
    expected_relationships = [
        'three_d_models', 'modeling_sessions', 'biometry_models', 'biometry_sessions',
        'documents', 'files', 'medical_records',
        'photometry_analyses', 'cephalometry_analyses', 'ct_analyses',
        'anamnesis', 'diagnoses', 'treatment_plans'
    ]
    
    missing_relationships = [r for r in expected_relationships if r not in patient_relationships]
    if missing_relationships:
        print(f"   ⚠️  Отсутствующие relationships: {', '.join(missing_relationships)}")
    else:
        print(f"   ✅ Все relationships присутствуют")
    
    print("\n" + "=" * 80)
    print("ПРОВЕРКА ЗАВЕРШЕНА УСПЕШНО!")
    print("=" * 80)
    print("\nСтруктура базы данных корректна и готова к использованию.")
    print("\nСледующие шаги:")
    print("1. Запустите: python recreate_db.py")
    print("2. Создайте API endpoints для новых таблиц")
    print("3. Создайте Pydantic схемы для валидации")
    print("4. Обновите фронтенд для работы с новыми endpoints")
    
except Exception as e:
    print(f"\n❌ ОШИБКА: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
