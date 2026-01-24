import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PatientDirectory from './components/PatientDirectory';
import MedicalCard from './components/MedicalCard';
import FileLibrary from './components/FileLibrary';
import PresentationGenerator from './components/PresentationGenerator';
import MedicalCardGenerator from './components/MedicalCardGenerator';
import CephalometryModule from './components/CephalometryModule';
import PhotometryModule from './components/PhotometryModuleNew';
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
import './components/PhotometryModule.css';
import './components/CTModule.css';
import './components/BiometryModule.css';
import './components/ModelingModule.css';

// Глобальная настройка для API запросов
export const API_BASE_URL = '/api/v1';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);

  // Проверка токена при запуске приложения
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // В реальном приложении мы бы проверили токен с бэкендом
      setIsLoggedIn(true);
      setUser({ username: 'test', token: token });
    } else {
      // В локальном режиме автоматически логинимся с тестовыми учетными данными
      setIsLoggedIn(true);
      setUser({ username: 'test', token: 'demo_token' });
    }
    setInitialLoad(false);
  }, []);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    // Сохраняем токен в localStorage
    if (userData.token) {
      localStorage.setItem('token', userData.token);
    }
  };

  const handleLogout = () => {
    // Удаляем токен при выходе
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    setCurrentView('dashboard');
    setSelectedPatient(null);
  };

  const handleViewMedicalCard = (patient) => {
    setSelectedPatient(patient);
    setCurrentView('medical-card');
  };

  // Обработка навигации на основе хэша
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      let view = 'dashboard';
      
      // Сопоставление хэшей с видами
      const hashMap = {
        'patient-directory': 'patient-directory',
        'file-library': 'file-library',
        'presentation-generator': 'presentation-generator',
        'medical-card-generator': 'medical-card-generator',
        'cephalometry': 'cephalometry',
        'photometry': 'photometry',
        'ct': 'ct',
        'biometry': 'biometry',
        'modeling': 'modeling',
        'file-transfer-demo': 'file-transfer-demo'
      };
      
      if (hashMap[hash]) {
        view = hashMap[hash];
      }
      
      setCurrentView(view);
      // Сбрасываем выбранного пациента при смене вида (кроме медицинской карты)
      if (view !== 'medical-card') {
        setSelectedPatient(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Начальная проверка

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Обработка нажатия кнопки "Назад"
  const handleBackToDashboard = () => {
    window.location.hash = '';
    setSelectedPatient(null);
  };

  // Обработка нажатия кнопки "Назад к списку пациентов"
  const handleBackToPatientDirectory = () => {
    window.location.hash = '#patient-directory';
    setCurrentView('patient-directory');
    setSelectedPatient(null);
  };

  if (initialLoad) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-xl text-gray-700">Загрузка приложения...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <DataProvider>
          <div className="flex flex-col min-h-screen">
            <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-lg flex items-center justify-between flex-wrap gap-4 md:gap-0">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl md:text-2xl font-bold m-0">Moskovets 3D</h1>
                <p className="m-0">Добро пожаловать, {user?.username}!</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {currentView !== 'dashboard' && currentView !== 'medical-card' && (
                  <button
                    onClick={handleBackToDashboard}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 text-sm font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    Назад к панели управления
                  </button>
                )}
                
                {currentView === 'medical-card' && (
                  <button
                    onClick={handleBackToPatientDirectory}
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
              {currentView === 'dashboard' && (
                <Dashboard user={user} />
              )}
              
              {currentView === 'patient-directory' && (
                <PatientDirectory />
              )}
              
              {currentView === 'medical-card' && (
                <MedicalCard patient={selectedPatient} />
              )}
              
              {currentView === 'file-library' && (
                <FileLibrary />
              )}
              
              {currentView === 'presentation-generator' && (
                <PresentationGenerator />
              )}
              
              {currentView === 'medical-card-generator' && (
                <MedicalCardGenerator />
              )}
              
              {currentView === 'cephalometry' && (
                <CephalometryModule />
              )}
              
              {currentView === 'photometry' && (
                <PhotometryModule />
              )}
              
              {currentView === 'ct' && (
                <CTModule />
              )}
              
              {currentView === 'biometry' && (
                <BiometryModule />
              )}
              
              {currentView === 'modeling' && (
                <ModelingModule />
              )}
              
              {currentView === 'file-transfer-demo' && (
                <FileTransferDemo />
              )}
            </main>
            
            {/* Простой футер */}
            <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 text-center text-sm shadow-inner">
              <p>© 2024 Moskovets 3D. Все права защищены.</p>
              <p className="text-xs text-gray-400 mt-2">Версия: 1.0.0</p>
            </footer>
          </div>
        </DataProvider>
      )}
    </div>
  );
}

export default App;