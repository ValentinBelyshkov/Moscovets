#!/usr/bin/env python3
"""
Тест подключения к базе данных и получения списка пациентов
"""

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.patient import Patient
from app.crud.crud_patient import patient as patient_crud


def test_db_connection():
    """
    Тестирует подключение к базе данных и получение списка пациентов
    """
    print("Тест: Подключение к базе данных и получение списка пациентов")
    
    # Создаем сессию для работы с базой данных
    db: Session = SessionLocal()
    
    try:
        # Проверяем подключение, делая простой запрос
        print("Подключаюсь к базе данных...")
        
        # Получаем всех пациентов из базы данных
        print("Получаю список пациентов...")
        patients = patient_crud.get_multi(db, skip=0, limit=100)
        
        print(f"Успешно подключился к базе данных!")
        print(f"Найдено пациентов: {len(patients)}")
        
        # Выводим информацию о найденных пациентах
        for i, patient in enumerate(patients, 1):
            print(f"  {i}. ID: {patient.id}, Имя: {patient.full_name}, "
                  f"Дата рождения: {patient.birth_date}, Пол: {patient.gender}")
        
        return True
        
    except Exception as e:
        print(f"Ошибка при работе с базой данных: {str(e)}")
        return False
    finally:
        # Закрываем сессию
        db.close()
        print("Соединение с базой данных закрыто")


def main():
    """
    Основная функция теста
    """
    print("=" * 60)
    print("Запуск теста подключения к базе данных")
    print("=" * 60)
    
    success = test_db_connection()
    
    print("=" * 60)
    if success:
        print("ТЕСТ ПРОЙДЕН УСПЕШНО!")
    else:
        print("ТЕСТ НЕ ПРОЙДЕН!")
    print("=" * 60)


if __name__ == "__main__":
    main()