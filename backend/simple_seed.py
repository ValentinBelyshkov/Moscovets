#!/usr/bin/env python3
"""
Simple script to seed the database with sample patients and medical records
This version avoids complex imports that cause pydantic issues
"""

import sqlite3
import json
import os
from datetime import datetime, date

# Connect to the database
db_path = os.path.join(os.path.dirname(__file__), "instance", "database.db")
os.makedirs(os.path.dirname(db_path), exist_ok=True)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create tables if they don't exist (basic schema)
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    full_name TEXT,
    hashed_password TEXT NOT NULL,
    role TEXT DEFAULT 'worker',
    account_status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    gender TEXT NOT NULL,
    contact_info TEXT,
    complaints TEXT,
    medical_card_number TEXT UNIQUE,
    address TEXT,
    emergency_contact TEXT,
    insurance_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS medical_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    record_type TEXT NOT NULL,
    data TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients (id)
);
""")

# Insert admin user
try:
    cursor.execute("""
    INSERT INTO users (username, email, full_name, hashed_password, role, account_status) 
    VALUES (?, ?, ?, ?, ?, ?)
    """, ("admin", "admin@example.com", "Administrator", 
          "$2b$12$VcCDgh2NOWmWwjT.oJ824OJe.THRl5qIDqJ3ObieAJ1NWME..vm/e",  # hash for "admin"
          "administrator", "active"))
    print("Admin user created")
except sqlite3.IntegrityError:
    print("Admin user already exists")

# Sample patients data
sample_patients = [
    {
        "full_name": "Иванов Иван Иванович",
        "birth_date": "1985-05-15",
        "gender": "male",
        "contact_info": "+7 (999) 123-45-67",
        "complaints": "Жалобы на головную боль при жевании",
        "medical_card_number": "MC-001-2026",
        "address": "г. Москва, ул. Тверская, д. 1",
        "emergency_contact": "Мария Ивановна +7 (999) 765-43-21"
    },
    {
        "full_name": "Петрова Мария Сергеевна",
        "birth_date": "1992-11-22",
        "gender": "female",
        "contact_info": "+7 (987) 654-32-10",
        "complaints": "Нарушение прикуса",
        "medical_card_number": "MC-002-2026",
        "address": "г. Санкт-Петербург, Невский проспект, д. 50",
        "emergency_contact": "Сергей Петрович +7 (987) 111-22-33"
    },
    {
        "full_name": "Сидоров Алексей Михайлович",
        "birth_date": "1978-03-08",
        "gender": "male",
        "contact_info": "+7 (921) 345-67-89",
        "complaints": "Боли в височно-нижечелюстном суставе",
        "medical_card_number": "MC-003-2026",
        "address": "г. Новосибирск, ул. Ленина, д. 15",
        "emergency_contact": "Ольга Алексеевна +7 (921) 987-65-43"
    },
    {
        "full_name": "Козлова Екатерина Андреевна",
        "birth_date": "1989-07-30",
        "gender": "female",
        "contact_info": "+7 (911) 234-56-78",
        "complaints": "Эстетические недостатки лица",
        "medical_card_number": "MC-004-2026",
        "address": "г. Екатеринбург, ул. Малышева, д. 25",
        "emergency_contact": "Андрей Козлов +7 (911) 876-54-32"
    },
    {
        "full_name": "Волков Дмитрий Николаевич",
        "birth_date": "1995-12-10",
        "gender": "male",
        "contact_info": "+7 (905) 456-78-90",
        "complaints": "Проблемы с прикусом после травмы",
        "medical_card_number": "MC-005-2026",
        "address": "г. Казань, ул. Баумана, д. 8",
        "emergency_contact": "Наталья Дмитриевна +7 (905) 098-76-54"
    }
]

# Insert patients and get their IDs
patient_ids = []
for patient in sample_patients:
    try:
        cursor.execute("""
        INSERT INTO patients (full_name, birth_date, gender, contact_info, complaints, 
                            medical_card_number, address, emergency_contact)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (patient["full_name"], patient["birth_date"], patient["gender"], 
              patient["contact_info"], patient["complaints"], 
              patient["medical_card_number"], patient["address"], patient["emergency_contact"]))
        patient_id = cursor.lastrowid
        patient_ids.append(patient_id)
        print(f"Added patient: {patient['full_name']}")
    except sqlite3.IntegrityError:
        # Find existing patient ID
        cursor.execute("SELECT id FROM patients WHERE full_name = ?", (patient["full_name"],))
        result = cursor.fetchone()
        if result:
            patient_ids.append(result[0])
        print(f"Patient already exists: {patient['full_name']}")

# Create medical records for each patient
for i, patient_id in enumerate(patient_ids):
    # Cephalometry record
    cephalometry_data = {
        "analysis_date": datetime.now().isoformat(),
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
    
    cursor.execute("""
    INSERT INTO medical_records (patient_id, record_type, data, notes)
    VALUES (?, ?, ?, ?)
    """, (patient_id, "cephalometry", json.dumps(cephalometry_data, ensure_ascii=False), 
          f"Цефалометрический анализ для пациента {sample_patients[i]['full_name']}"))

    # Photometry record
    photometry_data = {
        "analysis_date": datetime.now().isoformat(),
        "frontal_photo_url": f"/storage/patients/patient_{patient_id}/photos/frontal.jpg",
        "profile_photo_url": f"/storage/patients/patient_{patient_id}/photos/profile.jpg",
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
    
    cursor.execute("""
    INSERT INTO medical_records (patient_id, record_type, data, notes)
    VALUES (?, ?, ?, ?)
    """, (patient_id, "photometry", json.dumps(photometry_data, ensure_ascii=False), 
          f"Фотометрический анализ для пациента {sample_patients[i]['full_name']}"))

    # Biometry record
    biometry_data = {
        "analysis_date": datetime.now().isoformat(),
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
    
    cursor.execute("""
    INSERT INTO medical_records (patient_id, record_type, data, notes)
    VALUES (?, ?, ?, ?)
    """, (patient_id, "biometry", json.dumps(biometry_data, ensure_ascii=False), 
          f"Биометрический анализ для пациента {sample_patients[i]['full_name']}"))

    # CT analysis record
    ct_data = {
        "analysis_date": datetime.now().isoformat(),
        "scan_date": datetime.now().isoformat(),
        "slice_thickness": "0.4 mm",
        "volume": "512x512x256 voxels",
        "findings": {
            "tmj_condition": "Умеренная артрозная деформация",
            "sinuses": "Нормальная пневматизация",
            "airways": "Нормальный просвет верхных дыхательных путей",
            "bone_density": 450.2
        },
        "conclusion": "Незначительные изменения в височно-нижечелюстных суставах",
        "recommendations": "Динамическое наблюдение, физиотерапия"
    }
    
    cursor.execute("""
    INSERT INTO medical_records (patient_id, record_type, data, notes)
    VALUES (?, ?, ?, ?)
    """, (patient_id, "ct", json.dumps(ct_data, ensure_ascii=False), 
          f"КТ анализ для пациента {sample_patients[i]['full_name']}"))

    # Modeling record
    modeling_data = {
        "analysis_date": datetime.now().isoformat(),
        "model_type": "3D окклюзионная накладка",
        "simulation_results": {
            "bite_alignment": "Improved by 2.1mm",
            "occlusal_surface_area": 15.6,
            "force_distribution": "Even distribution achieved"
        },
        "status": "completed",
        "notes": "Модель успешно создана и протестирована"
    }
    
    cursor.execute("""
    INSERT INTO medical_records (patient_id, record_type, data, notes)
    VALUES (?, ?, ?, ?)
    """, (patient_id, "modeling", json.dumps(modeling_data, ensure_ascii=False), 
          f"3D моделирование для пациента {sample_patients[i]['full_name']}"))

    # Anamnesis record
    anamnesis_data = {
        "collection_date": datetime.now().isoformat(),
        "personal_anamnesis": {
            "chronic_diseases": ["Гипертоническая болезнь (стадия 1)"] if i % 2 == 0 else [],
            "allergies": ["Пыльца березы", "Шерсть кошек"] if i % 3 == 0 else ["Нет известных"],
            "medications": ["Эналаприл 5 мг/сут"] if i % 2 == 0 else [],
            "previous_surgeries": ["Аппендэктомия в 2020 году"] if i % 4 == 0 else []
        },
        "family_anamnesis": {
            "hereditary_factors": ["Отцовская гипертония"] if i % 2 == 0 else ["Нет значимых факторов"],
            "family_dental_history": ["Преждевременная потеря зубов у отца"] if i % 3 == 0 else ["Без особенностей"]
        },
        "dental_anamnesis": {
            "chief_complaint": "Дискомфорт при жевании",
            "present_illness": "Жалобы появились около 6 месяцев назад",
            "past_dental_treatment": "Удаление 48 зуба в 2020 году" if i % 3 == 0 else "Нет предшествующего лечения",
            "orthodontic_history": "Не проводилось"
        },
        "general_health_assessment": "Удовлетворительное состояние",
        "risk_factors": ["Вредные привычки: курение (10 сигарет/день)"] if i % 2 == 0 else ["Нет значимых факторов риска"]
    }
    
    cursor.execute("""
    INSERT INTO medical_records (patient_id, record_type, data, notes)
    VALUES (?, ?, ?, ?)
    """, (patient_id, "anamnesis", json.dumps(anamnesis_data, ensure_ascii=False), 
          f"Анамнез для пациента {sample_patients[i]['full_name']}"))

    print(f"Added medical records for patient ID {patient_id}")

# Commit changes and close connection
conn.commit()
conn.close()

print("\nDatabase seeding completed successfully!")
print("5 patients with complete medical records have been added to the database.")