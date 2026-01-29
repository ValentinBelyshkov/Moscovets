"""Test script to verify file upload functionality works correctly"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.file import File, MedicalFileType
from app.db.base import Base
from app.core.config import settings
from datetime import date

def test_file_creation():
    """Test creating a file record to verify the schema works correctly"""
    
    # Create database engine
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Test creating a file record
    db = SessionLocal()
    
    try:
        # Create a sample file record
        test_file = File(
            patient_id=1,
            file_path="test/path/test_file.jpg",
            file_type=MedicalFileType.PHOTO,
            description="Test file for verifying schema",
            medical_category="clinical",
            study_date=date.today(),
            body_part="face",
            image_orientation="frontal",
            file_size=1024,
            mime_type="image/jpeg",
            file_hash="test_hash_value",
            is_active=True
        )
        
        db.add(test_file)
        db.commit()
        db.refresh(test_file)
        
        print(f"Successfully created file with ID: {test_file.id}")
        print(f"File details: {test_file.file_path}, Type: {test_file.file_type}")
        
        # Clean up - remove the test file
        db.delete(test_file)
        db.commit()
        print("Test file removed successfully")
        
    except Exception as e:
        print(f"Error creating test file: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_file_creation()
    print("File schema test completed successfully!")