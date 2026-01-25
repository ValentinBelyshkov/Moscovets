"""
Script to add name column to files table if it doesn't exist
This is a migration script to add the missing name column
"""

import sqlite3
import os

def add_name_column():
    """Add name column to files table if it doesn't exist"""
    
    db_path = os.path.join(os.path.dirname(__file__), "moskovets3d.db")
    if not os.path.exists(db_path):
        print(f"Database not found: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check current columns
    cursor.execute('PRAGMA table_info(files);')
    columns = cursor.fetchall()
    column_names = [col[1] for col in columns]
    
    print(f"Current columns in files table: {column_names}")
    
    # Add name column if it doesn't exist
    if 'name' not in column_names:
        print("Adding 'name' column to files table...")
        cursor.execute('ALTER TABLE files ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT "";')
        conn.commit()
        print("'name' column added successfully")
    else:
        print("'name' column already exists in files table")
    
    # Update existing rows with filenames from file_path
    print("Updating existing records...")
    cursor.execute('UPDATE files SET name = file_path WHERE name = "";')
    updated = cursor.rowcount
    conn.commit()
    print(f"Updated {updated} records")
    
    conn.close()
    print("Migration completed successfully!")

if __name__ == "__main__":
    add_name_column()
