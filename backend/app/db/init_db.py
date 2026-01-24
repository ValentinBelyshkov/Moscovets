from app.db.base import Base
from app.db.session import engine
from app.db.session import SessionLocal
from app.models.user import User, UserRole, UserAccountStatus
from app.models.patient import Patient, Gender
from app.models.medical_record import MedicalRecord
from app.models.file import File
from app.models.document import Document
from app.core.security import get_password_hash
from datetime import date, datetime

def init_db():
    # Create all tables, ignoring already existing ones
    Base.metadata.create_all(bind=engine, checkfirst=True)
    
    # Create initial admin user if not exists
    db = SessionLocal()
    try:
        # Check if admin user exists
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@example.com",
                full_name="Администратор",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMINISTRATOR,
                account_status=UserAccountStatus.ACTIVE
            )
            db.add(admin_user)
            db.commit()
            print("Admin user created successfully")
    finally:
        db.close()