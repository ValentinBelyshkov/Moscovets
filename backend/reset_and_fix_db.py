"""
Reset and fix the database schema using SQLAlchemy (database-agnostic)
"""

from sqlalchemy import text
from app.db.base import Base
from app.db.session import engine
from app.models.file import File, FileVersion

def reset_database():
    """Reset the database schema for files and file_versions"""
    
    print("Resetting database schema for files...")
    
    # In SQLAlchemy, we can't easily drop just two tables through Base.metadata
    # but we can do it manually through the engine
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS file_versions CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS files CASCADE"))
        conn.commit()
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    print("Database schema reset successfully")

if __name__ == "__main__":
    reset_database()
    print("Database reset completed!")
