#!/usr/bin/env python3

"""
Script to seed the database with initial data for testing
"""

import os
import sys
from datetime import date

# Add the parent directory to the path so we can import app modules
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.join(current_dir, '..')
sys.path.insert(0, parent_dir)

# Now we can import the app modules
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.base import Base
from app.models.user import User, UserRole, UserAccountStatus
from app.models.patient import Patient, Gender
from app.core.security import get_password_hash

def seed_db(db: Session):
    # Create admin user
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            email="admin@example.com",
            full_name="Administrator",
            hashed_password=get_password_hash("admin"),
            role=UserRole.ADMINISTRATOR,
            account_status=UserAccountStatus.ACTIVE
        )
        db.add(admin_user)
        print("Created admin user")
    
    # Create test user
    test_user = db.query(User).filter(User.username == "test").first()
    if not test_user:
        test_user = User(
            username="test",
            email="test@example.com",
            full_name="Test User",
            hashed_password=get_password_hash("test"),
            role=UserRole.WORKER,
            account_status=UserAccountStatus.ACTIVE
        )
        db.add(test_user)
        print("Created test user")
    
    # Create test patient
    test_patient = db.query(Patient).filter(Patient.full_name == "John Doe").first()
    if not test_patient:
        test_patient = Patient(
            full_name="John Doe",
            birth_date=date(1990, 1, 1),
            gender=Gender.MALE,
            contact_info="john.doe@example.com"
        )
        db.add(test_patient)
        print("Created test patient")
    
    db.commit()
    print("Database seeding completed")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()