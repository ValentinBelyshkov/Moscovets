#!/usr/bin/env python3
"""
Тестовый скрипт для проверки расширенных полей пациента
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.db.session import SessionLocal
from app.crud.crud_patient import patient as patient_crud
from app.schemas.patient import PatientCreate
from app.models.patient import Gender, LocalityType, MaritalStatus, EducationLevel, ProfileType, LipPosition, ChinShift
from datetime import date

def test_patient_creation():
    """Тестирование создания пациента со всеми полями"""
    db = SessionLocal()
    
    try:
        # Создаем пациента с полными данными
        patient_data = PatientCreate(
            full_name="Иванов Иван Иванович",
            birth_date=date(1985, 5, 15),
            gender=Gender.MALE,
            contact_info="+7 (999) 123-45-67",
            medical_card_number="MC-2025-001",
            
            # Место регистрации
            registration_republic="Московская область",
            registration_city="Москва",
            registration_street="Ленина",
            registration_house="10",
            registration_apartment="5",
            registration_phone="+7 (999) 123-45-67",
            
            # Социально-демографические данные
            locality_type=LocalityType.URBAN,
            marital_status=MaritalStatus.REGISTERED_MARRIAGE,
            education_level=EducationLevel.HIGHER,
            
            # Кефалометрия - лицо анфас
            cephalometry_zy_zy=145.5,
            cephalometry_n_me=120.3,
            cephalometry_n_sn=65.7,
            face_symmetric=True,
            chin_shift=ChinShift.NONE,
            mental_fold_pronounced=False,
            lips_closed=True,
            gummy_smile=False,
            
            # Кефалометрия - лицо в профиль
            profile_type=ProfileType.STRAIGHT,
            upper_lip_position=LipPosition.CORRECT
        )
        
        # Создаем пациента
        patient = patient_crud.create(db=db, obj_in=patient_data)
        
        print("✅ Пациент успешно создан!")
        print(f"ID: {patient.id}")
        print(f"ФИО: {patient.full_name}")
        print(f"Дата рождения: {patient.birth_date}")
        print(f"Пол: {patient.gender.value}")
        print(f"\nМесто регистрации:")
        print(f"  Город: {patient.registration_city}")
        print(f"  Улица: {patient.registration_street}, дом {patient.registration_house}, кв. {patient.registration_apartment}")
        print(f"\nСоциально-демографические данные:")
        print(f"  Местность: {patient.locality_type.value if patient.locality_type else 'не указано'}")
        print(f"  Семейное положение: {patient.marital_status.value if patient.marital_status else 'не указано'}")
        print(f"  Образование: {patient.education_level.value if patient.education_level else 'не указано'}")
        print(f"\nКефалометрия (лицо анфас):")
        print(f"  zy-zy: {patient.cephalometry_zy_zy} мм")
        print(f"  n-me: {patient.cephalometry_n_me} мм")
        print(f"  n-sn: {patient.cephalometry_n_sn} мм")
        print(f"  Симметричное: {patient.face_symmetric}")
        print(f"  Смещение подбородка: {patient.chin_shift.value if patient.chin_shift else 'нет'}")
        print(f"  Губы сомкнуты: {patient.lips_closed}")
        print(f"\nКефалометрия (лицо в профиль):")
        print(f"  Тип профиля: {patient.profile_type.value if patient.profile_type else 'не указано'}")
        print(f"  Положение верхней губы: {patient.upper_lip_position.value if patient.upper_lip_position else 'не указано'}")
        
        # Тестируем получение пациента
        retrieved_patient = patient_crud.get(db=db, id=patient.id)
        assert retrieved_patient is not None
        print("\n✅ Пациент успешно получен из БД")
        
        # Тестируем обновление
        from app.schemas.patient import PatientUpdate
        update_data = PatientUpdate(
            cephalometry_zy_zy=146.0,
            profile_type=ProfileType.CONVEX
        )
        updated_patient = patient_crud.update(db=db, db_obj=patient, obj_in=update_data)
        print(f"\n✅ Пациент обновлен: zy-zy = {updated_patient.cephalometry_zy_zy} мм, профиль = {updated_patient.profile_type.value}")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("=== Тестирование расширенных полей пациента ===\n")
    success = test_patient_creation()
    sys.exit(0 if success else 1)
