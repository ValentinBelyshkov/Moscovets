from sqlalchemy import inspect
from app.db.session import engine

def check_db_structure():
    inspector = inspect(engine)
    
    # Check what tables exist
    tables = inspector.get_table_names()
    print('Tables in database:', tables)
    
    # Check the files table structure if it exists
    if 'files' in tables:
        columns = inspector.get_columns('files')
        print('\nFiles table columns:')
        for col in columns:
            print(f"  Name: {col['name']}, Type: {col['type']}, Nullable: {col['nullable']}, Default: {col['default']}, Primary Key: {col['primary_key']}")
    else:
        print('\nFiles table does not exist')

if __name__ == "__main__":
    check_db_structure()
