from app.db.base import Base
from app.db.session import engine
from app.models.user import User
from app.models.patient import Patient
from app.models.medical_record import MedicalRecord
from app.models.file import File
from app.models.document import Document

def init_db():
    # Create all tables, ignoring already existing ones
    Base.metadata.create_all(bind=engine, checkfirst=True)