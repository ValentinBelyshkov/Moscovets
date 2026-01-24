import React, { useState } from 'react';
import { authService } from '../services/authService';

const Login = ({ onLogin }) => {
  // State for login form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // State for registration form
  const [showRegister, setShowRegister] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const loginResponse = await authService.login(username, password);
      
      // Сохраняем токен в localStorage
      authService.saveToken(loginResponse.access_token);
      
      // Вызываем callback с данными пользователя
      onLogin({ username });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    // Check if passwords match
    if (regPassword !== regConfirmPassword) {
      setRegError('Пароли не совпадают');
      return;
    }

    try {
      const registerResponse = await authService.register({
        username: regUsername,
        email: regEmail,
        fullName: regFullName,
        password: regPassword
      });
      
      // Save the token from registration response
      authService.saveToken(registerResponse.access_token);
      
      // Switch to login form after successful registration
      setShowRegister(false);
      
      // Optionally log the user in automatically
      onLogin({ username: regUsername });
    } catch (err) {
      setRegError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {showRegister ? 'Регистрация' : 'Вход'}
          </h2>
          <p className="mt-2 text-gray-600">
            {showRegister 
              ? 'Создайте новый аккаунт' 
              : 'Введите свои данные для входа'}
          </p>
        </div>
        
        {/* Login Form */}
        {!showRegister && (
          <>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Имя пользователя:
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Пароль:
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-[1.02]"
              >
                Войти
              </button>
            </form>
            
            <div className="text-center mt-4">
              <button
                onClick={() => setShowRegister(true)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Нет аккаунта? Зарегистрироваться
              </button>
            </div>
          </>
        )}
        
        {/* Registration Form */}
        {showRegister && (
          <>
            {regError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{regError}</span>
              </div>
            )}
            
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="reg-username" className="block text-sm font-medium text-gray-700">
                  Имя пользователя:
                </label>
                <input
                  type="text"
                  id="reg-username"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700">
                  Email:
                </label>
                <input
                  type="email"
                  id="reg-email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="reg-full-name" className="block text-sm font-medium text-gray-700">
                  Полное имя:
                </label>
                <input
                  type="text"
                  id="reg-full-name"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700">
                  Пароль:
                </label>
                <input
                  type="password"
                  id="reg-password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-gray-700">
                  Подтвердите пароль:
                </label>
                <input
                  type="password"
                  id="reg-confirm-password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-medium py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-[1.02]"
              >
                Зарегистрироваться
              </button>
            </form>
            
            <div className="text-center mt-4">
              <button
                onClick={() => {
                  setShowRegister(false);
                  setRegError('');
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Уже есть аккаунт? Войти
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;