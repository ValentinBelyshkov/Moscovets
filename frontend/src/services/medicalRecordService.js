// Сервис для работы с медицинскими записями через API

// Use runtime configuration with fallback to build-time environment variable
const getApiBaseUrl = () => {
  // First try runtime config (from env-config.js)
  if (typeof window !== 'undefined' && window._env_ && window._env_.REACT_APP_URL_API) {
    return window._env_.REACT_APP_URL_API;
  }
  // Fallback to build-time environment variable
  return process.env.REACT_APP_URL_API || 'http://109.196.102.193:5001';
};

const API_BASE_URL = 'http://109.196.102.193:5001';

class MedicalRecordService {
  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/v1/medical-records`;
  }

  // Получение заголовков с авторизацией
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Создание новой медицинской записи
  async createMedicalRecord(recordData) {
    try {
      console.log('Sending medical record data:', recordData);
      const headers = this.getAuthHeaders();
      console.log('Request headers:', headers);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(recordData),
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
      console.log('Medical record created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating medical record:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа от сервера. Проверьте, что сервер запущен и доступен.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте, что сервер запущен и доступен. ' + error.message);
      }
      
      throw error;
    }
  }

  // Получение списка медицинских записей
  async getMedicalRecords(skip = 0, limit = 100) {
    try {
      const headers = this.getAuthHeaders();
      console.log('Request headers:', headers);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}?skip=${skip}&limit=${limit}`, {
        headers: headers,
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
      console.log('Medical records fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('Error fetching medical records:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа от сервера. Проверьте, что сервер запущен и доступен.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте, что сервер запущен и доступен. ' + error.message);
      }
      
      throw error;
    }
  }

  // Получение медицинской записи по ID
  async getMedicalRecordById(id) {
    try {
      const headers = this.getAuthHeaders();
      console.log('Request headers:', headers);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}/${id}`, {
        headers: headers,
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
      console.log('Medical record fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('Error fetching medical record:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа от сервера. Проверьте, что сервер запущен и доступен.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте, что сервер запущен и доступен. ' + error.message);
      }
      
      throw error;
    }
  }

  // Обновление медицинской записи
  async updateMedicalRecord(id, recordData) {
    try {
      const headers = this.getAuthHeaders();
      console.log('Request headers:', headers);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(recordData),
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
      console.log('Medical record updated successfully:', result);
      return result;
    } catch (error) {
      console.error('Error updating medical record:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа от сервера. Проверьте, что сервер запущен и доступен.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте, что сервер запущен и доступен. ' + error.message);
      }
      
      throw error;
    }
  }

  // Удаление медицинской записи
  async deleteMedicalRecord(id) {
    try {
      const headers = this.getAuthHeaders();
      console.log('Request headers:', headers);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: headers,
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
      console.log('Medical record deleted successfully:', result);
      return result;
    } catch (error) {
      console.error('Error deleting medical record:', error);
      
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

export default new MedicalRecordService();