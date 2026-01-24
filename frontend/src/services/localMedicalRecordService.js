// Локальный сервис для работы с медицинскими записями через localStorage
class LocalMedicalRecordService {
  constructor() {
    this.storageKey = 'moskovets3d_medical_records';
    this.initializeStorage();
  }

  // Инициализация хранилища
  initializeStorage() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
  }

  // Получение списка записей из localStorage
  getRecordsFromStorage() {
    try {
      const records = localStorage.getItem(this.storageKey);
      return records ? JSON.parse(records) : [];
    } catch (error) {
      console.error('Error reading records from localStorage:', error);
      return [];
    }
  }

  // Сохранение списка записей в localStorage
  saveRecordsToStorage(records) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(records));
    } catch (error) {
      console.error('Error saving records to localStorage:', error);
      throw new Error('Не удалось сохранить записи в локальное хранилище');
    }
  }

  // Генерация уникального ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  // Создание новой медицинской записи
  async createMedicalRecord(recordData) {
    try {
      const records = this.getRecordsFromStorage();
      
      const newRecord = {
        id: this.generateId(),
        ...recordData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      records.push(newRecord);
      this.saveRecordsToStorage(records);
      
      console.log('Medical record created successfully:', newRecord);
      return newRecord;
    } catch (error) {
      console.error('Error creating medical record:', error);
      throw new Error('Ошибка при создании медицинской записи: ' + error.message);
    }
  }

  // Получение списка медицинских записей
  async getMedicalRecords(skip = 0, limit = 100) {
    try {
      const records = this.getRecordsFromStorage();
      const result = records.slice(skip, skip + limit);
      console.log('Medical records fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('Error fetching medical records:', error);
      throw new Error('Ошибка при получении списка медицинских записей: ' + error.message);
    }
  }

  // Получение медицинской записи по ID
  async getMedicalRecordById(id) {
    try {
      const records = this.getRecordsFromStorage();
      const record = records.find(r => r.id === id);
      
      if (!record) {
        throw new Error('Медицинская запись не найдена');
      }
      
      console.log('Medical record fetched successfully:', record);
      return record;
    } catch (error) {
      console.error('Error fetching medical record:', error);
      throw new Error('Ошибка при получении медицинской записи: ' + error.message);
    }
  }

  // Обновление медицинской записи
  async updateMedicalRecord(id, recordData) {
    try {
      const records = this.getRecordsFromStorage();
      const index = records.findIndex(r => r.id === id);
      
      if (index === -1) {
        throw new Error('Медицинская запись не найдена');
      }
      
      const updatedRecord = {
        ...records[index],
        ...recordData,
        updated_at: new Date().toISOString()
      };
      
      records[index] = updatedRecord;
      this.saveRecordsToStorage(records);
      
      console.log('Medical record updated successfully:', updatedRecord);
      return updatedRecord;
    } catch (error) {
      console.error('Error updating medical record:', error);
      throw new Error('Ошибка при обновлении медицинской записи: ' + error.message);
    }
  }

  // Удаление медицинской записи
  async deleteMedicalRecord(id) {
    try {
      const records = this.getRecordsFromStorage();
      const filteredRecords = records.filter(r => r.id !== id);
      this.saveRecordsToStorage(filteredRecords);
      
      console.log('Medical record deleted successfully');
      return { message: 'Медицинская запись успешно удалена' };
    } catch (error) {
      console.error('Error deleting medical record:', error);
      throw new Error('Ошибка при удалении медицинской записи: ' + error.message);
    }
  }
}

const localMedicalRecordServiceInstance = new LocalMedicalRecordService();
export { localMedicalRecordServiceInstance as default };