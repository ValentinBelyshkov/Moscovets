"""
Shared validators for Pydantic schemas.
Centralizes all validation logic.
"""
from datetime import date, datetime
from typing import Any, Optional, Type


def parse_date(value: Any) -> Optional[date]:
    """Parse value to date object"""
    if value is None:
        return None
    if isinstance(value, date):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        return datetime.strptime(value, '%Y-%m-%d').date()
    return value


def parse_datetime(value: Any) -> Optional[datetime]:
    """Parse value to datetime object"""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return datetime.combine(value, datetime.min.time())
    if isinstance(value, str):
        return datetime.strptime(value, '%Y-%m-%d')
    return value


def validate_positive_int(value: Any) -> Optional[int]:
    """Ensure value is a positive integer"""
    if value is None:
        return None
    return int(value)


def validate_non_negative_int(value: Any) -> Optional[int]:
    """Ensure value is a non-negative integer"""
    if value is None:
        return None
    return int(value)


def validate_float(value: Any, default: float = 0.0) -> float:
    """Ensure value is a float"""
    if value is None:
        return default
    return float(value)
