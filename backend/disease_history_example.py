"""
Пример получения истории болезни пациента
с использованием предложенной схемы базы данных
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, Date, DateTime, Enum, Boolean, Float, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, date

# Пример SQLAlchemy моделей для демонстрации
Base = declarative_base()

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    birth_date = Column(Date, nullable=False)

class DiseaseHistory(Base):
    __tablename__ = "disease_history"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    record_type = Column(String, nullable=False)  # diagnosis, treatment, measurement, test_result, procedure, note
    event_date = Column(DateTime, nullable=False)
    importance = Column(String, default="normal")  # low, normal, high, critical
    created_at = Column(DateTime, server_default=datetime.now)

class Visit(Base):
    __tablename__ = "visits"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    visit_date = Column(DateTime, nullable=False)
    chief_complaint = Column(Text, nullable=True)
    diagnosis_text = Column(Text, nullable=True)

class Measurement(Base):
    __tablename__ = "measurements"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    measurement_type = Column(String, nullable=False)  # weight, height, blood_pressure, etc.
    value = Column(String, nullable=False)
    unit = Column(String, nullable=True)
    measured_at = Column(DateTime, nullable=False)

class AnalysisModule(Base):
    __tablename__ = "analysis_modules"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    module_type = Column(String, nullable=False)  # cephalometry, ct, biometry, etc.
    module_data = Column(JSON, nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, server_default=datetime.now)


def get_patient_disease_history(session, patient_id: int):
    """
    Получить полную историю болезни пациента
    """
    print(f"=== ИСТОРИЯ БОЛЕЗНИ ПАЦИЕНТА ID: {patient_id} ===\n")
    
    # 1. Получаем основную информацию о пациенте
    patient = session.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        print("Пациент не найден")
        return
    
    print(f"Пациент: {patient.full_name}")
    print(f"Дата рождения: {patient.birth_date}")
    print(f"Возраст: {calculate_age(patient.birth_date)} лет\n")
    
    # 2. Получаем визиты пациента
    visits = session.query(Visit).filter(Visit.patient_id == patient_id).order_by(Visit.visit_date).all()
    print(f"=== ВИЗИТЫ ({len(visits)}) ===")
    
    for visit in visits:
        print(f"📅 {visit.visit_date.strftime('%d.%m.%Y %H:%M')}")
        print(f"   Жалобы: {visit.chief_complaint or 'Не указаны'}")
        print(f"   Диагноз: {visit.diagnosis_text or 'Не указан'}")
        print()
    
    # 3. Получаем измерения
    measurements = session.query(Measurement).filter(Measurement.patient_id == patient_id).order_by(Measurement.measured_at).all()
    print(f"=== ИЗМЕРЕНИЯ ({len(measurements)}) ===")
    
    # Группируем измерения по типам
    measurements_by_type = {}
    for measurement in measurements:
        if measurement.measurement_type not in measurements_by_type:
            measurements_by_type[measurement.measurement_type] = []
        measurements_by_type[measurement.measurement_type].append(measurement)
    
    for measurement_type, measurements_list in measurements_by_type.items():
        print(f"📊 {measurement_type.upper()}:")
        for measurement in measurements_list[-5:]:  # Показываем последние 5
            print(f"   {measurement.measured_at.strftime('%d.%m.%Y')}: {measurement.value} {measurement.unit or ''}")
        print()
    
    # 4. Получаем анализы и модули
    modules = session.query(AnalysisModule).filter(AnalysisModule.patient_id == patient_id).order_by(AnalysisModule.created_at).all()
    print(f"=== АНАЛИЗЫ И МОДУЛИ ({len(modules)}) ===")
    
    for module in modules:
        print(f"🔬 {module.module_type.upper()}")
        print(f"   Статус: {module.status}")
        print(f"   Дата: {module.created_at.strftime('%d.%m.%Y %H:%M')}")
        if module.module_data:
            print(f"   Данные: {str(module.module_data)[:100]}...")
        print()
    
    # 5. Получаем общую хронологию из DiseaseHistory
    history_records = session.query(DiseaseHistory).filter(
        DiseaseHistory.patient_id == patient_id
    ).order_by(DiseaseHistory.event_date).all()
    
    print(f"=== ПОЛНАЯ ХРОНОЛОГИЯ ({len(history_records)}) ===")
    
    current_date = None
    for record in history_records:
        record_date = record.event_date.date()
        if record_date != current_date:
            print(f"\n📆 {record_date.strftime('%d.%m.%Y (%A)')}")
            current_date = record_date
        
        # Выбираем эмодзи по типу записи
        emoji_map = {
            'diagnosis': '🏥',
            'treatment': '💊', 
            'measurement': '📊',
            'test_result': '🔬',
            'procedure': '⚕️',
            'note': '📝'
        }
        
        emoji = emoji_map.get(record.record_type, '📋')
        importance_indicator = "🔥" if record.importance == "critical" else "⚠️" if record.importance == "high" else ""
        
        print(f"  {emoji} {record.title} {importance_indicator}")
        if record.description:
            print(f"     {record.description}")


def calculate_age(birth_date):
    """Вычислить возраст"""
    today = date.today()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


def get_disease_timeline(session, patient_id: int):
    """
    Получить упрощенную временную шкалу болезни
    """
    print(f"\n=== ВРЕМЕННАЯ ШКАЛА БОЛЕЗНИ ===")
    
    # Объединяем все события и сортируем по дате
    all_events = []
    
    # Визиты
    visits = session.query(Visit).filter(Visit.patient_id == patient_id).all()
    for visit in visits:
        all_events.append({
            'date': visit.visit_date,
            'type': 'visit',
            'title': 'Визит к врачу',
            'description': visit.chief_complaint,
            'color': '#4CAF50'
        })
    
    # Измерения
    measurements = session.query(Measurement).filter(Measurement.patient_id == patient_id).all()
    for measurement in measurements:
        all_events.append({
            'date': measurement.measured_at,
            'type': 'measurement',
            'title': f'{measurement.measurement_type}',
            'description': f"{measurement.value} {measurement.unit or ''}",
            'color': '#2196F3'
        })
    
    # Сортируем по дате
    all_events.sort(key=lambda x: x['date'])
    
    for event in all_events[-10:]:  # Показываем последние 10 событий
        print(f"{event['date'].strftime('%d.%m.%Y')} | {event['title']} | {event['description']}")


def get_active_problems(session, patient_id: int):
    """
    Получить список активных проблем пациента
    """
    print(f"\n=== АКТИВНЫЕ ПРОБЛЕМЫ ===")
    
    # Получаем активные диагнозы
    # Это пример - в реальной схеме нужно добавить поле is_active к диагнозам
    visits = session.query(Visit).filter(
        Visit.patient_id == patient_id,
        Visit.diagnosis_text.isnot(None)
    ).order_by(Visit.visit_date.desc()).limit(5).all()
    
    for i, visit in enumerate(visits, 1):
        print(f"{i}. {visit.diagnosis_text}")
        print(f"   Дата: {visit.visit_date.strftime('%d.%m.%Y')}")
        print(f"   Жалобы: {visit.chief_complaint}")
        print()


def get_treatment_summary(session, patient_id: int):
    """
    Получить сводку по лечению
    """
    print(f"\n=== СВОДКА ПО ЛЕЧЕНИЮ ===")
    
    # Группируем визиты по диагнозам
    visits = session.query(Visit).filter(
        Visit.patient_id == patient_id,
        Visit.diagnosis_text.isnot(None)
    ).all()
    
    diagnoses_count = {}
    for visit in visits:
        diagnosis = visit.diagnosis_text
        if diagnosis:
            diagnoses_count[diagnosis] = diagnoses_count.get(diagnosis, 0) + 1
    
    print("Частота диагнозов:")
    for diagnosis, count in sorted(diagnoses_count.items(), key=lambda x: x[1], reverse=True):
        print(f"  • {diagnosis}: {count} раз(а)")
    
    print(f"\nОбщее количество визитов: {len(visits)}")
    
    # Статистика по модулям
    modules = session.query(AnalysisModule).filter(AnalysisModule.patient_id == patient_id).all()
    module_stats = {}
    for module in modules:
        module_type = module.module_type
        module_stats[module_type] = module_stats.get(module_type, 0) + 1
    
    print(f"\nСтатистика анализов:")
    for module_type, count in module_stats.items():
        print(f"  • {module_type}: {count} раз(а)")


# Пример использования
if __name__ == "__main__":
    # Создаем демо-данные
    print("ПРИМЕР РАБОТЫ С ПРЕДЛОЖЕННОЙ СХЕМОЙ МЕДИЦИНСКОЙ CRM")
    print("=" * 60)
    
    print("""
КЛЮЧЕВЫЕ ВОЗМОЖНОСТИ СХЕМЫ:

1. 📊 ПОЛНАЯ ИСТОРИЯ БОЛЕЗНИ
   - DiseaseHistory объединяет все события
   - Хронологическая сортировка
   - Группировка по типам записей

2. 🔗 СВЯЗАННОСТЬ ДАННЫХ
   - Все данные привязаны к пациенту
   - Визиты как центральная точка
   - Врачи отвечают за записи

3. 📈 АНАЛИТИКА
   - Статистика по диагнозам
   - Динамика измерений
   - История изменений

4. 🔬 СПЕЦИАЛИЗИРОВАННЫЕ МОДУЛИ
   - 6 типов анализов
   - История версий
   - Гибкие данные в JSON

5. ⚕️ ЛЕЧЕБНЫЙ ПРОЦЕСС
   - Планы лечения
   - Процедуры
   - Рецепты
   - Отслеживание прогресса

ПРИМЕРЫ ЗАПРОСОВ:

# Получить историю болезни
get_patient_disease_history(session, patient_id)

# Временная шкала
get_disease_timeline(session, patient_id)

# Активные проблемы
get_active_problems(session, patient_id)

# Сводка лечения
get_treatment_summary(session, patient_id)

ПРЕИМУЩЕСТВА ДЛЯ ВРАЧЕЙ:
✅ Всегда видно полную картину
✅ История изменений всех данных
✅ Быстрый доступ к любому этапу лечения
✅ Связь между визитами и результатами
✅ Возможность отслеживания прогресса
""")
