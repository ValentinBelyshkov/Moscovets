# CT Scan Date Feature Implementation

## Overview
Implemented the ability to upload and organize CT/DICOM files by scan date, with the following features:
1. Files are unpacked to date-specific folders: `storage/patients/patient_{id}/dicom/{dd.mm.yyyy}/`
2. Frontend includes a date picker to select scan date before upload
3. Users can view and select from previously uploaded scan dates

## Backend Changes

### 1. File Storage Service (`backend/app/services/file_storage_service.py`)
- Modified `generate_file_path()` method to include study date in the path for DICOM and CT files
- Date format in path: `dd.mm.yyyy` (e.g., `25.01.2026`)
- Structure: `storage/patients/patient_{id}/dicom/{dd.mm.yyyy}/{filename}`

### 2. New CT Endpoint (`backend/app/api/v1/endpoints/ct.py`)
Created new endpoint with three main functions:

- **POST `/api/v1/ct/upload-archive`**
  - Accepts ZIP archive, patient_id, scan_date (YYYY-MM-DD), and optional description
  - Extracts DICOM files from ZIP archive
  - Saves files to date-specific folder structure
  - Creates database records for each file
  - Returns file information including storage path

- **GET `/api/v1/ct/patient/{patient_id}/scan-dates`**
  - Returns list of unique scan dates for a patient's CT files
  - Sorted by date (newest first)

- **GET `/api/v1/ct/patient/{patient_id}/files-by-date/{scan_date}`**
  - Returns all CT files for a specific patient and scan date
  - Useful for loading previously uploaded scans

### 3. API Router (`backend/app/api/v1/api.py`)
- Added CT router: `api_router.include_router(ct.router, prefix="/ct", tags=["ct"])`

### 4. Configuration (`backend/app/core/config.py`)
- Added `STORAGE_PATH` configuration setting

## Frontend Changes

### 1. CT Service (`frontend/src/services/ctService.js`)
New service for CT API operations:
- `uploadCTArchive()` - Upload ZIP archive with scan date
- `getPatientScanDates()` - Get all scan dates for a patient
- `getPatientFilesByDate()` - Get files for specific scan date
- `downloadFile()` - Download file by ID
- `getFileUrl()` - Get file URL for preview/download

### 2. CT Scan Date Selector (`frontend/src/components/ct/CTScanDateSelector.js`)
New component that:
- Displays list of existing scan dates for the patient
- Allows selection of a previously uploaded scan date
- Loads files when a date is selected
- Shows loading states and error handling

### 3. Archive Upload Component (`frontend/src/components/ArchiveUpload.js`)
Enhanced with new features:
- Added props: `patientId`, `scanDate`, `enableBackendUpload`
- Supports both local storage (existing) and backend API (new) modes
- When `enableBackendUpload` is true and `scanDate` is provided, uses backend CT service
- Validates scan date is provided when using backend mode

### 4. CT State (`frontend/src/components/ct/useCTState.js`)
Added new state fields:
- `patientId` - ID of the current patient (default: 1)
- `scanDate` - Selected scan date for upload/selection
- `storagePath` - Path where files are stored (returned from backend)

### 5. CT Handlers (`frontend/src/components/ct/useCTHandlers.js`)
New and updated handlers:
- `handleScanDateSelect()` - Loads files for selected scan date from backend
- Updated `handleArchiveUploadSuccess()` - Handles scan_date and storage_path from backend
- Displays storage path in success message

### 6. CT Module (`frontend/src/components/ct/CTModuleRefactored.js`)
UI enhancements:
- Added "Дата сканирования" (Scan Date) input field with date picker
- Shows preview of storage path based on selected date
- Integrated CTScanDateSelector component
- Passes scan date and patient ID to ArchiveUpload
- Displays storage path after successful upload

## Usage Flow

### Uploading New CT Scan
1. Navigate to `/ct` route
2. Select patient (currently hardcoded to patient_1)
3. Choose "Дата сканирования" (Scan Date) from date picker
4. See the expected storage path displayed: `storage/patients/patient_1/dicom/{dd.mm.yyyy}`
5. Drag & drop or select a ZIP archive containing DICOM files
6. Click "Распаковать и загрузить"
7. Files are extracted and saved to the date-specific folder
8. Success message shows the storage path

### Viewing Existing Scans
1. Navigate to `/ct` route
2. See "История сканирований КТ" (CT Scan History) section
3. Dropdown shows all previously uploaded scan dates
4. Select a date to load those files
5. Files are loaded and ready for plane assignment and viewing

## Storage Structure

```
storage/
└── patients/
    └── patient_1/
        └── dicom/
            ├── 25.01.2026/
            │   ├── file1.dcm
            │   ├── file2.dcm
            │   └── ...
            ├── 10.02.2026/
            │   └── ...
            └── ...
```

## Example

If user uploads CT scan with date `2026-01-25`:
- Storage path: `storage/patients/patient_1/dicom/25.01.2026/`
- Database records created for each DICOM file
- Frontend displays path as `patients/patient_1/dicom/25.01.2026`
- Files are accessible via `/api/v1/files/download/{file_id}`

## Testing

To test the feature:
1. Start the backend and frontend services
2. Login to the application
3. Navigate to `/ct`
4. Select a scan date (e.g., 2026-01-25)
5. Upload a ZIP archive containing DICOM files
6. Verify files are saved to the correct date folder
7. Check that the scan date appears in the history selector
8. Select the date to verify files can be loaded

## Notes

- The patient ID is currently hardcoded to 1 in the frontend
- In a production system, the patient ID should come from the patient selection/context
- The date format in the file system uses Russian format (dd.mm.yyyy) as requested
- The API expects YYYY-MM-DD format for scan_date input
- File names are generated with UUID to ensure uniqueness
- All file uploads are protected by JWT authentication
- ZIP files are validated for format and size limits (500MB max)
