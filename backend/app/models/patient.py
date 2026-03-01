"""
Patient model.
Uses shared enums to avoid duplication.
"""
from sqlalchemy import Column, Integer, String, Date, DateTime, Enum, Text, Float, Boolean
from sqlalchemy.sql import func

from app.db.base import Base
from app.enums import (
    Gender, LocalityType, MaritalStatus, EducationLevel,
    ProfileType, LipPosition, ChinShift
)


class Patient(Base):
    __tablename__ = "patients"
    
    # Основные поля
    id: int = Column(Integer, primary_key=True, index=True)
    full_name: str = Column(String, nullable=False)
    birth_date: Date = Column(Date, nullable=False)
    gender: Gender = Column(Enum(Gender, name="gender"), nullable=False)
    contact_info: str = Column(String, nullable=True)
    
    # Дополнительные поля для медицинской карты
    complaints: str = Column(Text, nullable=True)
    medical_card_number: str = Column(String(50), unique=True, index=True, nullable=True)
    address: str = Column(Text, nullable=True)
    emergency_contact: str = Column(Text, nullable=True)
    insurance_info: str = Column(Text, nullable=True)
    
    # 4. МЕСТО РЕГИСТРАЦИИ
    registration_republic: str = Column(String, nullable=True)
    registration_district: str = Column(String, nullable=True)
    registration_city: str = Column(String, nullable=True)
    registration_settlement: str = Column(String, nullable=True)
    registration_street: str = Column(String, nullable=True)
    registration_house: str = Column(String, nullable=True)
    registration_apartment: str = Column(String, nullable=True)
    registration_phone: str = Column(String, nullable=True)
    
    # 5. МЕСТНОСТЬ
    locality_type: LocalityType = Column(Enum(LocalityType, name="locality_type"), nullable=True)
    
    # 6. СЕМЕЙНОЕ ПОЛОЖЕНИЕ
    marital_status: MaritalStatus = Column(Enum(MaritalStatus, name="marital_status"), nullable=True)
    
    # 7. ОБРАЗОВАНИЕ
    education_level: EducationLevel = Column(Enum(EducationLevel, name="education_level"), nullable=True)
    
    # 19. ОСМОТР ЛИЦА. КЕФАЛОМЕТРИЯ
    cephalometry_zy_zy: float = Column(Float, nullable=True)
    cephalometry_n_me: float = Column(Float, nullable=True)
    cephalometry_n_sn: float = Column(Float, nullable=True)
    face_symmetric: bool = Column(Boolean, nullable=True)
    chin_shift: ChinShift = Column(Enum(ChinShift, name="chin_shift"), nullable=True)
    mental_fold_pronounced: bool = Column(Boolean, nullable=True)
    lips_closed: bool = Column(Boolean, nullable=True)
    gummy_smile: bool = Column(Boolean, nullable=True)
    
    # 19.2. Лицо в профиль
    profile_type: ProfileType = Column(Enum(ProfileType, name="profile_type"), nullable=True)
    upper_lip_position: LipPosition = Column(Enum(LipPosition, name="lip_position"), nullable=True)
    
    # Временные метки
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __init__(self, full_name: str, birth_date: Date, gender: Gender, contact_info: str = "", complaints: str = None, 
                 medical_card_number: str = None, address: str = None, emergency_contact: str = None, 
                 insurance_info: str = None, 
                 registration_republic: str = None, registration_district: str = None, registration_city: str = None,
                 registration_settlement: str = None, registration_street: str = None, registration_house: str = None,
                 registration_apartment: str = None, registration_phone: str = None,
                 locality_type: LocalityType = None, marital_status: MaritalStatus = None, 
                 education_level: EducationLevel = None,
                 cephalometry_zy_zy: float = None, cephalometry_n_me: float = None, cephalometry_n_sn: float = None,
                 face_symmetric: bool = None, chin_shift: ChinShift = None, mental_fold_pronounced: bool = None,
                 lips_closed: bool = None, gummy_smile: bool = None,
                 profile_type: ProfileType = None, upper_lip_position: LipPosition = None,
                 **kwargs):
        self.full_name = full_name
        self.birth_date = birth_date
        self.gender = gender
        self.contact_info = contact_info
        self.complaints = complaints
        self.medical_card_number = medical_card_number
        self.address = address
        self.emergency_contact = emergency_contact
        self.insurance_info = insurance_info
        self.registration_republic = registration_republic
        self.registration_district = registration_district
        self.registration_city = registration_city
        self.registration_settlement = registration_settlement
        self.registration_street = registration_street
        self.registration_house = registration_house
        self.registration_apartment = registration_apartment
        self.registration_phone = registration_phone
        self.locality_type = locality_type
        self.marital_status = marital_status
        self.education_level = education_level
        self.cephalometry_zy_zy = cephalometry_zy_zy
        self.cephalometry_n_me = cephalometry_n_me
        self.cephalometry_n_sn = cephalometry_n_sn
        self.face_symmetric = face_symmetric
        self.chin_shift = chin_shift
        self.mental_fold_pronounced = mental_fold_pronounced
        self.lips_closed = lips_closed
        self.gummy_smile = gummy_smile
        self.profile_type = profile_type
        self.upper_lip_position = upper_lip_position
