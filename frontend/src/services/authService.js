// Сервис для работы с аутентификацией

class AuthService {
  // Аутентификация пользователя и получение токена (локальная версия)
  async login(username, password) {
    try {
      // В локальном режиме мы не отправляем запрос на сервер
      // Вместо этого мы симулируем успешную аутентификацию
      console.log('Local login simulation');
      
      // Проверяем учетные данные (в локальном режиме используем тестовые данные)
      if (username === 'test' && password === 'test') {
        // Генерируем токен (в реальном приложении это делает сервер)
        const token = 'local_test_token_' + Date.now();
        console.log('Login successful');
        return { access_token: token };
      } else {
        throw new Error('Неверное имя пользователя или пароль');
      }
    } catch (error) {
      console.error('Error during login:', error);
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