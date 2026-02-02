# Database Seeding Guide

## Overview
This document explains how to populate the database with sample patient data and medical records for testing and development purposes.

## Current Status
- **5 patients** have been successfully added to the database
- **30 medical records** (6 per patient) have been created covering all major analysis types
- Database is located at `backend/instance/database.db`

## Patient Information
The following patients have been added with complete medical records:

| ID | Name                    | Gender | Birth Date  |
|----|-------------------------|--------|-------------|
| 1  | Иванов Иван Иванович    | Male   | 1985-05-15  |
| 2  | Петрова Мария Сергеевна | Female | 1992-11-22  |
| 3  | Сидоров Алексей Михайлович | Male | 1978-03-08  |
| 4  | Козлова Екатерина Андреевна | Female | 1989-07-30 |
| 5  | Волков Дмитрий Николаевич | Male | 1995-12-10  |

## Medical Record Types
Each patient has the following types of medical records:

1. **Cephalometry** - Cephalometric analysis with angular measurements
2. **Photometry** - Photometric facial analysis with proportions
3. **Biometry** - Biometric measurements from 3D scans
4. **CT Analysis** - Computed tomography findings
5. **Modeling** - 3D modeling and simulation results
6. **Anamnesis** - Complete patient history and examination

## How to Verify Data

### Check Patient Count:
```bash
cd backend
python -c "import sqlite3; conn=sqlite3.connect('instance/database.db'); cursor=conn.cursor(); cursor.execute('SELECT COUNT(*) FROM patients'); print(f'Total patients: {cursor.fetchone()[0]}'); conn.close()"
```

### Check Medical Records Count:
```bash
cd backend
python -c "import sqlite3; conn=sqlite3.connect('instance/database.db'); cursor=conn.cursor(); cursor.execute('SELECT COUNT(*) FROM medical_records'); print(f'Total medical records: {cursor.fetchone()[0]}'); conn.close()"
```

### View All Patients:
```bash
cd backend
python -c "import sqlite3; conn=sqlite3.connect('instance/database.db'); cursor=conn.cursor(); cursor.execute('SELECT id, full_name, gender, birth_date FROM patients'); rows=cursor.fetchall(); print('ID\tName\t\t\tGender\tBirth Date'); [print(f'{row[0]}\t{row[1][:20]:<20}\t{row[2]}\t{row[3]}') for row in rows]; conn.close()"
```

### View Patient Records by Type:
```bash
cd backend
python -c "import sqlite3; conn=sqlite3.connect('instance/database.db'); cursor=conn.cursor(); cursor.execute('SELECT record_type, COUNT(*) FROM medical_records GROUP BY record_type'); rows=cursor.fetchall(); print('Record Type\tCount'); [print(f'{row[0]}\t\t{row[1]}') for row in rows]; conn.close()"
```

## Seeding Scripts

### Primary Seeding Script (Direct Database Access):
- File: `backend/simple_seed.py`
- Purpose: Direct insertion into SQLite database
- Used when ORM libraries have compatibility issues

### ORM-Based Seeding Script (Future Use):
- File: `backend/app/db/seed_sample_data.py`
- Purpose: ORM-based data insertion
- Currently not used due to pydantic compatibility issues

## Application Integration
The seeding functionality is integrated into the application startup process in `backend/app/main.py`, so the sample data will be added automatically when the application starts.

## Troubleshooting

### If Database is Empty:
Run the seeding script manually:
```bash
cd backend
python simple_seed.py
```

### If You See Encoding Issues:
The Russian text in the database is stored correctly, but may display incorrectly in certain terminals due to character encoding differences.

### Missing Tables:
If tables don't exist, make sure to run the application once to initialize the database schema before running the seeding script.

## Data Structure

### Patients Table:
- id (Primary Key)
- full_name
- birth_date
- gender
- contact_info
- complaints
- medical_card_number
- address
- emergency_contact

### Medical Records Table:
- id (Primary Key)
- patient_id (Foreign Key)
- record_type
- data (JSON format)
- notes