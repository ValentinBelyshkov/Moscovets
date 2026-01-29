"""
Script to add name column to files table if it doesn't exist (database-agnostic)
"""

from sqlalchemy import text, inspect
from app.db.session import engine

def add_name_column():
    """Add name column to files table if it doesn't exist"""
    
    inspector = inspect(engine)
    
    # Check current columns
    columns = inspector.get_columns('files')
    column_names = [col['name'] for col in columns]
    
    print(f"Current columns in files table: {column_names}")
    
    # Add name column if it doesn't exist
    if 'name' not in column_names:
        print("Adding 'name' column to files table...")
        with engine.connect() as conn:
            conn.execute(text('ALTER TABLE files ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT ""'))
            conn.commit()
        print("'name' column added successfully")
    else:
        print("'name' column already exists in files table")
    
    # Update existing rows with filenames from file_path
    print("Updating existing records...")
    with engine.connect() as conn:
        # Note: In PostgreSQL, we can use split_part or similar to get filename from path
        # But for simplicity, we'll just copy file_path to name as in the original script
        result = conn.execute(text("UPDATE files SET name = file_path WHERE name = ''"))
        conn.commit()
        print(f"Updated records")
    
    print("Migration completed successfully!")

if __name__ == "__main__":
    add_name_column()
