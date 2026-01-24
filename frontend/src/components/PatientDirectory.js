import React, { useState } from 'react';

const PatientDirectory = ({ onViewMedicalCard }) => {
  // Sample patient data
  const [patients, setPatients] = useState([
    { id: 1, fullName: 'John Doe', birthDate: '1990-01-01', gender: 'Male', lastVisit: '2023-05-15' },
    { id: 2, fullName: 'Jane Smith', birthDate: '1985-03-15', gender: 'Female', lastVisit: '2023-05-20' },
    { id: 3, fullName: 'Robert Johnson', birthDate: '1978-11-22', gender: 'Male', lastVisit: '2023-05-10' },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPatient, setNewPatient] = useState({
    fullName: '',
    birthDate: '',
    gender: '',
    contactInfo: ''
  });

  const handleAddPatient = () => {
    setShowAddForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPatient(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, you would send this data to your backend API
    const patient = {
      ...newPatient,
      id: patients.length + 1,
      lastVisit: new Date().toISOString().split('T')[0]
    };
    setPatients(prev => [...prev, patient]);
    setNewPatient({ fullName: '', birthDate: '', gender: '', contactInfo: '' });
    setShowAddForm(false);
  };

  const handleViewMedicalCard = (patient) => {
    // In a real application, this would navigate to the medical card page
    onViewMedicalCard(patient);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 pb-2 border-b-2 border-blue-500">Список пациентов</h2>
      </div>
      
      <div className="mb-6">
        <button 
          onClick={handleAddPatient}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium py-2 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-[1.02]"
        >
          Добавить нового пациента
        </button>
      </div>
      
      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Добавить нового пациента</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Полное имя:</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={newPatient.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">Дата рождения:</label>
                <input
                  type="date"
                  id="birthDate"
                  name="birthDate"
                  value={newPatient.birthDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Пол:</label>
                <select
                  id="gender"
                  name="gender"
                  value={newPatient.gender}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Выберите пол</option>
                  <option value="Male">Мужской</option>
                  <option value="Female">Женский</option>
                  <option value="Other">Другое</option>
                </select>
              </div>
              <div>
                <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700 mb-1">Контактная информация:</label>
                <input
                  type="text"
                  id="contactInfo"
                  name="contactInfo"
                  value={newPatient.contactInfo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-4 pt-4">
              <button 
                type="submit" 
                className="bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white font-medium py-2 px-6 rounded-lg transition duration-300 ease-in-out"
              >
                Добавить пациента
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium py-2 px-6 rounded-lg transition duration-300 ease-in-out"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-xl font-semibold text-gray-800">Пациенты</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата рождения</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пол</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Последний визит</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map(patient => (
                    <tr key={patient.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{patient.fullName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.birthDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.gender}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.lastVisit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          onClick={() => handleViewMedicalCard(patient)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300 ease-in-out"
                        >
                          Просмотреть медицинскую карту
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Быстрые действия</h3>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => window.location.hash = '#file-library'}
                className="bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white font-medium py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-[1.02] text-sm"
              >
                Библиотека файлов
              </button>
              <button 
                onClick={() => window.location.hash = '#presentation-generator'}
                className="bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white font-medium py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-[1.02] text-sm"
              >
                Создать презентацию
              </button>
              <button 
                onClick={() => window.location.hash = '#medical-card-generator'}
                className="bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white font-medium py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-[1.02] text-sm"
              >
                Сгенерировать медицинскую карту
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md mt-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Модули анализа</h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => window.location.hash = '#cephalometry'}
                  className="w-full text-left bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 px-4 rounded-lg border-l-4 border-blue-500 transition duration-300 ease-in-out transform hover:scale-[1.02] text-sm"
                >
                  Цефалометрия
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.location.hash = '#photometry'}
                  className="w-full text-left bg-green-50 hover:bg-green-100 text-green-700 font-medium py-3 px-4 rounded-lg border-l-4 border-green-500 transition duration-300 ease-in-out transform hover:scale-[1.02] text-sm"
                >
                  Фотометрия
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.location.hash = '#ct'}
                  className="w-full text-left bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-3 px-4 rounded-lg border-l-4 border-purple-500 transition duration-300 ease-in-out transform hover:scale-[1.02] text-sm"
                >
                  Анализ КТ
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.location.hash = '#biometry'}
                  className="w-full text-left bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium py-3 px-4 rounded-lg border-l-4 border-yellow-500 transition duration-300 ease-in-out transform hover:scale-[1.02] text-sm"
                >
                  Биометрия
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.location.hash = '#modeling'}
                  className="w-full text-left bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-3 px-4 rounded-lg border-l-4 border-indigo-500 transition duration-300 ease-in-out transform hover:scale-[1.02] text-sm"
                >
                  Моделирование окклюзионных накладок
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDirectory;