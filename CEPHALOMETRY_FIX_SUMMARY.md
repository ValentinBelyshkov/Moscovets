# Fix for Cephalometry Photo Loading Issue

## Problem
Photos from the patient's panoramic folder (`storage/patients/patient_1/panoramics`) were not loading when accessing `http://localhost:3001/cephalometry`.

## Root Cause
The cephalometry module was not integrated with the patient's file storage system:
1. No patient ID parameter in the route
2. No automatic loading of existing panoramic photos
3. No integration with the file library to select patient photos
4. File model was missing the filename field

## Solution Implemented

### Frontend Changes

#### 1. Route Support for Patient ID (`frontend/src/App.js`)
- Added route `/cephalometry/:id` to support accessing cephalometry with a specific patient

#### 2. Cephalometry Module Refactor (`frontend/src/components/cephalometry/CephalometryModuleRefactored.js`)
- Added `useParams` to extract patient ID from URL
- Pass patient ID to `usePatientNavigation` hook
- Added `useData` hook to access current patient information
- Auto-load panoramic photos when patient ID is provided:
  - Fetches files via `/api/v1/files/patient/{id}/files?file_type=panoramic`
  - Downloads first panoramic photo for lateral projection
- Added button to select photos from file library
- Updated patient name when currentPatient changes
- Modified `handleLoadImageFromDatabase` to accept projection type parameter

#### 3. Image Handlers Update (`frontend/src/components/cephalometry/useCephalometryImageHandlers.js`)
- Updated `handleLoadImageFromDatabase` to accept optional `projectionType` parameter
- Sets projection type when loading image from database

#### 4. File Library Enhancement (`frontend/src/components/FileLibrary.js`)
- Added `patientId` and `fileType` props
- Updated `loadFiles` to:
  - Use API when patientId is provided
  - Filter by file_type (panoramic)
  - Fallback to local storage when no patientId
- Updated `handleDownload` to use API when patientId is provided
- Fixed column name mapping (created_at instead of uploaded_at)

#### 5. Patient Card Navigation Update (`frontend/src/components/patientcard/PatientCardRefactored.js`)
- Modified `navigateToModule` to include patient ID in route when available
- Ensures navigation passes patient context to modules

### Backend Changes

#### 1. File Model Enhancement (`backend/app/models/file.py`)
- Added `name` field to store original filename
- Field is VARCHAR(255) and required

#### 2. File Schema Update (`backend/app/schemas/file.py`)
- Added `name` field to `FileBase` schema
- Ensures filename is included in API responses

#### 3. CRUD Update (`backend/app/crud/crud_file.py`)
- Updated `create_with_version` to store filename in database
- Includes `name=obj_in.name` when creating file records

#### 4. Upload Endpoint Update (`backend/app/api/v1/endpoints/files.py`)
- Passes `name=file.filename` when creating file records
- Preserves original filename in database

#### 5. Migration Script (`backend/add_name_column_to_files.py`)
- Created script to add `name` column to existing files table
- Updates existing records with filenames from file_path
- Safe migration that only adds column if it doesn't exist

## How It Works Now

1. **Access with Patient ID**: Navigate to `/cephalometry/1` (where 1 is the patient ID)

2. **Patient Data Loading**: The module automatically loads patient information via `usePatientNavigation`

3. **Auto-Load Panoramic Photos**:
   - Fetches files from `/api/v1/files/patient/{patientId}/files?file_type=panoramic`
   - Downloads the first panoramic photo
   - Displays it for lateral cephalometric analysis

4. **Manual Photo Selection**: Users can click "Выбрать фото из файла пациента" button to:
   - Open FileLibrary filtered by panoramic files
   - Select any existing panoramic photo for analysis

5. **Photo Upload**: Users can still upload new photos via the existing upload interface

## Required Actions

### Database Migration
Run the migration script to add the `name` column:
```bash
cd backend
python add_name_column_to_files.py
```

### Backend Restart
Restart the backend server to apply schema changes:
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Testing
1. Navigate to patient list and select a patient with panoramic photos
2. Click on the Cephalometry module
3. Verify that panoramic photos are automatically loaded
4. Test manual photo selection from file library
5. Verify photo upload still works

## Notes

- The module maintains backward compatibility - works with and without patient ID
- Existing upload functionality remains unchanged
- FileLibrary works in two modes:
  - With patientId: Uses API to fetch patient files
  - Without patientId: Uses localStorage for demo/development
