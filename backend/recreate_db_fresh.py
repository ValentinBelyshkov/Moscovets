"""
Script to completely recreate the database with fresh schema
"""

import os
import sqlite3
from sqlalchemy import create_engine
from app.db.base import Base
from app.core.config import settings
from app.db.init_db import init_db

def recreate_fresh_database():
    """Completely recreate the database with fresh schema"""
    
    # Remove the existing database file
    db_path = "moskovets3d.db"
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Removed existing database: {db_path}")
    
    # Create fresh database with proper schema
    print("Creating fresh database with proper schema...")
    
    # Create engine and initialize database
    engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
    
    # Create all tables from models
    Base.metadata.create_all(bind=engine)
    print("All tables created successfully")
    
    # Initialize with default data
    init_db()
    print("Database initialized with default data")
    
    # Verify the schema
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check files table
    cursor.execute('PRAGMA table_info(files);')
    columns = cursor.fetchall()
    print('\nFiles table columns after recreation:')
    for col in columns:
        print(f'  Name: {col[1]}, Type: {col[2]}, Not Null: {col[3]}, Default: {col[4]}, Primary Key: {col[5]}')
    
    conn.close()
    print(f'\nFresh database created: {db_path}')

if __name__ == "__main__":
    recreate_fresh_database()
    print("Database recreation completed successfully!")