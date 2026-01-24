// Сервис для работы с файлами через API
const API_BASE_URL = process.env.REACT_APP_URL_API || 'http://localhost:8000';

class FileService {
  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/v1/files`;
  }

  // Загрузка файла
  async uploadFile(file, patientId, fileType = 'photo', medicalCategory = 'clinical', studyDate = '', bodyPart = '', description = '') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patient_id', patientId);
      formData.append('file_type', fileType);
      formData.append('medical_category', medicalCategory);
      if (studyDate) formData.append('study_date', studyDate);
      if (bodyPart) formData.append('body_part', bodyPart);
      formData.append('description', description);

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for file uploads
      
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          // Authorization header should be added here if needed
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP error response:', errorText);
        console.error('Response status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('File uploaded successfully:', result);
      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа от сервера. Проверьте, что сервер запущен и доступен.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте, что сервер запущен и доступен. ' + error.message);
      }
      
      throw error;
    }
  }

  // Скачивание файла
  async downloadFile(fileId) {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}/download/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP error response:', errorText);
        console.error('Response status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.blob();
      console.log('File downloaded successfully');
      return result;
    } catch (error) {
      console.error('Error downloading file:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа от сервера. Проверьте, что сервер запущен и доступен.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте, что сервер запущен и доступен. ' + error.message);
      }
      
      throw error;
    }
  }

  // Получение URL для изображения с авторизацией (для использования в img тегах)
  async getImageUrl(fileId) {
    try {
      // Сначала проверяем, есть ли токен
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Создаем временный URL с использованием Blob
      const blob = await this.downloadFile(fileId);
      const imageUrl = URL.createObjectURL(blob);
      return imageUrl;
    } catch (error) {
      console.error('Error getting image URL:', error);
      throw error;
    }
  }

  // Альтернативное название для получения фото
  async get_photo(fileId) {
    return this.getImageUrl(fileId);
  }

  // Получение списка файлов
  async getFiles(skip = 0, limit = 100) {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}?skip=${skip}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP error response:', errorText);
        console.error('Response status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('Files fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('Error fetching files:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа от сервера. Проверьте, что сервер запущен и доступен.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте, что сервер запущен и доступен. ' + error.message);
      }
      
      throw error;
    }
  }

  // Получение файла по ID
  async getFileById(id) {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP error response:', errorText);
        console.error('Response status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('File fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('Error fetching file:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа от сервера. Проверьте, что сервер запущен и доступен.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте, что сервер запущен и доступен. ' + error.message);
      }
      
      throw error;
    }
  }

  // Удаление файла
  async deleteFile(id) {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP error response:', errorText);
        console.error('Response status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('File deleted successfully:', result);
      return result;
    } catch (error) {
      console.error('Error deleting file:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа от сервера. Проверьте, что сервер запущен и доступен.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте, что сервер запущен и доступен. ' + error.message);
      }
      
      throw error;
    }
  }

  // Получение истории версий файла
  async getFileVersions(fileId) {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}/${fileId}/versions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP error response:', errorText);
        console.error('Response status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('File versions fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('Error fetching file versions:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа от сервера. Проверьте, что сервер запущен и доступен.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте, что сервер запущен и доступен. ' + error.message);
      }
      
      throw error;
    }
  }

  // Загрузка новой версии файла
  async uploadFileVersion(fileId, file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for file uploads
      
      const response = await fetch(`${this.baseUrl}/upload-version/${fileId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP error response:', errorText);
        console.error('Response status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('File version uploaded successfully:', result);
      return result;
    } catch (error) {
      console.error('Error uploading file version:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа от сервера. Проверьте, что сервер запущен и доступен.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте, что сервер запущен и доступен. ' + error.message);
      }
      
      throw error;
    }
  }

  // Скачивание конкретной версии файла
  async downloadFileVersion(versionId) {
    // В текущей реализации бэкенда скачивание конкретной версии не поддерживается
    // Поэтому мы скачиваем основной файл, который указывает на последнюю версию
    // Для полноценной реализации потребуется доработка бэкенда
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}/download/${versionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP error response:', errorText);
        console.error('Response status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.blob();
      console.log('File version downloaded successfully');
      return result;
    } catch (error) {
      console.error('Error downloading file version:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа от сервера. Проверьте, что сервер запущен и доступен.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте, что сервер запущен и доступен. ' + error.message);
      }
      
      throw error;
    }
  }
}

const localFileService = new FileService();
export { localFileService as default };