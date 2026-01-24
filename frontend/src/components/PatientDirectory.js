import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientCard from './PatientCard';
import patientService from '../services/patientService';

const PatientDirectory = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPatient, setNewPatient] = useState({
    full_name: '',
    birth_date: '',
    gender: '',
    contact_info: ''
  });

  // Загрузка пациентов при монтировании компонента
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await patientService.getPatients();
      setPatients(data);
    } catch (err) {
      console.error('Error loading patients:', err);
      setError(err.message || 'Не удалось загрузить список пациентов');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      console.log('Submitting patient data:', newPatient);
      
      const createdPatient = await patientService.createPatient(newPatient);
      console.log('Patient created:', createdPatient);
      
      // Обновляем список пациентов
      await loadPatients();
      
      // Сбрасываем форму
      setNewPatient({ full_name: '', birth_date: '', gender: '', contact_info: '' });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error creating patient:', err);
      setError(err.message || 'Не удалось создать пациента');
    }
  };

  const handleViewPatientCard = (patient) => {
    navigate(`/patients/${patient.id}`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 pb-2 border-b-2 border-blue-500">Список пациентов</h2>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <button 
          onClick={handleAddPatient}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium py-2 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-[1.02]"
        >
          Добавить нового пациента
        </button>
        <button 
          onClick={loadPatients}
          disabled={loading}
          className="ml-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300 ease-in-out disabled:opacity-50"
        >
          {loading ? 'Загрузка...' : 'Обновить список'}
        </button>
      </div>
      
      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Добавить нового пациента</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">Полное имя:</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={newPatient.full_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-1">Дата рождения:</label>
                <input
                  type="date"
                  id="birth_date"
                  name="birth_date"
                  value={newPatient.birth_date}
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
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                  <option value="other">Другое</option>
                </select>
              </div>
              <div>
                <label htmlFor="contact_info" className="block text-sm font-medium text-gray-700 mb-1">Контактная информация:</label>
                <input
                  type="text"
                  id="contact_info"
                  name="contact_info"
                  value={newPatient.contact_info}
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
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Загрузка пациентов...</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-xl font-semibold text-gray-800">
              Пациенты {patients.length > 0 && `(${patients.length})`}
            </h3>
          </div>
          {patients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Нет пациентов. Добавьте первого пациента!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата рождения</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пол</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Контакты</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map(patient => (
                    <tr key={patient.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{patient.full_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.birth_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.gender === 'male' ? 'Мужской' : patient.gender === 'female' ? 'Женский' : patient.gender}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.contact_info || '-'}</td>
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
          )}
        </div>
      )}
    </div>
  );
};

export default PatientDirectory;