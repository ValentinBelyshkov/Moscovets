# Upload Limits Configuration

## Overview
This document describes the configuration changes made to increase the file upload size limit for CT scans to 500MB.

## Changes Made

### 1. Backend Configuration
- Added `MAX_UPLOAD_SIZE` setting in `app/core/config.py` set to 500MB (524288000 bytes)
- Updated file upload endpoints in `app/api/v1/endpoints/files.py` to validate file sizes against the limit
- Specifically increased limit for CT_SCAN file types to 500MB

### 2. Server Configuration
- Updated `Dockerfile` to include `--limit-max-request-size 524288000` parameter for uvicorn
- Updated `startup.sh` to include the same limit parameter
- Updated `main.py` to include the limit in the uvicorn run configuration

### 3. Frontend Configuration
- Updated `frontend/src/services/archiveService.js` to increase the maximum archive size from 100MB to 500MB
- Changed `maxArchiveSize` variable from 100 * 1024 * 1024 to 500 * 1024 * 1024

### 4. Validation Logic
- Added size validation in the `/upload` endpoint to check for CT scan files specifically
- Added size validation in the `/upload-version/{file_id}` endpoint for general file uploads
- Return HTTP 413 error for files exceeding the size limit with descriptive message

## Technical Details

The upload size limit is enforced at multiple levels:
1. **Server level**: Uvicorn server parameter limits the maximum request size
2. **Application level**: Backend validates file size before processing
3. **Frontend level**: Archive service validates file sizes before upload
4. **Business logic level**: Specific validation for CT scan file types

## Values Used
- 500MB = 500 * 1024 * 1024 = 524,288,000 bytes

## Testing
To verify the changes work correctly:
1. Attempt to upload a file smaller than 500MB (should succeed)
2. Attempt to upload a file larger than 500MB (should fail with 413 error)
3. Verify CT scan files specifically are subject to the 500MB limit