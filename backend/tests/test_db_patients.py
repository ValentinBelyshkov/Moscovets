#!/usr/bin/env python3
"""
Расширенный тест подключения к базе данных и получения списка пациентов
Создает тестовые данные, если они отсутствуют
"""

import os
import sys
from datetime import date

# Добавляем путь к модулям приложения
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.patient import Patient, Gender
from app.crud.crud_patient import patient as patient_crud
from app.models.user import User, UserRole, UserAccountStatus
from app.core.security import get_password_hash


def create_test_data(db: Session):
    """
    Создает тестовые данные, если они отсутствуют
    """
    print("Проверяю наличие тестовых данных...")
    
    # Создаем тестового пользователя, если не существует
    test_user = db.query(User).filter(User.username == "test_user").first()
    if not test_user:
        test_user = User(
            username="test_user",
            email="test@example.com",
            full_name="Test Patient User",
            hashed_password=get_password_hash("password123"),
            role=UserRole.WORKER,
            account_status=UserAccountStatus.ACTIVE
        )
        db.add(test_user)
        print("Создан тестовый пользователь")
    
    # Создаем тестовых пациентов, если не существует
    patients_data = [
        {
            "full_name": "Иванов Иван Иванович",
            "birth_date": date(1985, 5, 15),
            "gender": Gender.MALE,
            "contact_info": "ivanov@example.com"
        },
        {
            "full_name": "Петрова Мария Сергеевна",
            "birth_date": date(1990, 11, 23),
            "gender": Gender.FEMALE,
            "contact_info": "petrova@example.com"
        },
        {
            "full_name": "Сидоров Алексей Петрович",
            "birth_date": date(1978, 3, 8),
            "gender": Gender.MALE,
            "contact_info": "sidorov@example.com"
        }
    ]
    
    for patient_data in patients_data:
        existing_patient = db.query(Patient).filter(
            Patient.full_name == patient_data["full_name"]
        ).first()
        
        if not existing_patient:
            new_patient = Patient(**patient_data)
            db.add(new_patient)
            print(f"Создан тестовый пациент: {patient_data['full_name']}")
    
    db.commit()
    print("Тестовые данные созданы успешно!")


def test_db_connection():
    """
    Тестирует подключение к базе данных и получение списка пациентов
    """
    print("\n" + "="*60)
    print("ТЕСТ: Подключение к базе данных и получение списка пациентов")
    print("="*60)
    
    # Создаем сессию для работы с базой данных
    db: Session = SessionLocal()
    
    try:
        # Проверяем подключение, делая простой запрос
        print("Подключаюсь к базе данных...")
        
        # Проверяем, есть ли пациенты в базе
        existing_patients_count = db.query(Patient).count()
        print(f"Количество существующих пациентов в базе: {existing_patients_count}")
        
        if existing_patients_count == 0:
            print("В базе данных нет пациентов. Создаю тестовые данные...")
            create_test_data(db)
        
        # Получаем всех пациентов из базы данных
        print("\nПолучаю список пациентов...")
        patients = patient_crud.get_multi(db, skip=0, limit=100)
        
        print(f"\nУспешно подключился к базе данных!")
        print(f"Найдено пациентов: {len(patients)}")
        
        # Выводим информацию о найденных пациентах
        if len(patients) > 0:
            print("\nСписок пациентов:")
            print("-" * 80)
            for i, patient in enumerate(patients, 1):
                print(f"{i:2d}. ID: {patient.id:>3}, "
                      f"Имя: {patient.full_name:<25} "
                      f"Дата рождения: {patient.birth_date} "
                      f"Пол: {patient.gender.value}")
            print("-" * 80)
        else:
            print("В базе данных нет ни одного пациента.")
        
        return True
        
    except Exception as e:
        print(f"Ошибка при работе с базой данных: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Закрываем сессию
        db.close()
        print("\nСоединение с базой данных закрыто")


def main():
    """
    Основная функция теста
    """
    print("Запуск расширенного теста подключения к базе данных")
    print("Этот тест проверяет:")
    print("1. Подключение к базе данных")
    print("2. Возможность получения списка пациентов")
    print("3. Создание тестовых данных при необходимости")
    
    success = test_db_connection()
    
    print("\n" + "=" * 60)
    if success:
        print("ТЕСТ ПРОЙДЕН УСПЕШНО!")
        print("Подключение к базе данных работает корректно,")
        print("и можно получить список пациентов.")
    else:
        print("ТЕСТ НЕ ПРОЙДЕН!")
        print("Произошла ошибка при работе с базой данных.")
    print("=" * 60)


if __name__ == "__main__":
    main()