"""
File management endpoints.
Aggregates all file-related endpoints.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import files_basic, files_upload, files_version, files_patient

router = APIRouter()

# Include all sub-routers
router.include_router(files_basic.router, tags=["files-basic"])
router.include_router(files_upload.router, tags=["files-upload"])
router.include_router(files_version.router, tags=["files-versions"])
router.include_router(files_patient.router, tags=["files-patient"])


def get_file_type(content_type: str) -> str:
    """Determine file type based on content type."""
    if content_type.startswith("image/"):
        return "image"
    elif content_type == "application/pdf":
        return "pdf"
    elif content_type in ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        return "document"
    else:
        return "other"
