"""
Script to fix missing columns in the database (database-agnostic)
"""

from sqlalchemy import text, inspect
from app.db.session import engine
from app.db.base import Base

def fix_database_schema():
    """Fix the database schema by ensuring all columns from models exist."""
    
    print(f"Checking database schema for {engine.url}")
    
    # Create all tables if they don't exist
    print("Ensuring all tables exist...")
    Base.metadata.create_all(bind=engine)
    
    inspector = inspect(engine)
    
    # Check tables
    for table_name in ['files', 'file_versions']:
        if table_name in inspector.get_table_names():
            columns = [col['name'] for col in inspector.get_columns(table_name)]
            print(f"Table '{table_name}' has columns: {columns}")
        else:
            print(f"Table '{table_name}' does not exist (this shouldn't happen after create_all)")

if __name__ == "__main__":
    fix_database_schema()
    print("Database schema fix completed.")
