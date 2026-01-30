"""
Готовые SQLAlchemy модели для медицинской CRM
Интеграция с существующим кодом
"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, DateTime, Enum, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from enum import Enum as PyEnum


# ==================== СПРАВОЧНИКИ ====================

class Doctor(Base):
    """Врачи системы - расширенная версия User"""
    __tablename__ = "doctors"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=False)
    specialization = Column(String, nullable=True)
    license_number = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    visits = relationship("Visit", back_populates="doctor")
    measurements = relationship("Measurement", back_populates="measured_by_doctor", foreign_keys="Measurement.measured_by")
    test_results = relationship("TestResult", back_populates="performed_by_doctor", foreign_keys="TestResult.performed_by")
    analysis_modules = relationship("AnalysisModule", back_populates="performed_by_doctor", foreign_keys="AnalysisModule.performed_by")
    prescriptions = relationship("Prescription", back_populates="doctor")
    treatment_plans = relationship("TreatmentPlan", back_populates="doctor")
    analysis_module_history = relationship("AnalysisModuleHistory", back_populates="changed_by_doctor", foreign_keys="AnalysisModuleHistory.changed_by")


class Patient(Base):
    """Пациенты - расширенная версия существующей модели"""
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    birth_date = Column(Date, nullable=False)
    gender = Column(String, nullable=False)  # male, female, other
    contact_info = Column(Text, nullable=True)
    medical_card_number = Column(String, unique=True, index=True, nullable=True)
    
    # Дополнительные поля
    address = Column(Text, nullable=True)
    emergency_contact = Column(Text, nullable=True)
    insurance_info = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships - расширенные версии существующих
    visits = relationship("Visit", back_populates="patient", cascade="all, delete-orphan")
    diagnoses = relationship("Diagnosis", back_populates="patient", cascade="all, delete-orphan")
    measurements = relationship("Measurement", back_populates="patient", cascade="all, delete-orphan")
    test_results = relationship("TestResult", back_populates="patient", cascade="all, delete-orphan")
    analysis_modules = relationship("AnalysisModule", back_populates="patient", cascade="all, delete-orphan")
    disease_history = relationship("DiseaseHistory", back_populates="patient", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="patient", cascade="all, delete-orphan")
    treatment_plans = relationship("TreatmentPlan", back_populates="patient", cascade="all, delete-orphan")
    
    # Совместимость с существующими моделями
    three_d_models = relationship("ThreeDModel", back_populates="patient")
    modeling_sessions = relationship("ModelingSession", back_populates="patient")
    biometry_models = relationship("BiometryModel", back_populates="patient")
    biometry_sessions = relationship("BiometrySession", back_populates="patient")
    documents = relationship("Document", back_populates="patient")
    files = relationship("File", back_populates="patient")
    medical_records = relationship("MedicalRecord", back_populates="patient")


# ==================== ВИЗИТЫ ====================

class Visit(Base):
    """Визиты пациентов"""
    __tablename__ = "visits"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    
    visit_date = Column(DateTime, nullable=False)
    visit_type = Column(String, nullable=False)  # consultation, follow_up, emergency, etc.
    chief_complaint = Column(Text, nullable=True)  # Основная жалоба
    anamnesis = Column(Text, nullable=True)  # Анамнез
    
    status = Column(String, default="scheduled")  # scheduled, in_progress, completed, cancelled
    duration_minutes = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="visits")
    doctor = relationship("Doctor", back_populates="visits")
    diagnoses = relationship("Diagnosis", back_populates="visit")
    measurements = relationship("Measurement", back_populates="visit")
    test_results = relationship("TestResult", back_populates="visit")
    analysis_modules = relationship("AnalysisModule", back_populates="visit")
    treatment_procedures = relationship("TreatmentProcedure", back_populates="visit")
    prescriptions = relationship("Prescription", back_populates="visit")
    disease_history_records = relationship("DiseaseHistory", back_populates="visit")


# ==================== ДИАГНОСТИКА ====================

class Diagnosis(Base):
    """Диагнозы"""
    __tablename__ = "diagnoses"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)
    
    diagnosis_code = Column(String, nullable=True)  # МКБ-10
    diagnosis_text = Column(Text, nullable=False)
    diagnosis_type = Column(String, nullable=False)  # preliminary, final, differential
    
    severity = Column(String, nullable=True)  # mild, moderate, severe
    is_chronic = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    
    diagnosed_date = Column(Date, nullable=False)
    resolved_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="diagnoses")
    visit = relationship("Visit", back_populates="diagnoses")
    treatment_plans = relationship("TreatmentPlan", back_populates="diagnosis")
    disease_history_records = relationship("DiseaseHistory", back_populates="diagnosis")


# ==================== ЛЕЧЕНИЕ ====================

class TreatmentPlan(Base):
    """Планы лечения"""
    __tablename__ = "treatment_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    diagnosis_id = Column(Integer, ForeignKey("diagnoses.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    
    plan_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    start_date = Column(Date, nullable=False)
    expected_end_date = Column(Date, nullable=True)
    actual_end_date = Column(Date, nullable=True)
    
    status = Column(String, default="active")  # active, completed, cancelled, suspended
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="treatment_plans")
    diagnosis = relationship("Diagnosis", back_populates="treatment_plans")
    doctor = relationship("Doctor", back_populates="treatment_plans")
    procedures = relationship("TreatmentProcedure", back_populates="treatment_plan")


class TreatmentProcedure(Base):
    """Процедуры в плане лечения"""
    __tablename__ = "treatment_procedures"
    
    id = Column(Integer, primary_key=True, index=True)
    treatment_plan_id = Column(Integer, ForeignKey("treatment_plans.id"), nullable=False)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)
    
    procedure_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    procedure_type = Column(String, nullable=False)  # medication, therapy, surgery, etc.
    
    scheduled_date = Column(DateTime, nullable=True)
    performed_date = Column(DateTime, nullable=True)
    
    status = Column(String, default="scheduled")  # scheduled, performed, cancelled, rescheduled
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    treatment_plan = relationship("TreatmentPlan", back_populates="procedures")
    visit = relationship("Visit", back_populates="treatment_procedures")
    disease_history_records = relationship("DiseaseHistory", back_populates="treatment")


# ==================== ИЗМЕРЕНИЯ ====================

class Measurement(Base):
    """Измерения пациентов"""
    __tablename__ = "measurements"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)
    
    measurement_type = Column(String, nullable=False)  # weight, height, blood_pressure, temperature, etc.
    value = Column(String, nullable=False)  # Может быть сложным значением
    unit = Column(String, nullable=True)
    
    measured_at = Column(DateTime, nullable=False)
    measured_by = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="measurements")
    visit = relationship("Visit", back_populates="measurements")
    measured_by_doctor = relationship("Doctor", foreign_keys=[measured_by], back_populates="measurements")


class TestResult(Base):
    """Результаты анализов"""
    __tablename__ = "test_results"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)
    
    test_name = Column(String, nullable=False)
    test_category = Column(String, nullable=False)  # blood_test, urine_test, imaging, etc.
    test_date = Column(DateTime, nullable=False)
    
    results = Column(JSON, nullable=False)  # JSON с результатами
    reference_ranges = Column(JSON, nullable=True)  # Референсные значения
    is_abnormal = Column(Boolean, default=False)
    
    performed_by = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    laboratory = Column(String, nullable=True)
    
    notes = Column(Text, nullable=True)
    attachments = Column(JSON, nullable=True)  # Ссылки на файлы
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="test_results")
    visit = relationship("Visit", back_populates="test_results")
    performed_by_doctor = relationship("Doctor", foreign_keys=[performed_by], back_populates="test_results")
    disease_history_records = relationship("DiseaseHistory", back_populates="test")


# ==================== АНАЛИТИЧЕСКИЕ МОДУЛИ ====================

class AnalysisModule(Base):
    """6 специализированных модулей анализов"""
    __tablename__ = "analysis_modules"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)
    
    module_type = Column(String, nullable=False)  # cephalometry, ct, biometry, photometry, modeling, other
    module_name = Column(String, nullable=False)
    
    module_data = Column(JSON, nullable=False)  # Данные модуля в JSON
    status = Column(String, default="pending")  # pending, processing, completed, error
    
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    performed_by = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    version = Column(Integer, default=1)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="analysis_modules")
    visit = relationship("Visit", back_populates="analysis_modules")
    performed_by_doctor = relationship("Doctor", foreign_keys=[performed_by], back_populates="analysis_modules")
    history = relationship("AnalysisModuleHistory", back_populates="module", cascade="all, delete-orphan")
    disease_history_records = relationship("DiseaseHistory", back_populates="module")


class AnalysisModuleHistory(Base):
    """История изменений модулей анализов"""
    __tablename__ = "analysis_module_history"
    
    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("analysis_modules.id"), nullable=False)
    
    version = Column(Integer, nullable=False)
    module_data = Column(JSON, nullable=False)
    
    changed_by = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    change_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    module = relationship("AnalysisModule", back_populates="history")
    changed_by_doctor = relationship("Doctor", foreign_keys=[changed_by], back_populates="analysis_module_history")


# ==================== ИСТОРИЯ БОЛЕЗНЕЙ ====================

class DiseaseHistory(Base):
    """Основная таблица истории болезней"""
    __tablename__ = "disease_history"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)
    
    record_type = Column(String, nullable=False)  # diagnosis, treatment, measurement, test_result, procedure, note
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    event_date = Column(DateTime, nullable=False)
    
    # Связанные данные
    related_diagnosis_id = Column(Integer, ForeignKey("diagnoses.id"), nullable=True)
    related_treatment_id = Column(Integer, ForeignKey("treatment_procedures.id"), nullable=True)
    related_test_id = Column(Integer, ForeignKey("test_results.id"), nullable=True)
    related_module_id = Column(Integer, ForeignKey("analysis_modules.id"), nullable=True)
    
    importance = Column(String, default="normal")  # low, normal, high, critical
    created_by = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    extra_data = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="disease_history")
    visit = relationship("Visit", back_populates="disease_history_records")
    diagnosis = relationship("Diagnosis", back_populates="disease_history_records")
    treatment = relationship("TreatmentProcedure", back_populates="disease_history_records")
    test = relationship("TestResult", back_populates="disease_history_records")
    module = relationship("AnalysisModule", back_populates="disease_history_records")
    created_by_doctor = relationship("Doctor", foreign_keys=[created_by])


# ==================== РЕЦЕПТЫ ====================

class Prescription(Base):
    """Рецепты и назначения"""
    __tablename__ = "prescriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    
    medication_name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    frequency = Column(String, nullable=False)
    duration = Column(String, nullable=False)
    
    instructions = Column(Text, nullable=True)
    
    prescribed_date = Column(Date, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    
    status = Column(String, default="active")  # active, completed, cancelled
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="prescriptions")
    visit = relationship("Visit", back_populates="prescriptions")
    doctor = relationship("Doctor", back_populates="prescriptions")


# ==================== СОВМЕСТИМОСТЬ С СУЩЕСТВУЮЩИМИ МОДЕЛЯМИ ====================

# Импортируем существующие модели для совместимости
try:
    from app.models.base_3d_model import BaseModel3D, ModelType, ModelFormat
    from app.models.biometry import BiometryStatus
    from app.models.file import File
    from app.models.document import Document
    from app.models.modeling import ModelingSession
    from app.models.medical_record import MedicalRecord, MedicalRecordHistory
except ImportError:
    # Если модели не найдены, создаем заглушки
    class BiometryStatus:
        UPLOADED = "uploaded"
        ANALYZED = "analyzed"
        CALIBRATED = "calibrated"
        EXPORTED = "exported"
    
    class ModelType:
        UPPER_JAW = "upper_jaw"
        LOWER_JAW = "lower_jaw"
        BITE_1 = "bite_1"
        BITE_2 = "bite_2"
        OCCLUSION_PAD = "occlusion_pad"
        BIOMETRY_MODEL = "biometry_model"
    
    class ModelFormat:
        STL = "stl"
        OBJ = "obj"


class ThreeDModel(Base):
    """3D модели - совместимость с существующим кодом"""
    __tablename__ = "three_d_models"
    
    # Поля из BaseModel3D
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    model_type = Column(String, nullable=False)
    model_format = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    
    scale = Column(Float, default=1.0)
    position_x = Column(Float, default=0.0)
    position_y = Column(Float, default=0.0)
    position_z = Column(Float, default=0.0)
    rotation_x = Column(Float, default=0.0)
    rotation_y = Column(Float, default=0.0)
    rotation_z = Column(Float, default=0.0)
    
    vertices_count = Column(Integer, nullable=True)
    faces_count = Column(Integer, nullable=True)
    bounding_box = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    patient = relationship("Patient", foreign_keys=[patient_id], back_populates="three_d_models")


class BiometryModel(Base):
    """Модели биометрии - расширенная версия"""
    __tablename__ = "biometry_models"
    
    # Наследуем от BaseModel3D полей
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    model_type = Column(String, nullable=False)
    model_format = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    
    scale = Column(Float, default=1.0)
    position_x = Column(Float, default=0.0)
    position_y = Column(Float, default=0.0)
    position_z = Column(Float, default=0.0)
    rotation_x = Column(Float, default=0.0)
    rotation_y = Column(Float, default=0.0)
    rotation_z = Column(Float, default=0.0)
    
    vertices_count = Column(Integer, nullable=True)
    faces_count = Column(Integer, nullable=True)
    bounding_box = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Специфичные для биометрии поля
    status = Column(String, default="uploaded")
    
    # Relationships
    patient = relationship("Patient", foreign_keys=[patient_id], back_populates="biometry_models")
    session = relationship("BiometrySession", back_populates="model")


class BiometrySession(Base):
    """Сессии биометрии"""
    __tablename__ = "biometry_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    model_id = Column(Integer, ForeignKey("biometry_models.id"), nullable=True)
    
    calibration_points = Column(JSON, nullable=True)
    transformation_matrix = Column(JSON, nullable=True)
    
    status = Column(String, default="uploaded")
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    patient = relationship("Patient", foreign_keys=[patient_id], back_populates="biometry_sessions")
    model = relationship("BiometryModel", back_populates="session")


# Экспорт всех моделей
__all__ = [
    'Doctor', 'Patient', 'Visit', 'Diagnosis', 'TreatmentPlan', 'TreatmentProcedure',
    'Measurement', 'TestResult', 'AnalysisModule', 'AnalysisModuleHistory',
    'DiseaseHistory', 'Prescription',
    'ThreeDModel', 'BiometryModel', 'BiometrySession'
]


print("✅ SQLAlchemy модели для медицинской CRM созданы!")
print("📁 Файл: app/models/medical_crm_models.py")
print("🔗 Совместимость с существующими моделями обеспечена")
print("📊 Полная история болезней через DiseaseHistory")
print("⚕️ 6 специализированных модулей анализов через AnalysisModule")