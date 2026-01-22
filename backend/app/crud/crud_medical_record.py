from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.medical_record import MedicalRecord, MedicalRecordHistory
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordUpdate, MedicalRecordHistoryCreate

class CRUDMedicalRecord(CRUDBase[MedicalRecord, MedicalRecordCreate, MedicalRecordUpdate]):
    def update_with_history(self, db: Session, *, db_obj: MedicalRecord, obj_in: MedicalRecordUpdate, updated_by: str = None) -> MedicalRecord:
        # Сохраняем текущие данные в историю перед обновлением
        history_entry = MedicalRecordHistory(
            medical_record_id=db_obj.id,
            data=db_obj.data,
            notes=db_obj.notes,
            updated_by=updated_by
        )
        db.add(history_entry)
        
        # Обновляем запись
        updated_record = super().update(db, db_obj=db_obj, obj_in=obj_in)
        return updated_record
    
    def get_with_history(self, db: Session, *, id: int) -> MedicalRecord:
        record = db.query(MedicalRecord).filter(MedicalRecord.id == id).first()
        if record:
            record.history = db.query(MedicalRecordHistory).filter(MedicalRecordHistory.medical_record_id == id).order_by(MedicalRecordHistory.created_at).all()
        return record

medical_record = CRUDMedicalRecord(MedicalRecord)