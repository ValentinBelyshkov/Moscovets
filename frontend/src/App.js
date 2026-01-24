import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PatientDirectory from './components/PatientDirectory';
import MedicalCard from './components/MedicalCard';
import PatientCard from './components/PatientCard';
import FileLibrary from './components/FileLibrary';
import PresentationGenerator from './components/PresentationGenerator';
import MedicalCardGenerator from './components/MedicalCardGenerator';
import CephalometryModule from './components/CephalometryModule';
import PhotometryModule from './components/photometry/PhotometryModuleRefactored';
import CTModule from './components/CTModule';
import BiometryModule from './components/BiometryModule';
import ModelingModule from './components/ModelingModule';
import FileTransferDemo from './components/FileTransferDemo';
import { DataProvider } from './contexts/DataContext';
import './components/Login.css';
import './components/Dashboard.css';
import './components/PatientDirectory.css';
import './components/MedicalCard.css';
import './components/FileLibrary.css';
import './components/PresentationGenerator.css';
import './components/MedicalCardGenerator.css';
import './components/CephalometryModule.css';
import './components/photometry/PhotometryModule.css';
import './components/CTModule.css';
import './components/BiometryModule.css';
import './components/ModelingModule.css';

// Глобальная настройка для API запросов
export const API_BASE_URL = '/api/v1';

// Компонент для проверки аутентификации
function ProtectedRoute({ isLoggedIn, children }) {
  return isLoggedIn ? children : <Navigate to="/login" />;
}

// Компонент для обертывания логики аутентификации
function AuthWrapper({ onLogin, onLogout, isLoggedIn, user }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  // Проверяем, нужна ли аутентификация для текущего пути
  const isAuthRequired = !['/login'].includes(location.pathname);

  // Если пользователь не авторизован, но пытается зайти на защищенный маршрут
  if (isAuthRequired && !isLoggedIn) {
    return <Navigate to="/login" />;
  }

  // Если пользователь авторизован и находится на странице входа, направляем его на главную
  if (isLoggedIn && location.pathname === '/login') {
    return <Navigate to="/patients" />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-lg flex items-center justify-between flex-wrap gap-4 md:gap-0">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl md:text-2xl font-bold m-0">Moskovets 3D</h1>
          <p className="m-0">Добро пожаловать, {user?.username}!</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {location.pathname !== '/patients' && location.pathname !== '/medical-card' && (
            <button
              onClick={() => navigate('/patients')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 text-sm font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Назад к списку пациентов
            </button>
          )}
          
          {location.pathname === '/medical-card' && (
            <button
              onClick={() => navigate('/patients')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 text-sm font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Назад к списку пациентов
            </button>
          )}
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 text-sm font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Выйти
          </button>
        </div>
      </header>
      
      {/* Основной контент приложения */}
      <main className="flex-grow p-4 md:p-6 bg-gray-50">
        <Routes>
          <Route path="/" element={<Navigate to="/patients" />} />
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/patients" element={<PatientDirectory />} />
          <Route path="/medical-card/:id" element={<MedicalCardWithPatient />} />
          <Route path="/medical-card" element={<MedicalCardWithPatient />} />
          <Route path="/patients/:id" element={<PatientCard />} />
          <Route path="/file-library" element={<FileLibrary />} />
          <Route path="/presentation-generator" element={<PresentationGenerator />} />
          <Route path="/medical-card-generator" element={<MedicalCardGenerator />} />
          <Route path="/cephalometry" element={<CephalometryModule />} />
          <Route path="/photometry" element={<PhotometryModule />} />
          <Route path="/ct" element={<CTModule />} />
          <Route path="/biometry" element={<BiometryModule />} />
          <Route path="/modeling" element={<ModelingModule />} />
          <Route path="/file-transfer-demo" element={<FileTransferDemo />} />
        </Routes>
      </main>
      
      {/* Простой футер */}
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 text-center text-sm shadow-inner">
        <p>© 2024 Moskovets 3D. Все права защищены.</p>
        <p className="text-xs text-gray-400 mt-2">Версия: 1.0.0</p>
      </footer>
    </div>
  );
}

// Компонент для передачи данных пациента в MedicalCard
function MedicalCardWithPatient() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Извлекаем данные пациента из состояния или параметров
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  useEffect(() => {
    // Получаем данные пациента из состояния навигации или из sessionStorage
    const state = location.state;
    if (state && state.patient) {
      setSelectedPatient(state.patient);
    } else {
      // Если нет данных в состоянии, можно попытаться получить их другим способом
      // Например, если ID пациента передается как параметр URL
      if (location.pathname.includes('/medical-card/') && location.pathname.split('/')[2]) {
        // Здесь можно выполнить запрос к API для получения данных пациента по ID
        // Но пока просто покажем сообщение
        console.warn('Patient ID found in URL but patient data needs to be loaded from API');
      }
    }
  }, [location]);

  const handleBackToPatientDirectory = () => {
    navigate('/patients');
  };

  return (
    <MedicalCard 
      patient={selectedPatient} 
      onBack={handleBackToPatientDirectory}
    />
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);

  // Проверка токена при запуске приложения
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setIsLoggedIn(false);
      setUser(null);
      setInitialLoad(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    fetch('/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Unauthorized');
        }
        return response.json();
      })
      .then((userInfo) => {
        setIsLoggedIn(true);
        setUser({ ...userInfo, token });
        if (userInfo?.username) {
          localStorage.setItem('username', userInfo.username);
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsLoggedIn(false);
        setUser(null);
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setInitialLoad(false);
      });
  }, []);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);

    if (userData?.token) {
      localStorage.setItem('token', userData.token);
    }
    if (userData?.username) {
      localStorage.setItem('username', userData.username);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUser(null);
  };

  if (initialLoad) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-xl text-gray-700">Загрузка приложения...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Routes>
          <Route 
            path="/login" 
            element={
              !isLoggedIn ? 
                <Login onLogin={handleLogin} /> : 
                <Navigate to="/patients" />
            } 
          />
          <Route 
            path="*" 
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <DataProvider>
                  <AuthWrapper 
                    onLogin={handleLogin} 
                    onLogout={handleLogout}
                    isLoggedIn={isLoggedIn}
                    user={user}
                  />
                </DataProvider>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;