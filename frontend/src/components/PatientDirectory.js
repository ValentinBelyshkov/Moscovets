import React, { useState } from 'react';
import PatientCard from './PatientCard';

const PatientDirectory = () => {
  // Sample patient data
  const [patients, setPatients] = useState([
    { id: 1, fullName: 'Иванова Мария Петровна', birthDate: '1995-03-15', gender: 'Female', lastVisit: '2024-01-15', complaints: 'Неровные зубы, эстетический дефект' },
    { id: 2, fullName: 'Петров Александр Иванович', birthDate: '1985-06-22', gender: 'Male', lastVisit: '2024-01-14', complaints: 'Неправильный прикус' },
    { id: 3, fullName: 'Сидорова Елена Викторовна', birthDate: '1990-11-08', gender: 'Female', lastVisit: '2024-01-10', complaints: 'Скученность зубов' },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPatient, setNewPatient] = useState({
    fullName: '',
    birthDate: '',
    gender: '',
    contactInfo: ''
  });
  const [selectedPatient, setSelectedPatient] = useState(null);

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
    const patient = {
      ...newPatient,
      id: patients.length + 1,
      lastVisit: new Date().toISOString().split('T')[0]
    };
    setPatients(prev => [...prev, patient]);
    setNewPatient({ fullName: '', birthDate: '', gender: '', contactInfo: '' });
    setShowAddForm(false);
  };

  const handleViewPatientCard = (patient) => {
    setSelectedPatient(patient);
  };

  const handleBackToDirectory = () => {
    setSelectedPatient(null);
  };

  // Если выбран пациент, показываем его карточку
  if (selectedPatient) {
    return <PatientCard patient={selectedPatient} onBack={handleBackToDirectory} />;
  }

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
                      onClick={() => handleViewPatientCard(patient)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Открыть карту
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PatientDirectory;