import sqlite3

def check_db_structure():
    conn = sqlite3.connect('moskovets3d.db')
    cursor = conn.cursor()

    # Check what tables exist
    cursor.execute('SELECT name FROM sqlite_master WHERE type="table";')
    tables = cursor.fetchall()
    print('Tables in database:', [table[0] for table in tables])

    # Check the files table structure if it exists
    if 'files' in [table[0] for table in tables]:
        cursor.execute('PRAGMA table_info(files);')
        columns = cursor.fetchall()
        print('\nFiles table columns:')
        for col in columns:
            print(f'  Name: {col[1]}, Type: {col[2]}, Not Null: {col[3]}, Default: {col[4]}, Primary Key: {col[5]}')
    else:
        print('\nFiles table does not exist')

    conn.close()

if __name__ == "__main__":
    check_db_structure()