import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

/**
 * Хук для обработки навигации с данными пациента
 * Автоматически извлекает данные пациента из состояния навигации
 * и обновляет контекст данных
 */
export const usePatientNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setCurrentPatient, updateMedicalCardData } = useData();

  useEffect(() => {
    const { patient, fromPatientCard } = location.state || {};
    
    if (patient && fromPatientCard) {
      console.log('Setting patient data from navigation:', patient);
      
      // Устанавливаем текущего пациента
      setCurrentPatient(patient);
      
      // Обновляем данные медицинской карты
      updateMedicalCardData({
        type: 'SET_PATIENT',
        patient: patient
      });
      
      // Очищаем состояние навигации, чтобы избежать дублирования
      window.history.replaceState(null, '', location.pathname);
    }
  }, [location.state, setCurrentPatient, updateMedicalCardData]);

  return { navigate };
};