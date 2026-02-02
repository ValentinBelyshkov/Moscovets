#!/usr/bin/env python3

"""
Script to seed the database with sample patient data and medical records
"""

import os
import sys
from datetime import date, datetime, timedelta
import json

# Add the parent directory to the path so we can import app modules
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.join(current_dir, '..')
sys.path.insert(0, parent_dir)

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User, UserRole, UserAccountStatus
from app.models.patient import Patient, Gender
from app.models.medical_record import MedicalRecord, MedicalRecordType
from app.core.security import get_password_hash


def seed_sample_data(db: Session):
    # Create admin user if not exists
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            email="admin@example.com",
            full_name="Administrator",
            hashed_password=get_password_hash("admin"),
            role=UserRole.ADMINISTRATOR,
            account_status=UserAccountStatus.ACTIVE
        )
        db.add(admin_user)
        print("Created admin user")
    
    # Sample patients data
    sample_patients = [
        {
            "full_name": "Иванов Иван Иванович",
            "birth_date": date(1985, 5, 15),
            "gender": Gender.MALE,
            "contact_info": "+7 (999) 123-45-67",
            "complaints": "Жалобы на головную боль при жевании",
            "medical_card_number": "MC-001-2026",
            "address": "г. Москва, ул. Тверская, д. 1",
            "emergency_contact": "Мария Ивановна +7 (999) 765-43-21"
        },
        {
            "full_name": "Петрова Мария Сергеевна",
            "birth_date": date(1992, 11, 22),
            "gender": Gender.FEMALE,
            "contact_info": "+7 (987) 654-32-10",
            "complaints": "Нарушение прикуса",
            "medical_card_number": "MC-002-2026",
            "address": "г. Санкт-Петербург, Невский проспект, д. 50",
            "emergency_contact": "Сергей Петрович +7 (987) 111-22-33"
        },
        {
            "full_name": "Сидоров Алексей Михайлович",
            "birth_date": date(1978, 3, 8),
            "gender": Gender.MALE,
            "contact_info": "+7 (921) 345-67-89",
            "complaints": "Боли в височно-нижечелюстном суставе",
            "medical_card_number": "MC-003-2026",
            "address": "г. Новосибирск, ул. Ленина, д. 15",
            "emergency_contact": "Ольга Алексеевна +7 (921) 987-65-43"
        },
        {
            "full_name": "Козлова Екатерина Андреевна",
            "birth_date": date(1989, 7, 30),
            "gender": Gender.FEMALE,
            "contact_info": "+7 (911) 234-56-78",
            "complaints": "Эстетические недостатки лица",
            "medical_card_number": "MC-004-2026",
            "address": "г. Екатеринбург, ул. Малышева, д. 25",
            "emergency_contact": "Андрей Козлов +7 (911) 876-54-32"
        },
        {
            "full_name": "Волков Дмитрий Николаевич",
            "birth_date": date(1995, 12, 10),
            "gender": Gender.MALE,
            "contact_info": "+7 (905) 456-78-90",
            "complaints": "Проблемы с прикусом после травмы",
            "medical_card_number": "MC-005-2026",
            "address": "г. Казань, ул. Баумана, д. 8",
            "emergency_contact": "Наталья Дмитриевна +7 (905) 098-76-54"
        }
    ]
    
    # Create patients
    created_patients = []
    for patient_data in sample_patients:
        existing_patient = db.query(Patient).filter(
            Patient.full_name == patient_data["full_name"]
        ).first()
        
        if not existing_patient:
            patient = Patient(**patient_data)
            db.add(patient)
            db.flush()  # Get the ID without committing
            created_patients.append(patient)
            print(f"Created patient: {patient.full_name}")
        else:
            created_patients.append(existing_patient)
            print(f"Patient already exists: {existing_patient.full_name}")
    
    # Create medical records for each patient
    for i, patient in enumerate(created_patients):
        # Create cephalometry record
        cephalometry_data = {
            "analysis_date": (datetime.now() - timedelta(days=(i*30))).isoformat(),
            "method": "Steiner",
            "measurements": {
                "SNA": 82.5,
                "SNB": 79.2,
                "ANB": 3.3,
                "FMA": 28.5,
                "IMPA": 90.1,
                "1-NA": 22.3,
                "1-NB": 25.7
            },
            "conclusion": "Умеренное отклонение верхней челюсти вперед, нормальный рост нижней челюсти",
            "recommendations": "Рассмотреть ортодонтическое лечение"
        }
        
        cephalometry_record = MedicalRecord(
            patient_id=patient.id,
            record_type=MedicalRecordType.CEPHALOMETRY,
            data=json.dumps(cephalometry_data, ensure_ascii=False),
            notes=f"Цефалометрический анализ для пациента {patient.full_name}"
        )
        db.add(cephalometry_record)
        
        # Create photometry record
        photometry_data = {
            "analysis_date": (datetime.now() - timedelta(days=(i*30)-5)).isoformat(),
            "frontal_photo_url": f"/storage/patients/patient_{patient.id}/photos/frontal.jpg",
            "profile_photo_url": f"/storage/patients/patient_{patient.id}/photos/profile.jpg",
            "measurements": {
                "facial_height_ratio": 0.45,
                "nasolabial_angle": 105.2,
                "lower_face_height": 68.3,
                "upper_lip_position": -2.1,
                "lower_lip_position": 1.8
            },
            "conclusion": "Симметричное лицо с небольшим выступанием нижней губы",
            "recommendations": "Мониторинг изменений"
        }
        
        photometry_record = MedicalRecord(
            patient_id=patient.id,
            record_type=MedicalRecordType.PHOTOMETRY,
            data=json.dumps(photometry_data, ensure_ascii=False),
            notes=f"Фотометрический анализ для пациента {patient.full_name}"
        )
        db.add(photometry_record)
        
        # Create biometry record
        biometry_data = {
            "analysis_date": (datetime.now() - timedelta(days=(i*30)-10)).isoformat(),
            "scan_type": "3D CBCT",
            "measurements": {
                "maxilla_width": 58.2,
                "mandible_width": 95.4,
                "ramus_height": 48.7,
                "corpus_height": 24.1,
                "condylar_width": 18.5,
                "gonial_angle": 126.3
            },
            "conclusion": "Нормальные пропорции костей лица",
            "recommendations": "Планирование хирургического вмешательства не требуется"
        }
        
        biometry_record = MedicalRecord(
            patient_id=patient.id,
            record_type=MedicalRecordType.BIOMETRY,
            data=json.dumps(biometry_data, ensure_ascii=False),
            notes=f"Биометрический анализ для пациента {patient.full_name}"
        )
        db.add(biometry_record)
        
        # Create CT analysis record
        ct_data = {
            "analysis_date": (datetime.now() - timedelta(days=(i*30)-15)).isoformat(),
            "scan_date": (datetime.now() - timedelta(days=(i*30)-20)).isoformat(),
            "slice_thickness": "0.4 mm",
            "volume": "512x512x256 voxels",
            "findings": {
                "tmj_condition": "Умеренная артрозная деформация",
                "sinuses": "Нормальная пневматизация",
                "airways": "Нормальный просвет верхних дыхательных путей",
                "bone_density": 450.2
            },
            "conclusion": "Незначительные изменения в височно-нижечелюстных суставах",
            "recommendations": "Динамическое наблюдение, физиотерапия"
        }
        
        ct_record = MedicalRecord(
            patient_id=patient.id,
            record_type=MedicalRecordType.CT,
            data=json.dumps(ct_data, ensure_ascii=False),
            notes=f"КТ анализ для пациента {patient.full_name}"
        )
        db.add(ct_record)
        
        # Create modeling record
        modeling_data = {
            "analysis_date": (datetime.now() - timedelta(days=(i*30)-25)).isoformat(),
            "model_type": "3D окклюзионная накладка",
            "simulation_results": {
                "bite_alignment": "Improved by 2.1mm",
                "occlusal_surface_area": 15.6,
                "force_distribution": "Even distribution achieved"
            },
            "status": "completed",
            "notes": "Модель успешно создана и протестирована"
        }
        
        modeling_record = MedicalRecord(
            patient_id=patient.id,
            record_type=MedicalRecordType.MODELING,
            data=json.dumps(modeling_data, ensure_ascii=False),
            notes=f"3D моделирование для пациента {patient.full_name}"
        )
        db.add(modeling_record)
        
        # Create anamnesis record
        anamnesis_data = {
            "collection_date": (datetime.now() - timedelta(days=(i*30)-30)).isoformat(),
            "personal_anamnesis": {
                "chronic_diseases": ["Гипертоническая болезнь (стадия 1)"],
                "allergies": ["Пыльца березы", "Шерсть кошек"],
                "medications": ["Эналаприл 5 мг/сут"],
                "previous_surgeries": ["Аппендэктомия в 2015 году"]
            },
            "family_anamnesis": {
                "hereditary_factors": ["Отцовская гипертония", "Материнский сахарный диабет 2 типа"],
                "family_dental_history": ["Преждевременная потеря зубов у отца"]
            },
            "dental_anamnesis": {
                "chief_complaint": "Дискомфорт при жевании",
                "present_illness": "Жалобы появились около 6 месяцев назад",
                "past_dental_treatment": "Удаление 48 зуба в 2020 году",
                "orthodontic_history": "Не проводилось"
            },
            "general_health_assessment": "Удовлетворительное состояние",
            "risk_factors": ["Вредные привычки: курение (10 сигарет/день)"]
        }
        
        anamnesis_record = MedicalRecord(
            patient_id=patient.id,
            record_type=MedicalRecordType.ANAMNESIS,
            data=json.dumps(anamnesis_data, ensure_ascii=False),
            notes=f"Анамнез для пациента {patient.full_name}"
        )
        db.add(anamnesis_record)
        
        print(f"Created medical records for patient: {patient.full_name}")
    
    db.commit()
    print("Sample data seeding completed successfully!")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_sample_data(db)
    finally:
        db.close()