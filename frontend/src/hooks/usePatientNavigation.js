import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import patientService from '../services/patientService';

/**
 * Хук для обработки навигации с данными пациента
 * Автоматически извлекает данные пациента из состояния навигации
 * и обновляет контекст данных
 */
export const usePatientNavigation = (patientId = null) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setCurrentPatient, updateMedicalCardData } = useData();

  useEffect(() => {
    const { patient, fromPatientCard } = location.state || {};
    
    // Если есть ID пациента в параметрах (переданный из компонента) и нет данных пациента в состоянии
    if (patientId && !patient) {
      // Загружаем данные пациента по ID
      const fetchPatientById = async () => {
        try {
          const patientData = await patientService.getPatientById(patientId);
          if (patientData) {
            console.log('Setting patient data from URL ID:', patientData);
            
            // Устанавливаем текущего пациента
            setCurrentPatient(patientData);
            
            // Обновляем данные медицинской карты
            updateMedicalCardData({
              type: 'SET_PATIENT',
              patient: patientData
            });
          }
        } catch (error) {
          console.error('Error fetching patient by ID:', error);
        }
      };
      
      fetchPatientById();
    } 
    // Если есть данные пациента в состоянии навигации
    else if (patient && fromPatientCard) {
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
  }, [patientId, location.state, setCurrentPatient, updateMedicalCardData]);

  return { navigate };
};