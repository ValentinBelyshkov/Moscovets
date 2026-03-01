"""
Shared utilities for file handling.
Centralizes all file-related utility functions.
"""
import os
import uuid
from pathlib import Path
from typing import Optional


def generate_unique_filename(original_filename: str, prefix: str) -> str:
    """
    Generate unique filename with UUID.
    
    Args:
        original_filename: Original filename
        prefix: Prefix for the filename (e.g., 'model', 'biometry')
    
    Returns:
        Unique filename with original extension
    """
    file_extension = Path(original_filename).suffix
    return f"{prefix}_{uuid.uuid4()}{file_extension}"


def generate_file_path(
    original_filename: str,
    model_type: str,
    subdirectory: str = "3d_models"
) -> str:
    """
    Generate unique file path for 3D model.
    
    Args:
        original_filename: Original filename
        model_type: Type of model (upper_jaw, lower_jaw, etc.)
        subdirectory: Subdirectory for file storage
    
    Returns:
        Full file path
    """
    unique_filename = generate_unique_filename(original_filename, model_type)
    return f"uploads/{subdirectory}/{unique_filename}"


def get_file_size(file_content: bytes) -> int:
    """
    Get file size in bytes.
    
    Args:
        file_content: File content as bytes
    
    Returns:
        File size in bytes
    """
    return len(file_content)


def validate_3d_model_file(filename: str) -> bool:
    """
    Validate if file is a supported 3D model format.
    
    Args:
        filename: Filename to validate
    
    Returns:
        True if file extension is supported
    """
    supported_extensions = ['.stl', '.obj']
    file_extension = Path(filename).suffix.lower()
    return file_extension in supported_extensions


def ensure_directory_exists(file_path: str) -> None:
    """
    Ensure directory exists for file path.
    
    Args:
        file_path: Full file path
    """
    Path(file_path).parent.mkdir(parents=True, exist_ok=True)


def save_file_content(file_path: str, content: bytes) -> None:
    """
    Save file content to disk.
    
    Args:
        file_path: Full file path
        content: File content as bytes
    """
    ensure_directory_exists(file_path)
    with open(file_path, "wb") as f:
        f.write(content)


def get_file_extension(filename: str) -> str:
    """
    Get file extension from filename.
    
    Args:
        filename: Filename
    
    Returns:
        File extension (including dot)
    """
    return Path(filename).suffix.lower()


def get_supported_3d_extensions() -> list:
    """
    Get list of supported 3D model extensions.
    
    Returns:
        List of supported extensions
    """
    return ['.stl', '.obj', '.ply']
