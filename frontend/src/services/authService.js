// Сервис для работы с аутентификацией

class AuthService {
  constructor() {
    this.baseUrl = '/api/v1/auth';
  }

  // Получение заголовков с авторизацией
  getHeaders() {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    return headers;
  }

  // Аутентификация пользователя и получение токена через API
  async login(username, password) {
    try {
      console.log('Attempting login via API for user:', username);
      
      // Формируем данные в формате x-www-form-urlencoded для OAuth2
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      
      const headers = this.getHeaders();
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: headers,
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP error response:', errorText);
        console.error('Response status:', response.status);
        throw new Error(`Неверное имя пользователя или пароль`);
      }
      
      const result = await response.json();
      console.log('Login successful:', result);
      return result;
    } catch (error) {
      console.error('Error during login:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа от сервера. Проверьте, что сервер запущен и доступен.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте, что сервер запущен и доступен. ' + error.message);
      }
      
      throw error;
    }
  }

  // Регистрация нового пользователя
  async register(userData) {
    try {
      console.log('Attempting registration via API for user:', userData.username);
      
      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          full_name: userData.fullName,
          password: userData.password
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Registration error response:', errorData);
        console.error('Response status:', response.status);
        
        let errorMessage = 'Ошибка при регистрации пользователя';
        if (errorData.detail) {
          errorMessage = errorData.detail;
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('Registration successful:', result);
      return result;
    } catch (error) {
      console.error('Error during registration:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа от сервера. Проверьте, что сервер запущен и доступен.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте, что сервер запущен и доступен. ' + error.message);
      }
      
      throw error;
    }
  }

  // Сохранение токена в localStorage
  saveToken(token) {
    localStorage.setItem('token', token);
  }

  // Получение токена из localStorage
  getToken() {
    return localStorage.getItem('token');
  }

  // Удаление токена из localStorage
  clearToken() {
    localStorage.removeItem('token');
  }

  // Проверка, залогинен ли пользователь
  isAuthenticated() {
    return !!this.getToken();
  }
}

const authService = new AuthService();
export { authService };