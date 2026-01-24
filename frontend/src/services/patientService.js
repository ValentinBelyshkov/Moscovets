// Сервис для работы с пациентами через API
const API_BASE_URL = process.env.REACT_APP_URL_API || 'http://localhost:8000';

class PatientService {
  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/v1/patients`;
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

  // Получение списка пациентов
  async getPatients(skip = 0, limit = 100) {
    try {
      const headers = this.getAuthHeaders();
      console.log('Fetching patients with headers:', headers);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}/?skip=${skip}&limit=${limit}`, {
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
      console.log('Patients fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('Error fetching patients:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа от сервера. Проверьте, что сервер запущен и доступен.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте, что сервер запущен и доступен. ' + error.message);
      }
      
      throw error;
    }
  }

  // Создание нового пациента
  async createPatient(patientData) {
    try {
      console.log('Sending patient data:', patientData);
      const headers = this.getAuthHeaders();
      console.log('Request headers:', headers);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(patientData),
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
      console.log('Patient created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating patient:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа от сервера. Проверьте, что сервер запущен и доступен.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте, что сервер запущен и доступен. ' + error.message);
      }
      
      throw error;
    }
  }

  // Получение пациента по ID
  async getPatientById(id) {
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
      console.log('Patient fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('Error fetching patient:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа от сервера. Проверьте, что сервер запущен и доступен.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте, что сервер запущен и доступен. ' + error.message);
      }
      
      throw error;
    }
  }

  // Обновление пациента
  async updatePatient(id, patientData) {
    try {
      const headers = this.getAuthHeaders();
      console.log('Request headers:', headers);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(patientData),
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
      console.log('Patient updated successfully:', result);
      return result;
    } catch (error) {
      console.error('Error updating patient:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа от сервера. Проверьте, что сервер запущен и доступен.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте, что сервер запущен и доступен. ' + error.message);
      }
      
      throw error;
    }
  }

  // Удаление пациента
  async deletePatient(id) {
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
      console.log('Patient deleted successfully:', result);
      return result;
    } catch (error) {
      console.error('Error deleting patient:', error);
      
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

export default new PatientService();
