#!/usr/bin/env python3
"""
Script to fix missing columns in the database, specifically addressing the missing 'id' column in the files table.
"""

import os
import sqlite3
from pathlib import Path

def fix_database_schema():
    """Fix the database schema by adding missing columns."""
    
    db_path = Path("moskovets3d.db")
    if not db_path.exists():
        print(f"Database file {db_path} not found.")
        return
    
    print(f"Fixing database schema for {db_path}")
    
    # Connect to the database
    with sqlite3.connect(str(db_path)) as conn:
        cursor = conn.cursor()
        
        # Check if files table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='files';")
        files_table_exists = cursor.fetchone() is not None
        
        if not files_table_exists:
            print("Files table does not exist. Creating it...")
            
            # Create the files table with proper schema
            create_files_table_sql = """
            CREATE TABLE files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                file_type TEXT NOT NULL,
                description TEXT,
                metadata_json TEXT,
                medical_category TEXT,
                study_date DATE,
                body_part TEXT(100),
                image_orientation TEXT(50),
                file_size INTEGER,
                mime_type TEXT(100),
                file_hash TEXT(64),
                is_active BOOLEAN DEFAULT 1 NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
            """
            
            cursor.execute(create_files_table_sql)
            print("Files table created successfully.")
        else:
            # Check if id column exists in files table
            cursor.execute("PRAGMA table_info(files);")
            columns = [col[1] for col in cursor.fetchall()]
            
            if 'id' not in columns:
                print("Missing 'id' column in files table. This is a critical issue.")
                
                # Since SQLite doesn't allow adding a PRIMARY KEY column after table creation,
                # we need to recreate the table with the proper schema
                print("Recreating files table with proper schema...")
                
                # Get all data from the current files table
                cursor.execute("SELECT * FROM files;")
                rows = cursor.fetchall()
                
                # Get column info to preserve existing data
                cursor.execute("PRAGMA table_info(files);")
                existing_columns = [col[1] for col in cursor.fetchall()]
                
                # Drop the old table
                cursor.execute("DROP TABLE files;")
                
                # Create the new table with proper schema
                create_files_table_sql = """
                CREATE TABLE files (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    patient_id INTEGER NOT NULL,
                    file_path TEXT NOT NULL,
                    file_type TEXT NOT NULL,
                    description TEXT,
                    metadata_json TEXT,
                    medical_category TEXT,
                    study_date DATE,
                    body_part TEXT(100),
                    image_orientation TEXT(50),
                    file_size INTEGER,
                    mime_type TEXT(100),
                    file_hash TEXT(64),
                    is_active BOOLEAN DEFAULT 1 NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
                """
                
                cursor.execute(create_files_table_sql)
                
                # Insert the data back if there were records
                if rows:
                    print(f"Restoring {len(rows)} records to the new files table...")
                    
                    # Prepare INSERT statement based on existing columns
                    # We'll need to map the old column data to the new schema
                    # This is a simplified mapping - in practice, you'd need to handle column differences
                    
                    for row in rows:
                        # For now, we'll insert with default values for new columns
                        # This assumes the old table had fewer columns
                        placeholders = ', '.join(['?' for _ in range(len(row) + 4)])  # Adding placeholders for new columns
                        insert_sql = f"INSERT INTO files (patient_id, file_path, file_type, description, metadata_json, medical_category, study_date, body_part, image_orientation, file_size, mime_type, file_hash, is_active, created_at, updated_at) VALUES ({placeholders[1:]})"
                        
                        # Adjust the row tuple to match new schema (adding default values for missing fields)
                        new_row = row + (1, '2024-01-01 00:00:00', '2024-01-01 00:00:00')  # defaults for is_active, created_at, updated_at
                        cursor.execute(insert_sql, new_row)
                
                print("Files table recreated with proper schema.")
            else:
                print("'id' column exists in files table.")
                
                # Add any other missing columns if needed
                expected_columns = {
                    'id': 'INTEGER PRIMARY KEY AUTOINCREMENT',
                    'patient_id': 'INTEGER NOT NULL',
                    'file_path': 'TEXT NOT NULL',
                    'file_type': 'TEXT NOT NULL',
                    'description': 'TEXT',
                    'metadata_json': 'TEXT',
                    'medical_category': 'TEXT',
                    'study_date': 'DATE',
                    'body_part': 'TEXT(100)',
                    'image_orientation': 'TEXT(50)',
                    'file_size': 'INTEGER',
                    'mime_type': 'TEXT(100)',
                    'file_hash': 'TEXT(64)',
                    'is_active': 'BOOLEAN DEFAULT 1 NOT NULL',
                    'created_at': 'DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL',
                    'updated_at': 'DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL'
                }
                
                for col_name, col_def in expected_columns.items():
                    if col_name not in columns:
                        if col_name == 'id':
                            # Skip id as it's the primary key and can't be added later
                            continue
                        else:
                            print(f"Adding missing column: {col_name}")
                            alter_sql = f"ALTER TABLE files ADD COLUMN {col_name} {col_def.split(' ')[1] if ' ' in col_def else col_def};"
                            cursor.execute(alter_sql)
        
        # Check if file_versions table exists and has proper schema
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='file_versions';")
        versions_table_exists = cursor.fetchone() is not None
        
        if not versions_table_exists:
            print("Creating file_versions table...")
            
            create_versions_table_sql = """
            CREATE TABLE file_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_id INTEGER NOT NULL,
                version_number INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                file_hash TEXT(64),
                file_size INTEGER,
                version_type TEXT DEFAULT 'baseline',
                version_description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                created_by INTEGER,
                FOREIGN KEY (file_id) REFERENCES files(id)
            );
            """
            
            cursor.execute(create_versions_table_sql)
            print("File_versions table created successfully.")
        else:
            # Check for missing columns in file_versions
            cursor.execute("PRAGMA table_info(file_versions);")
            version_columns = [col[1] for col in cursor.fetchall()]
            
            expected_version_columns = {
                'id': 'INTEGER PRIMARY KEY AUTOINCREMENT',
                'file_id': 'INTEGER NOT NULL',
                'version_number': 'INTEGER NOT NULL',
                'file_path': 'TEXT NOT NULL',
                'file_hash': 'TEXT(64)',
                'file_size': 'INTEGER',
                'version_type': 'TEXT DEFAULT "baseline"',
                'version_description': 'TEXT',
                'created_at': 'DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL',
                'created_by': 'INTEGER'
            }
            
            for col_name, col_def in expected_version_columns.items():
                if col_name not in version_columns:
                    if col_name == 'id':
                        continue  # Skip id as primary key
                    else:
                        print(f"Adding missing column to file_versions: {col_name}")
                        alter_sql = f"ALTER TABLE file_versions ADD COLUMN {col_name} {col_def.split(' ')[1] if ' ' in col_def else col_def};"
                        cursor.execute(alter_sql)
        
        # Commit changes
        conn.commit()
        print("Database schema fix completed.")
        
        # Show final table structure
        print("\nFinal files table structure:")
        cursor.execute("PRAGMA table_info(files);")
        for col in cursor.fetchall():
            print(f"  {col[1]} ({col[2]}) - {'PRIMARY KEY' if col[5] else ''}")

if __name__ == "__main__":
    fix_database_schema()