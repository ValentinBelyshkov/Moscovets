"""
Предложение по организации классов для медицинской CRM
с полной историей болезней пациентов
"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, DateTime, Enum, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from enum import Enum as PyEnum


# ==================== ОСНОВНЫЕ СПРАВОЧНИКИ ====================

class Doctor(Base):
    """Врачи - пользователи системы"""
    __tablename__ = "doctors"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=False)
    specialization = Column(String, nullable=True)  # Специализация врача
    license_number = Column(String, nullable=True)  # Номер лицензии
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Patient(Base):
    """Пациенты"""
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    birth_date = Column(Date, nullable=False)
    gender = Column(String, nullable=False)  # male, female, other
    contact_info = Column(Text, nullable=True)
    medical_card_number = Column(String, unique=True, index=True, nullable=True)  # Номер медкарты
    
    # Дополнительная информация
    address = Column(Text, nullable=True)
    emergency_contact = Column(Text, nullable=True)
    insurance_info = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


# ==================== ВИЗИТЫ И ПРИЕМЫ ====================

class Visit(Base):
    """Визиты пациентов к врачам"""
    __tablename__ = "visits"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    
    visit_date = Column(DateTime, nullable=False)
    visit_type = Column(String, nullable=False)  # consultation, follow_up, emergency, etc.
    chief_complaint = Column(Text, nullable=True)  # Основная жалоба
    anamnesis = Column(Text, nullable=True)  # Анамнез
    
    # Статус визита
    status = Column(String, default="scheduled")  # scheduled, in_progress, completed, cancelled
    
    # Время приема
    duration_minutes = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


# ==================== ДИАГНОСТИКА ====================

class Diagnosis(Base):
    """Диагнозы"""
    __tablename__ = "diagnoses"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)  # Может быть вне визита
    
    diagnosis_code = Column(String, nullable=True)  # МКБ-10 или другой код
    diagnosis_text = Column(Text, nullable=False)  # Текст диагноза
    diagnosis_type = Column(String, nullable=False)  # preliminary, final, differential
    
    severity = Column(String, nullable=True)  # mild, moderate, severe
    is_chronic = Column(Boolean, default=False)  # Хроническое заболевание
    notes = Column(Text, nullable=True)
    
    diagnosed_date = Column(Date, nullable=False)
    resolved_date = Column(Date, nullable=True)  # Дата выздоровления
    
    is_active = Column(Boolean, default=True)  # Активный диагноз
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


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


class TreatmentProcedure(Base):
    """Процедуры в рамках плана лечения"""
    __tablename__ = "treatment_procedures"
    
    id = Column(Integer, primary_key=True, index=True)
    treatment_plan_id = Column(Integer, ForeignKey("treatment_plans.id"), nullable=False)
    
    procedure_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    procedure_type = Column(String, nullable=False)  # medication, therapy, surgery, etc.
    
    scheduled_date = Column(DateTime, nullable=True)
    performed_date = Column(DateTime, nullable=True)
    
    status = Column(String, default="scheduled")  # scheduled, performed, cancelled, rescheduled
    
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


# ==================== ИЗМЕРЕНИЯ И АНАЛИЗЫ ====================

class Measurement(Base):
    """Измерения пациентов (вес, давление, температура и т.д.)"""
    __tablename__ = "measurements"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)
    
    measurement_type = Column(String, nullable=False)  # weight, height, blood_pressure, temperature, etc.
    value = Column(String, nullable=False)  # Значение (может быть текстом для сложных измерений)
    unit = Column(String, nullable=True)  # Единица измерения
    
    measured_at = Column(DateTime, nullable=False)
    measured_by = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())


class TestResult(Base):
    """Результаты анализов и тестов"""
    __tablename__ = "test_results"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)
    
    test_name = Column(String, nullable=False)
    test_category = Column(String, nullable=False)  # blood_test, urine_test, imaging, etc.
    test_date = Column(DateTime, nullable=False)
    
    results = Column(JSON, nullable=False)  # Результаты в JSON формате
    reference_ranges = Column(JSON, nullable=True)  # Референсные значения
    is_abnormal = Column(Boolean, default=False)  # Есть ли отклонения от нормы
    
    performed_by = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    laboratory = Column(String, nullable=True)
    
    notes = Column(Text, nullable=True)
    attachments = Column(JSON, nullable=True)  # Ссылки на файлы
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


# ==================== СПЕЦИАЛИЗИРОВАННЫЕ МОДУЛИ ====================

class AnalysisModule(Base):
    """6 специализированных модулей анализов"""
    __tablename__ = "analysis_modules"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)
    
    module_type = Column(String, nullable=False)  # cephalometry, ct, biometry, photometry, modeling, other
    module_name = Column(String, nullable=False)
    
    # Данные модуля в JSON
    module_data = Column(JSON, nullable=False)
    
    # Статус обработки
    status = Column(String, default="pending")  # pending, processing, completed, error
    
    # Временные метки
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    performed_by = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    
    # История изменений
    version = Column(Integer, default=1)
    
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


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


# ==================== ИСТОРИЯ БОЛЕЗНЕЙ ====================

class DiseaseHistory(Base):
    """История болезней пациента - основная таблица для хронологии"""
    __tablename__ = "disease_history"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)
    
    # Тип записи в истории
    record_type = Column(String, nullable=False)  # diagnosis, treatment, measurement, test_result, procedure, note
    
    # Заголовок и описание
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Дата события
    event_date = Column(DateTime, nullable=False)
    
    # Связанные данные
    related_diagnosis_id = Column(Integer, ForeignKey("diagnoses.id"), nullable=True)
    related_treatment_id = Column(Integer, ForeignKey("treatment_procedures.id"), nullable=True)
    related_test_id = Column(Integer, ForeignKey("test_results.id"), nullable=True)
    related_module_id = Column(Integer, ForeignKey("analysis_modules.id"), nullable=True)
    
    # Важность записи
    importance = Column(String, default="normal")  # low, normal, high, critical
    
    # Врач, создавший запись
    created_by = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    
    # Дополнительные данные в JSON
    extra_data = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())


# ==================== РЕЦЕПТЫ И НАЗНАЧЕНИЯ ====================

class Prescription(Base):
    """Рецепты и назначения"""
    __tablename__ = "prescriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    
    medication_name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)  # Дозировка
    frequency = Column(String, nullable=False)  # Частота приема
    duration = Column(String, nullable=False)  # Длительность курса
    
    instructions = Column(Text, nullable=True)
    
    prescribed_date = Column(Date, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    
    status = Column(String, default="active")  # active, completed, cancelled
    
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


# ==================== СВЯЗИ (RELATIONSHIPS) ====================

# Добавляем связи к основным моделям
Patient.doctor_visits = relationship("Visit", back_populates="patient", foreign_keys="Visit.patient_id")
Patient.diagnoses = relationship("Diagnosis", back_populates="patient")
Patient.treatment_plans = relationship("TreatmentPlan", back_populates="patient")
Patient.measurements = relationship("Measurement", back_populates="patient")
Patient.test_results = relationship("TestResult", back_populates="patient")
Patient.analysis_modules = relationship("AnalysisModule", back_populates="patient")
Patient.disease_history = relationship("DiseaseHistory", back_populates="patient")
Patient.prescriptions = relationship("Prescription", back_populates="patient")

Visit.patient = relationship("Patient", foreign_keys=[Visit.patient_id])
Visit.doctor = relationship("Doctor", foreign_keys=[Visit.doctor_id])
Visit.diagnoses = relationship("Diagnosis", back_populates="visit")
Visit.treatments = relationship("TreatmentProcedure", back_populates="visit")
Visit.measurements = relationship("Measurement", back_populates="visit")
Visit.test_results = relationship("TestResult", back_populates="visit")
Visit.analysis_modules = relationship("AnalysisModule", back_populates="visit")

Diagnosis.patient = relationship("Patient", foreign_keys=[Diagnosis.patient_id])
Diagnosis.visit = relationship("Visit", foreign_keys=[Diagnosis.visit_id])
Diagnosis.treatment_plans = relationship("TreatmentPlan", back_populates="diagnosis")

TreatmentPlan.patient = relationship("Patient", foreign_keys=[TreatmentPlan.patient_id])
TreatmentPlan.diagnosis = relationship("Diagnosis", foreign_keys=[TreatmentPlan.diagnosis_id])
TreatmentPlan.doctor = relationship("Doctor", foreign_keys=[TreatmentPlan.doctor_id])
TreatmentPlan.procedures = relationship("TreatmentProcedure", back_populates="treatment_plan")

TreatmentProcedure.treatment_plan = relationship("TreatmentPlan", foreign_keys=[TreatmentProcedure.treatment_plan_id])
TreatmentProcedure.visit = relationship("Visit", foreign_keys=[TreatmentProcedure.visit_id])

Measurement.patient = relationship("Patient", foreign_keys=[Measurement.patient_id])
Measurement.visit = relationship("Visit", foreign_keys=[Measurement.visit_id])
Measurement.doctor = relationship("Doctor", foreign_keys=[Measurement.measured_by])

TestResult.patient = relationship("Patient", foreign_keys=[TestResult.patient_id])
TestResult.visit = relationship("Visit", foreign_keys=[TestResult.visit_id])
TestResult.doctor = relationship("Doctor", foreign_keys=[TestResult.performed_by])

AnalysisModule.patient = relationship("Patient", foreign_keys=[AnalysisModule.patient_id])
AnalysisModule.visit = relationship("Visit", foreign_keys=[AnalysisModule.visit_id])
AnalysisModule.doctor = relationship("Doctor", foreign_keys=[AnalysisModule.performed_by])
AnalysisModule.history = relationship("AnalysisModuleHistory", back_populates="module")

AnalysisModuleHistory.module = relationship("AnalysisModule", back_populates="history")

DiseaseHistory.patient = relationship("Patient", foreign_keys=[DiseaseHistory.patient_id])
DiseaseHistory.visit = relationship("Visit", foreign_keys=[DiseaseHistory.visit_id])
DiseaseHistory.diagnosis = relationship("Diagnosis", foreign_keys=[DiseaseHistory.related_diagnosis_id])
DiseaseHistory.treatment = relationship("TreatmentProcedure", foreign_keys=[DiseaseHistory.related_treatment_id])
DiseaseHistory.test = relationship("TestResult", foreign_keys=[DiseaseHistory.related_test_id])
DiseaseHistory.module = relationship("AnalysisModule", foreign_keys=[DiseaseHistory.related_module_id])
DiseaseHistory.doctor = relationship("Doctor", foreign_keys=[DiseaseHistory.created_by])

Prescription.patient = relationship("Patient", foreign_keys=[Prescription.patient_id])
Prescription.visit = relationship("Visit", foreign_keys=[Prescription.visit_id])
Prescription.doctor = relationship("Doctor", foreign_keys=[Prescription.doctor_id])


print("""
ПРЕДЛОЖЕНИЕ ПО ОРГАНИЗАЦИИ МЕДИЦИНСКОЙ CRM

Основные принципы:
1. Полная история болезней через таблицу DiseaseHistory
2. Связанность всех данных через Visit (визиты)
3. Версионирование важных данных (AnalysisModuleHistory)
4. Гибкость для различных типов анализов

Ключевые преимущества:
✅ Полная хронология событий
✅ Связь всех данных с визитами и врачами
✅ История изменений всех важных данных
✅ Гибкая структура для 6 модулей анализов
✅ Возможность отслеживания прогресса лечения
✅ Нормализация данных для отчетности

Для получения истории болезни пациента:
- Сортируем DiseaseHistory по event_date
- Группируем по связанным данным
- Показываем хронологию диагнозов, лечений, анализов
""")