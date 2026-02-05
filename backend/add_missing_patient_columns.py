#!/usr/bin/env python3
"""
Script to add missing columns to the patients table based on the Patient model definition
"""

import sys
import os
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker

# Add the backend directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine
from app.models.patient import Patient
from app.db.base import Base

def get_missing_columns():
    """Get columns that exist in the Patient model but not in the database table."""
    
    inspector = inspect(engine)
    
    # Get existing columns in the database table
    existing_columns = [col['name'] for col in inspector.get_columns('patients')]
    
    # Get expected columns from the model
    expected_columns = []
    for column in Patient.__table__.columns:
        expected_columns.append(column.name)
    
    # Find missing columns
    missing_columns = [col for col in expected_columns if col not in existing_columns]
    
    return missing_columns, existing_columns, expected_columns

def generate_add_column_sql(column_name):
    """Generate SQL to add a column based on its definition in the model."""
    
    column_obj = Patient.__table__.columns[column_name]
    column_type = column_obj.type
    
    # Map SQLAlchemy types to PostgreSQL/SQLite types
    if hasattr(column_type, '__visit_name__'):
        type_name = column_type.__visit_name__
        
        if type_name == 'INTEGER':
            sql_type = 'INTEGER'
        elif type_name == 'VARCHAR':
            length = getattr(column_type, 'length', None)
            sql_type = f'VARCHAR({length})' if length else 'VARCHAR'
        elif type_name == 'TEXT':
            sql_type = 'TEXT'
        elif type_name == 'DATE':
            sql_type = 'DATE'
        elif type_name == 'DATETIME':
            sql_type = 'TIMESTAMP'
        elif type_name == 'FLOAT':
            sql_type = 'REAL'
        elif type_name == 'BOOLEAN':
            sql_type = 'BOOLEAN'
        elif type_name == 'ENUM':
            # For ENUM types, we need to create the enum and use it
            enum_name = f"{column_name}_enum"
            return f"ALTER TABLE patients ADD COLUMN {column_name} VARCHAR;"
        else:
            sql_type = str(column_type)
    else:
        sql_type = str(column_type)
    
    # Check if nullable
    nullable = "NULL" if column_obj.nullable else "NOT NULL DEFAULT NULL"
    
    return f"ALTER TABLE patients ADD COLUMN {column_name} {sql_type} {nullable};"

def add_missing_columns():
    """Add missing columns to the patients table."""
    
    print(f"Checking database: {engine.url}")
    
    missing_columns, existing_columns, expected_columns = get_missing_columns()
    
    print(f"Existing columns: {existing_columns}")
    print(f"Expected columns: {expected_columns}")
    print(f"Missing columns: {missing_columns}")
    
    if not missing_columns:
        print("No missing columns found. Database schema is up to date.")
        return
    
    print(f"\nAdding {len(missing_columns)} missing columns...")
    
    for column_name in missing_columns:
        try:
            sql = generate_add_column_sql(column_name)
            print(f"Executing: {sql}")
            
            with engine.connect() as conn:
                # Execute the ALTER TABLE statement
                conn.execute(text(sql))
                conn.commit()
                
            print(f"[SUCCESS] Added column: {column_name}")
        except Exception as e:
            print(f"[ERROR] Error adding column {column_name}: {str(e)}")
            # Continue with other columns even if one fails
    
    print(f"\nCompleted adding missing columns to patients table.")

def main():
    """Main function to run the script."""
    try:
        add_missing_columns()
        print("\n[SUCCESS] Script completed successfully!")
    except Exception as e:
        print(f"\n[ERROR] Error occurred: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())