#!/usr/bin/env python3
"""
Простой тест подключения к базе данных и получения списка пациентов
"""

import argparse
import sys
import os
from typing import NoReturn

# Добавляем путь к модулям приложения
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.patient import Patient
from app.crud.crud_patient import patient as patient_crud


def test_db_connection_and_patients(show_details: bool = False) -> bool:
    """
    Тестирует подключение к базе данных и получение списка пациентов
    
    Args:
        show_details: Показывать ли подробную информацию о пациентах
    
    Returns:
        bool: True если тест пройден успешно, иначе False
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
        
        print(f"✓ Успешно подключился к базе данных!")
        print(f"✓ Найдено пациентов: {len(patients)}")
        
        # Выводим информацию о найденных пациентах, если нужно
        if show_details and len(patients) > 0:
            print("\nДетали пациентов:")
            for i, patient in enumerate(patients, 1):
                print(f"  {i}. ID: {patient.id}, Имя: {patient.full_name}, "
                      f"Дата рождения: {patient.birth_date}, Пол: {patient.gender}")
        
        return True
        
    except Exception as e:
        print(f"✗ Ошибка при работе с базой данных: {str(e)}")
        return False
    finally:
        # Закрываем сессию
        db.close()
        print("Соединение с базой данных закрыто")


def main() -> NoReturn:
    """
    Основная функция теста
    """
    parser = argparse.ArgumentParser(description='Тест подключения к базе данных пациентов')
    parser.add_argument('--details', '-d', action='store_true',
                        help='Показать подробную информацию о пациентах')
    parser.add_argument('--quiet', '-q', action='store_true',
                        help='Не выводить лишнюю информацию')
    
    args = parser.parse_args()
    
    if not args.quiet:
        print("=" * 60)
        print("Запуск теста подключения к базе данных пациентов")
        print("=" * 60)
    
    success = test_db_connection_and_patients(show_details=args.details)
    
    if not args.quiet:
        print("=" * 60)
        if success:
            print("ТЕСТ ПРОЙДЕН УСПЕШНО!")
            print("✓ Подключение к базе данных работает корректно")
            print("✓ Можно получить список пациентов")
        else:
            print("ТЕСТ НЕ ПРОЙДЕН!")
            print("✗ Произошла ошибка при работе с базой данных")
        print("=" * 60)
    
    # Выход с кодом ошибки в зависимости от результата
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()