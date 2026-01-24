#!/usr/bin/env python3
"""
Скрипт миграции схемы базы данных для новой системы управления файлами
"""

import os
import sqlite3
from datetime import datetime
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

class DatabaseMigration:
    """Класс для миграции схемы базы данных"""
    
    def __init__(self, database_url: str = "sqlite:///./patients.db"):
        self.database_url = database_url
        self.engine = create_engine(database_url)
        
    def create_backup(self) -> str:
        """Создает резервную копию базы данных"""
        db_path = Path("patients.db")
        if not db_path.exists():
            print("Файл базы данных не найден")
            return ""
            
        backup_dir = Path("backups")
        backup_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f"backup_pre_file_migration_{timestamp}.db"
        backup_path = backup_dir / backup_filename
        
        # Копируем файл базы данных
        import shutil
        shutil.copy2(db_path, backup_path)
        print(f"Резервная копия создана: {backup_path}")
        return str(backup_path)
    
    def check_current_schema(self) -> dict:
        """Проверяет текущую схему базы данных"""
        with sqlite3.connect("patients.db") as conn:
            cursor = conn.cursor()
            
            # Получаем информацию о таблицах
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            
            schema_info = {
                'tables': tables,
                'files_table_exists': 'files' in tables,
                'file_versions_table_exists': 'file_versions' in tables
            }
            
            # Проверяем структуру таблицы files
            if 'files' in tables:
                cursor.execute("PRAGMA table_info(files)")
                files_columns = cursor.fetchall()
                schema_info['files_columns'] = [col[1] for col in files_columns]
                
                # Проверяем наличие новых полей
                expected_columns = [
                    'medical_file_type', 'medical_category', 'study_date', 
                    'body_part', 'image_orientation', 'file_size', 'mime_type', 'file_hash'
                ]
                existing_columns = [col[1] for col in files_columns]
                
                schema_info['missing_files_columns'] = [col for col in expected_columns if col not in existing_columns]
                schema_info['has_old_file_type'] = 'file_type' in existing_columns
            
            # Проверяем структуру таблицы file_versions
            if 'file_versions' in tables:
                cursor.execute("PRAGMA table_info(file_versions)")
                version_columns = cursor.fetchall()
                schema_info['version_columns'] = [col[1] for col in version_columns]
                
                # Проверяем наличие новых полей
                expected_version_columns = [
                    'file_hash', 'file_size', 'version_type', 
                    'version_description', 'created_by'
                ]
                existing_version_columns = [col[1] for col in version_columns]
                
                schema_info['missing_version_columns'] = [col for col in expected_version_columns if col not in existing_version_columns]
            
            return schema_info
    
    def migrate_files_table(self, dry_run: bool = True) -> list:
        """Мигрирует таблицу files"""
        print(f"Миграция таблицы files (dry_run={dry_run})...")
        
        schema_info = self.check_current_schema()
        
        # Если нет старого поля file_type, миграция не нужна
        if not schema_info['has_old_file_type']:
            print("Таблица files уже содержит новую схему или не требует миграции")
            return []
        
        migration_steps = []
        
        # 1. Добавляем новые колонки в таблицу files
        files_migrations = {
            'medical_file_type': 'ALTER TABLE files ADD COLUMN medical_file_type TEXT;',
            'medical_category': 'ALTER TABLE files ADD COLUMN medical_category TEXT;',
            'study_date': 'ALTER TABLE files ADD COLUMN study_date DATE;',
            'body_part': 'ALTER TABLE files ADD COLUMN body_part TEXT(100);',
            'image_orientation': 'ALTER TABLE files ADD COLUMN image_orientation TEXT(50);',
            'file_size': 'ALTER TABLE files ADD COLUMN file_size INTEGER;',
            'mime_type': 'ALTER TABLE files ADD COLUMN mime_type TEXT(100);',
            'file_hash': 'ALTER TABLE files ADD COLUMN file_hash TEXT(64);'
        }
        
        for column, sql in files_migrations.items():
            if column in schema_info['missing_files_columns']:
                migration_steps.append({
                    'table': 'files',
                    'sql': sql,
                    'description': f'Добавление колонки {column}'
                })
        
        # 2. Копируем данные из старого file_type в новый medical_file_type
        copy_data_sql = """
            UPDATE files 
            SET medical_file_type = CASE file_type
                WHEN 'image' THEN 'photo'
                WHEN 'pdf' THEN 'pdf'  
                WHEN 'document' THEN 'document'
                WHEN 'other' THEN 'other'
                ELSE 'other'
            END
            WHERE medical_file_type IS NULL;
        """
        
        migration_steps.append({
            'table': 'files',
            'sql': copy_data_sql,
            'description': 'Копирование данных из file_type в medical_file_type'
        })
        
        # 3. Создаем индексы для новых полей
        index_sqls = [
            "CREATE INDEX IF NOT EXISTS idx_files_medical_type ON files(medical_file_type);",
            "CREATE INDEX IF NOT EXISTS idx_files_medical_category ON files(medical_category);",
            "CREATE INDEX IF NOT EXISTS idx_files_study_date ON files(study_date);",
            "CREATE INDEX IF NOT EXISTS idx_files_patient_type ON files(patient_id, medical_file_type);"
        ]
        
        for sql in index_sqls:
            migration_steps.append({
                'table': 'files',
                'sql': sql,
                'description': 'Создание индекса'
            })
        
        return migration_steps
    
    def migrate_file_versions_table(self, dry_run: bool = True) -> list:
        """Мигрирует таблицу file_versions"""
        print(f"Миграция таблицы file_versions (dry_run={dry_run})...")
        
        schema_info = self.check_current_schema()
        migration_steps = []
        
        # Добавляем новые колонки в таблицу file_versions
        version_migrations = {
            'file_hash': 'ALTER TABLE file_versions ADD COLUMN file_hash TEXT(64);',
            'file_size': 'ALTER TABLE file_versions ADD COLUMN file_size INTEGER;',
            'version_type': 'ALTER TABLE file_versions ADD COLUMN version_type TEXT DEFAULT "baseline";',
            'version_description': 'ALTER TABLE file_versions ADD COLUMN version_description TEXT;',
            'created_by': 'ALTER TABLE file_versions ADD COLUMN created_by INTEGER;'
        }
        
        for column, sql in version_migrations.items():
            if column in schema_info['missing_version_columns']:
                migration_steps.append({
                    'table': 'file_versions',
                    'sql': sql,
                    'description': f'Добавление колонки {column}'
                })
        
        # Обновляем существующие версии как baseline
        update_versions_sql = """
            UPDATE file_versions 
            SET version_type = 'baseline'
            WHERE version_type IS NULL OR version_type = '';
        """
        
        migration_steps.append({
            'table': 'file_versions',
            'sql': update_versions_sql,
            'description': 'Обновление существующих версий как baseline'
        })
        
        # Создаем индексы
        index_sqls = [
            "CREATE INDEX IF NOT EXISTS idx_file_versions_type ON file_versions(version_type);",
            "CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON file_versions(file_id);"
        ]
        
        for sql in index_sqls:
            migration_steps.append({
                'table': 'file_versions',
                'sql': sql,
                'description': 'Создание индекса'
            })
        
        return migration_steps
    
    def add_user_relationships(self, dry_run: bool = True) -> list:
        """Добавляет внешние ключи для связей с пользователями"""
        print(f"Добавление связей с пользователями (dry_run={dry_run})...")
        
        migration_steps = []
        
        # Добавляем внешний ключ для created_by в file_versions
        fk_sql = """
            CREATE INDEX IF NOT EXISTS idx_file_versions_created_by 
            ON file_versions(created_by);
        """
        
        migration_steps.append({
            'table': 'file_versions',
            'sql': fk_sql,
            'description': 'Добавление индекса для связи с пользователями'
        })
        
        return migration_steps
    
    def execute_migrations(self, migration_steps: list, dry_run: bool = True) -> dict:
        """Выполняет миграцию"""
        results = {
            'executed': [],
            'errors': [],
            'skipped': []
        }
        
        if dry_run:
            print("РЕЖИМ DRY RUN - изменения не будут применены")
        
        for step in migration_steps:
            try:
                if dry_run:
                    results['skipped'].append(step['description'])
                    print(f"  [SKIP] {step['description']}")
                else:
                    with sqlite3.connect("patients.db") as conn:
                        conn.execute(step['sql'])
                        conn.commit()
                        results['executed'].append(step['description'])
                        print(f"  [OK] {step['description']}")
            except Exception as e:
                error_msg = f"Ошибка при выполнении: {step['description']} - {str(e)}"
                results['errors'].append(error_msg)
                print(f"  [ERROR] {error_msg}")
        
        return results
    
    def run_full_migration(self, dry_run: bool = True) -> dict:
        """Выполняет полную миграцию схемы"""
        print("=== НАЧАЛО МИГРАЦИИ СХЕМЫ БД ===")
        
        # Создаем резервную копию
        print("\n1. Создание резервной копии...")
        backup_path = self.create_backup()
        
        # Проверяем текущую схему
        print("\n2. Анализ текущей схемы...")
        schema_info = self.check_current_schema()
        print(f"Таблицы в БД: {', '.join(schema_info['tables'])}")
        print(f"Таблица files: {'есть' if schema_info['files_table_exists'] else 'нет'}")
        print(f"Таблица file_versions: {'есть' if schema_info['file_versions_table_exists'] else 'нет'}")
        
        # Генерируем план миграции
        print("\n3. План миграции...")
        all_steps = []
        
        if schema_info['files_table_exists']:
            files_steps = self.migrate_files_table(dry_run=True)
            all_steps.extend(files_steps)
            print(f"Шагов для таблицы files: {len(files_steps)}")
        
        if schema_info['file_versions_table_exists']:
            version_steps = self.migrate_file_versions_table(dry_run=True)
            all_steps.extend(version_steps)
            print(f"Шагов для таблицы file_versions: {len(version_steps)}")
        
        user_steps = self.add_user_relationships(dry_run=True)
        all_steps.extend(user_steps)
        print(f"Дополнительных шагов: {len(user_steps)}")
        print(f"Всего шагов миграции: {len(all_steps)}")
        
        # Подтверждение выполнения
        if not dry_run:
            confirm = input(f"\nПрименить {len(all_steps)} изменений к базе данных? (y/N): ")
            if confirm.lower() != 'y':
                print("Миграция отменена пользователем")
                return {'cancelled': True}
        
        # Выполняем миграцию
        print(f"\n4. {'Проверка' if dry_run else 'Выполнение'} миграции...")
        results = self.execute_migrations(all_steps, dry_run)
        
        # Финальная проверка
        print("\n5. Финальная проверка схемы...")
        final_schema = self.check_current_schema()
        
        # Выводим итоги
        print("\n=== ИТОГИ МИГРАЦИИ ===")
        print(f"Резервная копия: {backup_path}")
        print(f"Шагов выполнено: {len(results['executed'])}")
        print(f"Шагов пропущено: {len(results['skipped'])}")
        print(f"Ошибок: {len(results['errors'])}")
        
        if results['errors']:
            print("\nОШИБКИ:")
            for error in results['errors']:
                print(f"  - {error}")
        
        print(f"\nРезервная копия сохранена: {backup_path}")
        
        return {
            'backup_path': backup_path,
            'steps_planned': len(all_steps),
            'steps_executed': len(results['executed']),
            'errors': results['errors'],
            'schema_info': final_schema
        }

def main():
    """Основная функция"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Миграция схемы базы данных для новой системы файлов')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Только показать план миграции без применения изменений')
    parser.add_argument('--force', action='store_true',
                       help='Принудительно выполнить миграцию без подтверждения')
    
    args = parser.parse_args()
    
    migration = DatabaseMigration()
    
    if args.force and not args.dry_run:
        dry_run = False
    else:
        dry_run = args.dry_run
    
    try:
        results = migration.run_full_migration(dry_run)
        
        if not dry_run and not results.get('cancelled'):
            print("\n✅ Миграция схемы успешно завершена!")
        elif dry_run:
            print("\n📋 План миграции готов. Для применения изменений запустите без --dry-run")
        else:
            print("\n❌ Миграция отменена или завершена с ошибками")
            
    except Exception as e:
        print(f"\n💥 Критическая ошибка миграции: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())