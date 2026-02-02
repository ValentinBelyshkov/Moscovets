# Sample Data Seeding Documentation

## Overview
The system now includes functionality to seed the database with sample patient data and medical records. This is useful for development, testing, and demonstration purposes.

## Added Patients
The system now contains 5 sample patients with realistic medical data:

1. **Иванов Иван Иванович** - Male, born 1985-05-15
2. **Петрова Мария Сергеевна** - Female, born 1992-11-22
3. **Сидоров Алексей Михайлович** - Male, born 1978-03-08
4. **Козлова Екатерина Андреевна** - Female, born 1989-07-30
5. **Волков Дмитрий Николаевич** - Male, born 1995-12-10

## Medical Record Types
For each patient, the system creates 6 types of medical records (30 total):

### 1. Цефалометрический анализ (Cephalometry)
- Analysis method: Steiner
- Key measurements: SNA, SNB, ANB angles, facial measurements
- Clinical conclusions and recommendations

### 2. Фотометрический анализ (Photometry)
- Facial proportion measurements
- Frontal and profile photo references
- Lip positioning and facial symmetry analysis

### 3. Биометрический анализ (Biometry)
- 3D CBCT scan data
- Bone measurements: maxilla width, mandible width, ramus height
- Gonial angle and condylar measurements

### 4. КТ анализ (CT Analysis)
- Scan dates and slice thickness
- TMJ condition assessment
- Sinus and airway evaluation
- Bone density measurements

### 5. 3D Моделирование (Modeling)
- Occlusal surface area calculations
- Force distribution analysis
- Bite alignment improvements

### 6. Анамнез (Anamnesis)
- Personal medical history
- Family medical history
- Dental treatment history
- Risk factors and allergies

## Implementation Details

### Files Created:
1. `backend/simple_seed.py` - Direct database seeding script (bypasses pydantic issues)
2. `backend/app/db/seed_sample_data.py` - ORM-based seeding script (for future use when environment is fixed)
3. Updated `backend/app/db/init_db.py` - Added seeding function
4. Updated `backend/app/main.py` - Auto-run seeding on startup
5. `backend/run_seed_data.py` - Standalone seeding script

### Database Integration:
- Creates patients with full medical card information
- Links medical records to patients via foreign keys
- Stores detailed JSON data for each analysis type
- Maintains proper relationships between entities

## Usage

### Direct Database Seeding (Currently Active):
```bash
cd backend
python simple_seed.py
```

### Verification:
To verify the data was added:
```bash
cd backend
python -c "import sqlite3; conn=sqlite3.connect('instance/database.db'); cursor=conn.cursor(); cursor.execute('SELECT COUNT(*) FROM patients'); print(f'Patients in DB: {cursor.fetchone()[0]}'); cursor.execute('SELECT COUNT(*) FROM medical_records'); print(f'Medical records in DB: {cursor.fetchone()[0]}'); conn.close()"
```

## Benefits
- Provides realistic test data for development
- Demonstrates the full functionality of the medical record system
- Enables immediate testing of UI components
- Shows proper integration between patients and their medical records
- Includes various types of medical analyses for comprehensive testing