"""
Reset and fix the database schema to resolve the file upload issue
"""

import os
import sys
import sqlite3
from datetime import date

def reset_database():
    """Manually reset the database schema"""
    
    # Define the proper schema for the files table
    files_table_sql = """
    DROP TABLE IF EXISTS files;
    
    CREATE TABLE files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT NOT NULL,
        description TEXT,
        metadata_json TEXT,
        medical_category TEXT,
        study_date DATE,
        body_part TEXT,
        image_orientation TEXT,
        file_size INTEGER,
        mime_type TEXT,
        file_hash TEXT,
        is_active BOOLEAN DEFAULT 1 NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    """
    
    # Define file_versions table
    file_versions_table_sql = """
    DROP TABLE IF EXISTS file_versions;
    
    CREATE TABLE file_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL,
        version_number INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        file_hash TEXT,
        file_size INTEGER,
        version_type TEXT DEFAULT 'baseline',
        version_description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        created_by INTEGER,
        FOREIGN KEY (file_id) REFERENCES files(id)
    );
    """
    
    # Connect to database
    conn = sqlite3.connect('moskovets3d.db')
    cursor = conn.cursor()
    
    # Execute the schema changes
    cursor.executescript(files_table_sql)
    cursor.executescript(file_versions_table_sql)
    
    # Commit and close
    conn.commit()
    conn.close()
    
    print("Database schema reset successfully")
    
    # Verify the schema
    conn = sqlite3.connect('moskovets3d.db')
    cursor = conn.cursor()
    
    cursor.execute('PRAGMA table_info(files);')
    columns = cursor.fetchall()
    print('\nNew files table structure:')
    for col in columns:
        print(f'  {col[1]} ({col[2]}) - PK: {col[5]}')
    
    conn.close()


if __name__ == "__main__":
    reset_database()
    print("Database reset completed!")