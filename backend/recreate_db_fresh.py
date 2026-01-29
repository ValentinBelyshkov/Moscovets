"""
Script to completely recreate the database with fresh schema using PostgreSQL
"""

import os
from sqlalchemy import create_engine
from app.db.base import Base
from app.core.config import settings
from app.db.init_db import init_db
from app.db.session import engine

def recreate_fresh_database():
    """Completely recreate the database with fresh schema"""
    
    print(f"Recreating database at: {settings.DATABASE_URL}")
    
    # Drop all tables
    print("Dropping all existing tables...")
    Base.metadata.drop_all(bind=engine)
    
    # Create fresh database with proper schema
    print("Creating fresh database with proper schema...")
    
    # Create all tables from models
    Base.metadata.create_all(bind=engine)
    print("All tables created successfully")
    
    # Initialize with default data
    init_db()
    print("Database initialized with default data")
    
    print('\nDatabase recreation completed successfully!')

if __name__ == "__main__":
    recreate_fresh_database()
