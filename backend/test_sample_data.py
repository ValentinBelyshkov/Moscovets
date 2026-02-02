#!/usr/bin/env python3

"""
Simple test to verify sample patient data structure
"""

import json
from datetime import date, datetime, timedelta

# Sample patients data
sample_patients = [
    {
        "full_name": "Иванов Иван Иванович",
        "birth_date": date(1985, 5, 15),
        "gender": "male",
        "contact_info": "+7 (999) 123-45-67",
        "complaints": "Жалобы на головную боль при жевании",
        "medical_card_number": "MC-001-2026",
        "address": "г. Москва, ул. Тверская, д. 1",
        "emergency_contact": "Мария Ивановна +7 (999) 765-43-21"
    },
    {
        "full_name": "Петрова Мария Сергеевна",
        "birth_date": date(1992, 11, 22),
        "gender": "female",
        "contact_info": "+7 (987) 654-32-10",
        "complaints": "Нарушение прикуса",
        "medical_card_number": "MC-002-2026",
        "address": "г. Санкт-Петербург, Невский проспект, д. 50",
        "emergency_contact": "Сергей Петрович +7 (987) 111-22-33"
    },
    {
        "full_name": "Сидоров Алексей Михайлович",
        "birth_date": date(1978, 3, 8),
        "gender": "male",
        "contact_info": "+7 (921) 345-67-89",
        "complaints": "Боли в височно-нижечелюстном суставе",
        "medical_card_number": "MC-003-2026",
        "address": "г. Новосибирск, ул. Ленина, д. 15",
        "emergency_contact": "Ольга Алексеевна +7 (921) 987-65-43"
    },
    {
        "full_name": "Козлова Екатерина Андреевна",
        "birth_date": date(1989, 7, 30),
        "gender": "female",
        "contact_info": "+7 (911) 234-56-78",
        "complaints": "Эстетические недостатки лица",
        "medical_card_number": "MC-004-2026",
        "address": "г. Екатеринбург, ул. Малышева, д. 25",
        "emergency_contact": "Андрей Козлов +7 (911) 876-54-32"
    },
    {
        "full_name": "Волков Дмитрий Николаевич",
        "birth_date": date(1995, 12, 10),
        "gender": "male",
        "contact_info": "+7 (905) 456-78-90",
        "complaints": "Проблемы с прикусом после травмы",
        "medical_card_number": "MC-005-2026",
        "address": "г. Казань, ул. Баумана, д. 8",
        "emergency_contact": "Наталья Дмитриевна +7 (905) 098-76-54"
    }
]

print("Sample patients created:")
for i, patient in enumerate(sample_patients, 1):
    print(f"{i}. {patient['full_name']} - {patient['gender']} - Born: {patient['birth_date']}")

print("\nSample medical records that would be created:")

# Create medical records for first patient as example
patient = sample_patients[0]

# Cephalometry record
cephalometry_data = {
    "analysis_date": (datetime.now() - timedelta(days=30)).isoformat(),
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

print(f"Cephalometry record for {patient['full_name']}:")
print(json.dumps(cephalometry_data, indent=2, ensure_ascii=False))

# Photometry record
photometry_data = {
    "analysis_date": (datetime.now() - timedelta(days=25)).isoformat(),
    "frontal_photo_url": f"/storage/patients/patient_1/photos/frontal.jpg",
    "profile_photo_url": f"/storage/patients/patient_1/photos/profile.jpg",
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

print(f"\nPhotometry record for {patient['full_name']}:")
print(json.dumps(photometry_data, indent=2, ensure_ascii=False))

# Biometry record
biometry_data = {
    "analysis_date": (datetime.now() - timedelta(days=20)).isoformat(),
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

print(f"\nBiometry record for {patient['full_name']}:")
print(json.dumps(biometry_data, indent=2, ensure_ascii=False))

print("\nData structure is ready. When the environment is properly configured, this data will be added to the database.")