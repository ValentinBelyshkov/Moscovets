#!/usr/bin/env python3
"""
Миграционный скрипт для добавления новых полей и таблиц
Использовать если БД уже существует и нужно обновить структуру
"""

import sys
from pathlib import Path

# Добавляем путь до директории app
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.db.session import engine
from app.core.config import settings

print("=" * 80)
print("МИГРАЦИЯ БАЗЫ ДАННЫХ - ДОБАВЛЕНИЕ НОВЫХ ПОЛЕЙ И ТАБЛИЦ")
print("=" * 80)
print(f"База данных: {settings.DATABASE_URL}")
print("=" * 80)

def run_migration():
    """Запускает миграцию"""
    
    with engine.connect() as conn:
        print("\n1. Добавление новых полей в таблицу patients...")
        
        # Список новых полей для добавления
        new_patient_fields = [
            ("complaints", "TEXT"),
            ("medical_card_number", "VARCHAR(50)"),
            ("address", "TEXT"),
            ("emergency_contact", "TEXT"),
            ("insurance_info", "TEXT"),
        ]
        
        for field_name, field_type in new_patient_fields:
            try:
                # Проверяем существование поля
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='patients' AND column_name=:field_name
                """), {"field_name": field_name})
                
                if result.fetchone() is None:
                    # Поле не существует, добавляем
                    if field_name == "medical_card_number":
                        conn.execute(text(f"""
                            ALTER TABLE patients 
                            ADD COLUMN {field_name} {field_type} UNIQUE
                        """))
                        # Добавляем индекс
                        conn.execute(text(f"""
                            CREATE INDEX idx_patients_{field_name} 
                            ON patients({field_name})
                        """))
                    else:
                        conn.execute(text(f"""
                            ALTER TABLE patients 
                            ADD COLUMN {field_name} {field_type}
                        """))
                    
                    conn.commit()
                    print(f"   ✅ Добавлено поле: {field_name}")
                else:
                    print(f"   ⏭️  Поле уже существует: {field_name}")
                    
            except Exception as e:
                print(f"   ⚠️  Ошибка при добавлении {field_name}: {e}")
                conn.rollback()
        
        print("\n2. Обновление enum MedicalRecordType...")
        try:
            # Для PostgreSQL нужно обновить enum
            # Для SQLite это не требуется
            if 'postgresql' in settings.DATABASE_URL.lower():
                new_types = ['photometry', 'biometry', 'modeling', 'anamnesis']
                for new_type in new_types:
                    try:
                        conn.execute(text(f"""
                            ALTER TYPE medical_record_type ADD VALUE IF NOT EXISTS '{new_type}'
                        """))
                        conn.commit()
                        print(f"   ✅ Добавлен тип: {new_type}")
                    except Exception as e:
                        print(f"   ⚠️  Тип уже существует или ошибка: {new_type}")
                        conn.rollback()
            else:
                print("   ⏭️  SQLite не требует обновления enum")
        except Exception as e:
            print(f"   ⚠️  Ошибка при обновлении enum: {e}")
            conn.rollback()
        
        print("\n3. Создание новых таблиц...")
        
        # Создаем новые таблицы только если их нет
        from app.db.base import Base
        from app.models import (
            PhotometryAnalysis, CephalometryAnalysis, CTAnalysis,
            Anamnesis, Diagnosis, TreatmentPlan
        )
        
        # Получаем список существующих таблиц
        inspector = engine.dialect.get_inspector(engine)
        existing_tables = inspector.get_table_names()
        
        new_tables = {
            'photometry_analyses': PhotometryAnalysis,
            'cephalometry_analyses': CephalometryAnalysis,
            'ct_analyses': CTAnalysis,
            'anamnesis': Anamnesis,
            'diagnoses': Diagnosis,
            'treatment_plans': TreatmentPlan,
        }
        
        for table_name, model in new_tables.items():
            if table_name not in existing_tables:
                try:
                    model.__table__.create(bind=engine)
                    print(f"   ✅ Создана таблица: {table_name}")
                except Exception as e:
                    print(f"   ❌ Ошибка при создании {table_name}: {e}")
            else:
                print(f"   ⏭️  Таблица уже существует: {table_name}")
    
    print("\n" + "=" * 80)
    print("МИГРАЦИЯ ЗАВЕРШЕНА УСПЕШНО!")
    print("=" * 80)
    print("\nБаза данных обновлена и готова к использованию.")

if __name__ == "__main__":
    try:
        response = input("\nВы уверены что хотите запустить миграцию? (yes/no): ")
        if response.lower() in ['yes', 'y']:
            run_migration()
        else:
            print("Миграция отменена.")
    except Exception as e:
        print(f"\n❌ ОШИБКА: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
