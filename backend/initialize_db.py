#!/usr/bin/env python3
"""
Script to initialize the database and ensure default users are created
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from app.db.init_db import init_db
from app.db.seed_sample_data import seed_sample_data
from app.db.session import SessionLocal

def main():
    print("Initializing database...")
    init_db()
    print("Database initialized successfully")
    
    print("Seeding sample data...")
    db = SessionLocal()
    try:
        seed_sample_data(db)
        print("Sample data seeded successfully")
    finally:
        db.close()
    
    print("Database setup completed!")

if __name__ == "__main__":
    main()