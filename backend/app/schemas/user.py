from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole, UserAccountStatus
from .custom_config import CustomConfig

# Shared properties
class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: str
    role: UserRole
    account_status: UserAccountStatus = UserAccountStatus.ACTIVE

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None

# Properties to return via API
class User(UserBase):
    id: int
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config(CustomConfig):
        from_attributes = True
    class Config(CustomConfig):
        from_attributes = True
    class Config:
        from_attributes = True

# Properties for authentication
class UserLogin(BaseModel):
    username: str
    password: str

# Properties for token
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[int] = None