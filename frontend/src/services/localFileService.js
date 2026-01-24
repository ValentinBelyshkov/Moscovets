// Локальный сервис для работы с файлами через localStorage
class LocalFileService {
  constructor() {
    this.storageKey = 'moskovets3d_files';
    this.maxStorageSize = 50 * 1024 * 1024; // 50MB per file limit
    this.totalStorageLimit = 200 * 1024 * 1024; // 200MB total storage limit
    this.initializeStorage();
  }

  // Инициализация хранилища
  initializeStorage() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
  }

  // Получение списка файлов из localStorage
  getFilesFromStorage() {
    try {
      const files = localStorage.getItem(this.storageKey);
      return files ? JSON.parse(files) : [];
    } catch (error) {
      console.error('Error reading files from localStorage:', error);
      return [];
    }
  }

  // Сохранение списка файлов в localStorage
  saveFilesToStorage(files) {
    try {
      const serializedData = JSON.stringify(files);
      // Проверяем размер данных перед сохранением
      if (serializedData.length > this.totalStorageLimit) { // 8MB лимит
        // Попробуем освободить место, удалив старые файлы
        const cleanedFiles = this.cleanupOldFiles(files);
        const cleanedSerializedData = JSON.stringify(cleanedFiles);
        
        if (cleanedSerializedData.length > this.totalStorageLimit) {
          throw new Error(`Размер данных превышает допустимый лимит localStorage (${this.totalStorageLimit / (1024 * 1024)}MB). Пожалуйста, удалите некоторые файлы или очистите хранилище.`);
        }
        
        // Попробуем сохранить очищенные данные
        try {
          localStorage.setItem(this.storageKey, cleanedSerializedData);
          console.log('Storage cleaned up, old files removed');
          return cleanedFiles;
        } catch (setItemError) {
          // Если даже после очистки не удалось сохранить, выбрасываем ошибку
          if (setItemError.name === 'QuotaExceededError') {
            throw new Error('Превышен лимит хранилища браузера. Пожалуйста, удалите некоторые файлы или используйте браузер с большим объемом хранилища.');
          }
          throw setItemError;
        }
      }
      
      // Попробуем сохранить данные
      try {
        localStorage.setItem(this.storageKey, serializedData);
        return files;
      } catch (setItemError) {
        // Если не удалось сохранить из-за превышения квоты, попробуем очистить и сохранить
        if (setItemError.name === 'QuotaExceededError') {
          console.log('Quota exceeded, attempting to clean up old files...');
          const cleanedFiles = this.cleanupOldFiles(files);
          const cleanedSerializedData = JSON.stringify(cleanedFiles);
          
          try {
            localStorage.setItem(this.storageKey, cleanedSerializedData);
            console.log('Storage cleaned up, old files removed');
            return cleanedFiles;
          } catch (cleanSetItemError) {
            if (cleanSetItemError.name === 'QuotaExceededError') {
              throw new Error('Превышен лимит хранилища браузера. Пожалуйста, удалите некоторые файлы или используйте браузер с большим объемом хранилища.');
            }
            throw cleanSetItemError;
          }
        }
        throw setItemError;
      }
    } catch (error) {
      console.error('Error saving files to localStorage:', error);
      if (error.message.includes('лимит') || error.message.includes('хранилища')) {
        throw new Error('Превышен лимит хранилища браузера. Пожалуйста, удалите некоторые файлы или используйте браузер с большим объемом хранилища.');
      }
      throw new Error('Не удалось сохранить файлы в локальное хранилище: ' + error.message);
    }
  }

  // Очистка старых файлов для освобождения места
  cleanupOldFiles(files) {
    // Сортируем файлы по дате создания (старые первыми)
    const sortedFiles = [...files].sort((a, b) =>
      new Date(a.created_at) - new Date(b.created_at)
    );
    
    // Удаляем 2/3 самых старых файлов для более агрессивной очистки
    const filesToRemove = Math.floor(sortedFiles.length * 2 / 3);
    if (filesToRemove > 0) {
      const remainingFiles = sortedFiles.slice(filesToRemove);
      console.log(`Removed ${filesToRemove} old files to free up space`);
      return remainingFiles;
    }
    
    return files;
  }

  // Получение информации об использовании хранилища
  getStorageInfo() {
    try {
      const files = this.getFilesFromStorage();
      const serializedData = JSON.stringify(files);
      const usedSpace = serializedData.length;
      const totalLimit = this.totalStorageLimit;
      const percentageUsed = (usedSpace / totalLimit) * 100;
      
      return {
        used: usedSpace,
        total: totalLimit,
        percentage: percentageUsed,
        filesCount: files.length
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        used: 0,
        total: this.totalStorageLimit,
        percentage: 0,
        filesCount: 0
      };
    }
  }

  // Генерация уникального ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  // Загрузка файла (симуляция)
  async uploadFile(file, patientId, fileType = 'photo', medicalCategory = 'clinical', studyDate = '', bodyPart = '', description = '') {
    try {
      // Проверяем размер файла перед обработкой
      if (file.size > this.maxStorageSize) { // 50MB лимит
        throw new Error(`Размер файла превышает допустимый лимит (${this.maxStorageSize / (1024 * 1024)}MB). Пожалуйста, выберите файл меньшего размера.`);
      }
      
      // В локальной версии мы не загружаем файл на сервер, а сохраняем информацию о нем
      const files = this.getFilesFromStorage();
      
      const newFile = {
        id: this.generateId(),
        name: file.name,
        type: fileType, // Use passed fileType
        size: file.size,
        patient_id: patientId,
        description: description,
        medical_category: medicalCategory,
        study_date: studyDate,
        body_part: bodyPart,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // В реальной реализации здесь был бы путь к файлу на сервере
        // Для локальной версии мы будем хранить файл как data URL
        data_url: await this.fileToDataURL(file)
      };
      
      files.push(newFile);
      this.saveFilesToStorage(files);
      
      console.log('File "uploaded" successfully:', newFile);
      return newFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      if (error.message.includes('лимит')) {
        throw new Error(error.message);
      }
      throw new Error('Ошибка при загрузке файла: ' + error.message);
    }
  }

  // Преобразование файла в data URL
  fileToDataURL(file) {
    // Проверяем размер файла перед преобразованием
    if (file.size > this.maxStorageSize) {
      return Promise.reject(new Error(`Размер файла превышает допустимый лимит (${this.maxStorageSize / (1024 * 1024)}MB). Пожалуйста, выберите файл меньшего размера.`));
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Не удалось прочитать файл. Файл может быть поврежден или недоступен.'));
      reader.onabort = () => reject(new Error('Чтение файла было прервано.'));
      reader.readAsDataURL(file);
    });
  }

  // Скачивание файла
  async downloadFile(fileId) {
    try {
      const files = this.getFilesFromStorage();
      const file = files.find(f => f.id === fileId);
      
      if (!file) {
        throw new Error('Файл не найден');
      }
      
      // В локальной версии мы возвращаем Blob из data URL
      const response = await fetch(file.data_url);
      const blob = await response.blob();
      
      console.log('File downloaded successfully');
      return blob;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Ошибка при скачивании файла: ' + error.message);
    }
  }

  // Получение списка файлов
  async getFiles(skip = 0, limit = 100) {
    try {
      const files = this.getFilesFromStorage();
      const result = files.slice(skip, skip + limit);
      console.log('Files fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('Error fetching files:', error);
      throw new Error('Ошибка при получении списка файлов: ' + error.message);
    }
  }

  // Получение файла по ID
  async getFileById(id) {
    try {
      const files = this.getFilesFromStorage();
      const file = files.find(f => f.id === id);
      
      if (!file) {
        throw new Error('Файл не найден');
      }
      
      console.log('File fetched successfully:', file);
      return file;
    } catch (error) {
      console.error('Error fetching file:', error);
      throw new Error('Ошибка при получении файла: ' + error.message);
    }
  }

  // Удаление файла
  async deleteFile(id) {
    try {
      const files = this.getFilesFromStorage();
      const filteredFiles = files.filter(f => f.id !== id);
      this.saveFilesToStorage(filteredFiles);
      
      console.log('File deleted successfully');
      return { message: 'Файл успешно удален' };
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Ошибка при удалении файла: ' + error.message);
    }
  }

  // Получение истории версий файла (не реализовано в локальной версии)
  async getFileVersions(fileId) {
    // В локальной версии история версий не поддерживается
    return [];
  }

  // Загрузка новой версии файла (не реализовано в локальной версии)
  async uploadFileVersion(fileId, file) {
    // В локальной версии загрузка новых версий не поддерживается
    // Просто заменяем существующий файл
    return await this.uploadFile(file, 1, 'Новая версия файла');
  }

  // Скачивание конкретной версии файла (не реализовано в локальной версии)
  async downloadFileVersion(versionId) {
    // В локальной версии скачивание конкретной версии не поддерживается
    return await this.downloadFile(versionId);
  }

  // Принудительная очистка хранилища
  async forceCleanup() {
    try {
      const files = this.getFilesFromStorage();
      if (files.length === 0) {
        return { message: 'Хранилище уже пустое' };
      }
      
      // Оставляем только самые свежие файлы (1/3 от общего количества)
      const sortedFiles = [...files].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      const filesToKeep = Math.max(1, Math.floor(sortedFiles.length / 3));
      const keptFiles = sortedFiles.slice(0, filesToKeep);
      
      this.saveFilesToStorage(keptFiles);
      
      return {
        message: `Очищено ${files.length - keptFiles.length} файлов. Осталось ${keptFiles.length} файлов.`,
        removedCount: files.length - keptFiles.length,
        remainingCount: keptFiles.length
      };
    } catch (error) {
      console.error('Error during force cleanup:', error);
      throw new Error('Не удалось выполнить очистку хранилища: ' + error.message);
    }
  }
}

const localFileService = new LocalFileService();
export default localFileService;