#!/usr/bin/env python3

"""
Script to run the sample data seeding independently
"""

from app.db.seed_sample_data import seed_sample_data
from app.db.session import SessionLocal

def main():
    print("Starting database seeding with sample data...")
    db = SessionLocal()
    try:
        seed_sample_data(db)
        print("Database seeding completed successfully!")
    except Exception as e:
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()