from sqlalchemy import Column, Integer, String, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from enum import Enum as PyEnum

class UserRole(PyEnum):
    WORKER = "worker"
    ADMINISTRATOR = "administrator"

class UserAccountStatus(PyEnum):
    ACTIVE = "active"
    BLOCKED = "blocked"

class User(Base):
    __tablename__ = "users"
    
    id: int = Column(Integer, primary_key=True, index=True)
    username: str = Column(String, unique=True, index=True, nullable=False)
    email: str = Column(String, unique=True, index=True, nullable=True)
    full_name: str = Column(String, nullable=False)
    hashed_password: str = Column(String, nullable=False)
    role: UserRole = Column(Enum(UserRole, name="user_role"), nullable=False)
    account_status: UserAccountStatus = Column(Enum(UserAccountStatus, name="user_account_status"), nullable=False, default=UserAccountStatus.ACTIVE)
    last_login: DateTime = Column(DateTime(timezone=True), nullable=True)
    created_at: DateTime = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: DateTime = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __init__(self, username: str, email: str, full_name: str, hashed_password: str, role: UserRole, account_status: UserAccountStatus = UserAccountStatus.ACTIVE):
        self.username = username
        self.email = email
        self.full_name = full_name
        self.hashed_password = hashed_password
        self.role = role
        self.account_status = account_status
    
    # Relationships - using string reference to avoid circular imports
    created_file_versions = relationship("FileVersion", back_populates="user", foreign_keys="FileVersion.created_by")