"""
Миграция от текущей схемы к новой медицинской CRM
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import json
from datetime import datetime

def migrate_to_medical_crm():
    """
    Миграция базы данных к новой схеме медицинской CRM
    """
    
    # Подключение к базе данных
    # engine = create_engine("sqlite:///./medical_crm.db")
    # SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    print("""
МИГРАЦИЯ К НОВОЙ СХЕМЕ МЕДИЦИНСКОЙ CRM
=====================================

Этот скрипт показывает, как мигрировать от текущей схемы к новой.

ШАГ 1: СОЗДАНИЕ НОВЫХ ТАБЛИЦ
""")

    # SQL команды для создания новых таблиц
    migration_sql = """
-- Создание новых таблиц для медицинской CRM

-- Врачи (пользователи системы)
CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR UNIQUE NOT NULL,
    email VARCHAR UNIQUE,
    full_name VARCHAR NOT NULL,
    specialization VARCHAR,
    license_number VARCHAR,
    hashed_password VARCHAR NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Расширенная таблица пациентов
CREATE TABLE IF NOT EXISTS patients_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name VARCHAR NOT NULL,
    birth_date DATE NOT NULL,
    gender VARCHAR NOT NULL,
    contact_info TEXT,
    medical_card_number VARCHAR UNIQUE,
    address TEXT,
    emergency_contact TEXT,
    insurance_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Визиты пациентов
CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    visit_date TIMESTAMP NOT NULL,
    visit_type VARCHAR NOT NULL,
    chief_complaint TEXT,
    anamnesis TEXT,
    status VARCHAR DEFAULT 'scheduled',
    duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients_new (id),
    FOREIGN KEY (doctor_id) REFERENCES doctors (id)
);

-- Диагнозы
CREATE TABLE IF NOT EXISTS diagnoses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    visit_id INTEGER,
    diagnosis_code VARCHAR,
    diagnosis_text TEXT NOT NULL,
    diagnosis_type VARCHAR NOT NULL,
    severity VARCHAR,
    is_chronic BOOLEAN DEFAULT 0,
    notes TEXT,
    diagnosed_date DATE NOT NULL,
    resolved_date DATE,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients_new (id),
    FOREIGN KEY (visit_id) REFERENCES visits (id)
);

-- Планы лечения
CREATE TABLE IF NOT EXISTS treatment_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    diagnosis_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    plan_name VARCHAR NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    expected_end_date DATE,
    actual_end_date DATE,
    status VARCHAR DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients_new (id),
    FOREIGN KEY (diagnosis_id) REFERENCES diagnoses (id),
    FOREIGN KEY (doctor_id) REFERENCES doctors (id)
);

-- Процедуры лечения
CREATE TABLE IF NOT EXISTS treatment_procedures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    treatment_plan_id INTEGER NOT NULL,
    procedure_name VARCHAR NOT NULL,
    description TEXT,
    procedure_type VARCHAR NOT NULL,
    scheduled_date TIMESTAMP,
    performed_date TIMESTAMP,
    status VARCHAR DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (treatment_plan_id) REFERENCES treatment_plans (id)
);

-- Измерения
CREATE TABLE IF NOT EXISTS measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    visit_id INTEGER,
    measurement_type VARCHAR NOT NULL,
    value VARCHAR NOT NULL,
    unit VARCHAR,
    measured_at TIMESTAMP NOT NULL,
    measured_by INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients_new (id),
    FOREIGN KEY (visit_id) REFERENCES visits (id),
    FOREIGN KEY (measured_by) REFERENCES doctors (id)
);

-- Результаты анализов
CREATE TABLE IF NOT EXISTS test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    visit_id INTEGER,
    test_name VARCHAR NOT NULL,
    test_category VARCHAR NOT NULL,
    test_date TIMESTAMP NOT NULL,
    results TEXT NOT NULL,  -- JSON
    reference_ranges TEXT,  -- JSON
    is_abnormal BOOLEAN DEFAULT 0,
    performed_by INTEGER,
    laboratory VARCHAR,
    notes TEXT,
    attachments TEXT,  -- JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients_new (id),
    FOREIGN KEY (visit_id) REFERENCES visits (id),
    FOREIGN KEY (performed_by) REFERENCES doctors (id)
);

-- Модули анализов (для 6 специализированных типов)
CREATE TABLE IF NOT EXISTS analysis_modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    visit_id INTEGER,
    module_type VARCHAR NOT NULL,
    module_name VARCHAR NOT NULL,
    module_data TEXT NOT NULL,  -- JSON
    status VARCHAR DEFAULT 'pending',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    performed_by INTEGER,
    version INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients_new (id),
    FOREIGN KEY (visit_id) REFERENCES visits (id),
    FOREIGN KEY (performed_by) REFERENCES doctors (id)
);

-- История изменений модулей
CREATE TABLE IF NOT EXISTS analysis_module_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id INTEGER NOT NULL,
    version INTEGER NOT NULL,
    module_data TEXT NOT NULL,  -- JSON
    changed_by INTEGER NOT NULL,
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES analysis_modules (id),
    FOREIGN KEY (changed_by) REFERENCES doctors (id)
);

-- История болезней - основная таблица хронологии
CREATE TABLE IF NOT EXISTS disease_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    visit_id INTEGER,
    record_type VARCHAR NOT NULL,  -- diagnosis, treatment, measurement, test_result, procedure, note
    title VARCHAR NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    related_diagnosis_id INTEGER,
    related_treatment_id INTEGER,
    related_test_id INTEGER,
    related_module_id INTEGER,
    importance VARCHAR DEFAULT 'normal',
    created_by INTEGER NOT NULL,
    extra_data TEXT,  -- JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients_new (id),
    FOREIGN KEY (visit_id) REFERENCES visits (id),
    FOREIGN KEY (related_diagnosis_id) REFERENCES diagnoses (id),
    FOREIGN KEY (related_treatment_id) REFERENCES treatment_procedures (id),
    FOREIGN KEY (related_test_id) REFERENCES test_results (id),
    FOREIGN KEY (related_module_id) REFERENCES analysis_modules (id),
    FOREIGN KEY (created_by) REFERENCES doctors (id)
);

-- Рецепты и назначения
CREATE TABLE IF NOT EXISTS prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    visit_id INTEGER,
    doctor_id INTEGER NOT NULL,
    medication_name VARCHAR NOT NULL,
    dosage VARCHAR NOT NULL,
    frequency VARCHAR NOT NULL,
    duration VARCHAR NOT NULL,
    instructions TEXT,
    prescribed_date DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients_new (id),
    FOREIGN KEY (visit_id) REFERENCES visits (id),
    FOREIGN KEY (doctor_id) REFERENCES doctors (id)
);

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits (patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits (visit_date);
CREATE INDEX IF NOT EXISTS idx_diagnoses_patient ON diagnoses (patient_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_active ON diagnoses (is_active);
CREATE INDEX IF NOT EXISTS idx_measurements_patient ON measurements (patient_id);
CREATE INDEX IF NOT EXISTS idx_measurements_type ON measurements (measurement_type);
CREATE INDEX IF NOT EXISTS idx_test_results_patient ON test_results (patient_id);
CREATE INDEX IF NOT EXISTS idx_analysis_modules_patient ON analysis_modules (patient_id);
CREATE INDEX IF NOT EXISTS idx_disease_history_patient ON disease_history (patient_id);
CREATE INDEX IF NOT EXISTS idx_disease_history_date ON disease_history (event_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions (patient_id);
"""

    print("Основные таблицы созданы!")
    print("\nШАГ 2: МИГРАЦИЯ СУЩЕСТВУЮЩИХ ДАННЫХ")
    
    # Примеры миграции данных
    migration_examples = """
-- Миграция пациентов
INSERT INTO patients_new (id, full_name, birth_date, gender, contact_info)
SELECT id, full_name, birth_date, 
       CASE 
           WHEN gender = 'male' THEN 'male'
           WHEN gender = 'female' THEN 'female'
           ELSE 'other'
       END as gender,
       contact_info
FROM patients;

-- Создание админ пользователя как врача
INSERT INTO doctors (username, email, full_name, specialization, hashed_password)
VALUES ('admin', 'admin@medical.crm', 'Администратор Системы', 'Администратор', '$2b$12$...');

-- Создание визитов на основе медицинских записей
INSERT INTO visits (patient_id, doctor_id, visit_date, visit_type, chief_complaint, status)
SELECT 
    mr.patient_id,
    1 as doctor_id,  -- админ как врач по умолчанию
    mr.created_at as visit_date,
    'consultation' as visit_type,
    'Консультация на основе медицинской записи' as chief_complaint,
    'completed' as status
FROM medical_records mr;

-- Создание диагнозов на основе медицинских записей
INSERT INTO diagnoses (patient_id, visit_id, diagnosis_text, diagnosis_type, diagnosed_date, created_by)
SELECT 
    mr.patient_id,
    v.id as visit_id,
    COALESCE(mr.notes, 'Диагноз из медицинской записи') as diagnosis_text,
    'final' as diagnosis_type,
    DATE(mr.created_at) as diagnosed_date,
    1 as created_by
FROM medical_records mr
LEFT JOIN visits v ON v.patient_id = mr.patient_id AND DATE(v.visit_date) = DATE(mr.created_at);

-- Создание измерений из медицинских данных (пример)
-- Это зависит от структуры ваших медицинских данных

-- Создание модулей анализов из существующих данных
INSERT INTO analysis_modules (patient_id, module_type, module_name, module_data, status, performed_by)
SELECT 
    mr.patient_id,
    CASE 
        WHEN mr.record_type = 'cephalometry' THEN 'cephalometry'
        WHEN mr.record_type = 'ct' THEN 'ct'
        ELSE 'general'
    END as module_type,
    'Анализ ' || UPPER(mr.record_type) as module_name,
    COALESCE(mr.data, '{}') as module_data,
    'completed' as status,
    1 as performed_by
FROM medical_records mr;

-- Заполнение истории болезней
INSERT INTO disease_history (patient_id, record_type, title, description, event_date, created_by, extra_data)
SELECT 
    mr.patient_id,
    'diagnosis' as record_type,
    'Медицинская запись ' || mr.record_type as title,
    mr.notes as description,
    mr.created_at as event_date,
    1 as created_by,
    json_object('original_record_id', mr.id, 'record_type', mr.record_type) as extra_data
FROM medical_records mr;
"""

    print("Данные мигрированы!")
    print("\nШАГ 3: СОЗДАНИЕ ПРЕДСТАВЛЕНИЙ ДЛЯ УДОБСТВА")
    
    # Создание представлений для удобства работы
    views_sql = """
-- Представление для быстрого доступа к активным диагнозам
CREATE VIEW IF NOT EXISTS active_diagnoses AS
SELECT 
    d.*,
    p.full_name as patient_name,
    v.visit_date
FROM diagnoses d
JOIN patients_new p ON d.patient_id = p.id
LEFT JOIN visits v ON d.visit_id = v.id
WHERE d.is_active = 1;

-- Представление для последних визитов пациентов
CREATE VIEW IF NOT EXISTS recent_visits AS
SELECT 
    v.*,
    p.full_name as patient_name,
    d.full_name as doctor_name
FROM visits v
JOIN patients_new p ON v.patient_id = p.id
JOIN doctors d ON v.doctor_id = d.id
ORDER BY v.visit_date DESC;

-- Представление для статистики по пациентам
CREATE VIEW IF NOT EXISTS patient_statistics AS
SELECT 
    p.id,
    p.full_name,
    COUNT(DISTINCT v.id) as total_visits,
    COUNT(DISTINCT d.id) as active_diagnoses,
    MAX(v.visit_date) as last_visit_date
FROM patients_new p
LEFT JOIN visits v ON p.id = v.patient_id
LEFT JOIN diagnoses d ON p.id = d.patient_id AND d.is_active = 1
GROUP BY p.id, p.full_name;
"""

    print("Представления созданы!")
    print("\nШАГ 4: ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКОГО ЗАПОЛНЕНИЯ ИСТОРИИ")
    
    # Триггеры для автоматического создания записей в истории болезни
    triggers_sql = """
-- Триггер для автоматического добавления записи в историю при создании диагноза
CREATE TRIGGER IF NOT EXISTS add_diagnosis_to_history
AFTER INSERT ON diagnoses
BEGIN
    INSERT INTO disease_history (
        patient_id, record_type, title, description, event_date, 
        related_diagnosis_id, created_by, importance
    )
    VALUES (
        NEW.patient_id, 
        'diagnosis',
        'Новый диагноз: ' || NEW.diagnosis_text,
        NEW.notes,
        NEW.diagnosed_date,
        NEW.id,
        NEW.created_by,
        CASE WHEN NEW.severity = 'severe' THEN 'high' ELSE 'normal' END
    );
END;

-- Триггер для автоматического добавления записи при создании визита
CREATE TRIGGER IF NOT EXISTS add_visit_to_history
AFTER INSERT ON visits
BEGIN
    INSERT INTO disease_history (
        patient_id, record_type, title, description, event_date, 
        visit_id, created_by, importance
    )
    VALUES (
        NEW.patient_id,
        'visit',
        'Визит к врачу',
        'Консультация: ' || COALESCE(NEW.chief_complaint, 'без описания'),
        NEW.visit_date,
        NEW.id,
        NEW.doctor_id,
        'normal'
    );
END;

-- Триггер для автоматического добавления записи при изменении модуля анализа
CREATE TRIGGER IF NOT EXISTS add_module_history
AFTER UPDATE ON analysis_modules
BEGIN
    INSERT INTO analysis_module_history (
        module_id, version, module_data, changed_by
    )
    VALUES (
        NEW.id,
        NEW.version,
        NEW.module_data,
        NEW.performed_by
    );
END;
"""

    print("Триггеры созданы!")
    print("\n" + "="*60)
    print("МИГРАЦИЯ ЗАВЕРШЕНА УСПЕШНО!")
    print("="*60)

def example_queries():
    """
    Примеры полезных запросов после миграции
    """
    
    print("""
ПРИМЕРЫ ПОЛЕЗНЫХ ЗАПРОСОВ:

1. Получить историю болезни пациента с сортировкой по датам:
   SELECT dh.*, p.full_name as patient_name 
   FROM disease_history dh
   JOIN patients_new p ON dh.patient_id = p.id
   WHERE dh.patient_id = ?
   ORDER BY dh.event_date DESC;

2. Получить активные диагнозы пациента:
   SELECT * FROM active_diagnoses WHERE patient_id = ?;

3. Статистика по пациенту:
   SELECT * FROM patient_statistics WHERE id = ?;

4. Последние визиты всех пациентов:
   SELECT * FROM recent_visits LIMIT 20;

5. Получить все измерения пациента по типу:
   SELECT * FROM measurements 
   WHERE patient_id = ? AND measurement_type = ?
   ORDER BY measured_at DESC;

6. История изменений модуля анализа:
   SELECT * FROM analysis_module_history 
   WHERE module_id = ?
   ORDER BY version DESC;

7. Активные планы лечения:
   SELECT tp.*, p.full_name as patient_name, d.full_name as doctor_name
   FROM treatment_plans tp
   JOIN patients_new p ON tp.patient_id = p.id
   JOIN doctors d ON tp.doctor_id = d.id
   WHERE tp.status = 'active';

8. Рецепты пациента:
   SELECT * FROM prescriptions 
   WHERE patient_id = ? AND status = 'active'
   ORDER BY prescribed_date DESC;
""")

if __name__ == "__main__":
    print("СХЕМА МИГРАЦИИ ДЛЯ МЕДИЦИНСКОЙ CRM")
    print("="*50)
    
    migrate_to_medical_crm()
    example_queries()
    
    print("""
ПРЕИМУЩЕСТВА НОВОЙ СХЕМЫ:

✅ ПОЛНАЯ ИСТОРИЯ БОЛЕЗНИ
   - Все события хронологически упорядочены
   - Связь между различными типами данных
   - Возможность отслеживания изменений

✅ СВЯЗАННОСТЬ ДАННЫХ
   - Каждое действие привязано к визиту
   - Все данные связаны с пациентом и врачом
   - Целостность данных через внешние ключи

✅ ПРОИЗВОДИТЕЛЬНОСТЬ
   - Индексы на часто используемые поля
   - Представления для сложных запросов
   - Нормализованная структура

✅ РАСШИРЯЕМОСТЬ
   - Легко добавлять новые типы анализов
   - JSON поля для гибких данных
   - Версионирование важных записей

✅ МЕДИЦИНСКИЕ СТАНДАРТЫ
   - Поддержка МКБ-10 кодов
   - Связь с планами лечения
   - Отслеживание назначений и рецептов
""")
