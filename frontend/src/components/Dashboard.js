import React from 'react';

const Dashboard = ({ user }) => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 pb-2 border-b-2 border-blue-500">Панель управления</h2>
        <p className="text-lg text-gray-600">Добро пожаловать в медицинское приложение Moskvitz 3D, {user?.username}!</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Доступные модули</h3>
          <ul className="space-y-3">
            <li>
              <button 
                onClick={() => window.location.hash = '#cephalometry'}
                className="w-full text-left bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 px-4 rounded-lg border-l-4 border-blue-500 transition duration-300 ease-in-out transform hover:scale-[1.02]"
              >
                Цефалометрия
              </button>
            </li>
            <li>
              <button 
                onClick={() => window.location.hash = '#photometry'}
                className="w-full text-left bg-green-50 hover:bg-green-100 text-green-700 font-medium py-3 px-4 rounded-lg border-l-4 border-green-500 transition duration-300 ease-in-out transform hover:scale-[1.02]"
              >
                Фотометрия
              </button>
            </li>
            <li>
              <button 
                onClick={() => window.location.hash = '#ct'}
                className="w-full text-left bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-3 px-4 rounded-lg border-l-4 border-purple-500 transition duration-300 ease-in-out transform hover:scale-[1.02]"
              >
                Анализ КТ
              </button>
            </li>
            <li>
              <button 
                onClick={() => window.location.hash = '#biometry'}
                className="w-full text-left bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium py-3 px-4 rounded-lg border-l-4 border-yellow-500 transition duration-300 ease-in-out transform hover:scale-[1.02]"
              >
                Биометрия
              </button>
            </li>
            <li>
              <button 
                onClick={() => window.location.hash = '#modeling'}
                className="w-full text-left bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-3 px-4 rounded-lg border-l-4 border-indigo-500 transition duration-300 ease-in-out transform hover:scale-[1.02]"
              >
                Моделирование окклюзионных накладок
              </button>
            </li>
          </ul>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Быстрые действия</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => window.location.hash = '#patient-directory'}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-[1.02]"
            >
              Список пациентов
            </button>
            <button 
              onClick={() => window.location.hash = '#file-library'}
              className="bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white font-medium py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-[1.02]"
            >
              Библиотека файлов
            </button>
            <button 
              onClick={() => window.location.hash = '#presentation-generator'}
              className="bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white font-medium py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-[1.02]"
            >
              Создать презентацию
            </button>
            <button 
              onClick={() => window.location.hash = '#medical-card-generator'}
              className="bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white font-medium py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-[1.02]"
            >
              Сгенерировать медицинскую карту
            </button>
            <button 
              onClick={() => window.location.hash = '#file-transfer-demo'}
              className="bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white font-medium py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-[1.02] col-span-2"
            >
              Демонстрация передачи файлов
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;