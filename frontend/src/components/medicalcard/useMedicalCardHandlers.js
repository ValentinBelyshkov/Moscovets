import { useCallback } from 'react';
import { ModuleDataService } from '../../services/ModuleDataService';

export const useMedicalCardHandlers = (patient, medicalCardData) => {
  // Функция для загрузки данных фотометрии
  const loadPhotometryDataForMedicalCard = useCallback(async (patientId) => {
    if (!patientId) return null;

    try {
      // 1. Проверяем в контексте (самые актуальные данные)
      if (medicalCardData?.photometry &&
          medicalCardData.photometry.patientId === patientId) {
        console.log('Found photometry data in context for patient:', patientId);
        return medicalCardData.photometry;
      }

      // 2. Проверяем в localStorage
      const storageKeys = Object.keys(localStorage).filter(key =>
        key.includes('photometry') && key.includes(patientId.toString())
      );

      for (const key of storageKeys) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.patientId === patientId || parsed.patientId?.toString() === patientId.toString()) {
              console.log('Found photometry data in localStorage:', key);
              return parsed;
            }
          }
        } catch (e) {
          console.warn('Error parsing localStorage data:', e);
        }
      }

      // 3. Проверяем в модуле medical_card
      const medicalCardKey = `medical_card_${patientId}`;
      const medicalCardStored = localStorage.getItem(medicalCardKey);
      if (medicalCardStored) {
        const parsed = JSON.parse(medicalCardStored);
        if (parsed.modules?.photometry) {
          console.log('Found photometry data in medical_card:', medicalCardKey);
          return parsed.modules.photometry.data || parsed.modules.photometry;
        }
      }

      return null;
    } catch (error) {
      console.error('Error loading photometry data for medical card:', error);
      return null;
    }
  }, [medicalCardData]);

  // Функция для загрузки данных биометрии
  const loadBiometryDataForMedicalCard = useCallback(async (patientId) => {
    if (!patientId) return null;

    try {
      // 1. Проверяем в контексте (самые актуальные данные)
      if (medicalCardData?.biometry &&
          medicalCardData.biometry.patientId === patientId) {
        console.log('Found biometry data in context for patient:', patientId);
        return medicalCardData.biometry;
      }

      // 2. Проверяем в localStorage
      const storageKeys = Object.keys(localStorage).filter(key =>
        key.includes('biometry') && key.includes(patientId.toString())
      );

      // Сортируем по дате (самые новые сначала)
      storageKeys.sort((a, b) => {
        const timeA = parseInt(a.split('_').pop()) || 0;
        const timeB = parseInt(b.split('_').pop()) || 0;
        return timeB - timeA;
      });

      for (const key of storageKeys) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.patientId === patientId || parsed.patientId?.toString() === patientId.toString()) {
              console.log('Found biometry data in localStorage:', key);
              return parsed;
            }
          }
        } catch (e) {
          console.warn('Error parsing localStorage data:', e);
        }
      }

      // 3. Проверяем в модуле medical_card
      const medicalCardKey = `medical_card_${patientId}`;
      const medicalCardStored = localStorage.getItem(medicalCardKey);
      if (medicalCardStored) {
        const parsed = JSON.parse(medicalCardStored);
        if (parsed.modules?.biometry) {
          console.log('Found biometry data in medical_card:', medicalCardKey);
          return parsed.modules.biometry.data || parsed.modules.biometry;
        }
      }

      return null;
    } catch (error) {
      console.error('Error loading biometry data for medical card:', error);
      return null;
    }
  }, [medicalCardData]);

  // Функция для загрузки данных цефалометрии
  const loadCephalometryDataForMedicalCard = useCallback(async (patientId) => {
    if (!patientId) return null;

    try {
      // 1. Проверяем в контексте (самые актуальные данные)
      if (medicalCardData?.cephalometry &&
          medicalCardData.cephalometry.patientId === patientId) {
        console.log('Found cephalometry data in context for patient:', patientId);
        return medicalCardData.cephalometry;
      }

      // 2. Проверяем в localStorage
      const storageKeys = Object.keys(localStorage).filter(key =>
        key.includes('cephalometry') && key.includes(patientId.toString())
      );

      // Сортируем по дате (самые новые сначала)
      storageKeys.sort((a, b) => {
        const timeA = parseInt(a.split('_').pop()) || 0;
        const timeB = parseInt(b.split('_').pop()) || 0;
        return timeB - timeA;
      });

      for (const key of storageKeys) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.patientId === patientId || parsed.patientId?.toString() === patientId.toString()) {
              console.log('Found cephalometry data in localStorage:', key);
              return parsed;
            }
          }
        } catch (e) {
          console.warn('Error parsing localStorage data:', e);
        }
      }

      // 3. Проверяем в модуле medical_card
      const medicalCardKey = `medical_card_${patientId}`;
      const medicalCardStored = localStorage.getItem(medicalCardKey);
      if (medicalCardStored) {
        const parsed = JSON.parse(medicalCardStored);
        if (parsed.modules?.cephalometry) {
          console.log('Found cephalometry data in medical_card:', medicalCardKey);
          return parsed.modules.cephalometry.data || parsed.modules.cephalometry;
        }
      }

      return null;
    } catch (error) {
      console.error('Error loading cephalometry data for medical card:', error);
      return null;
    }
  }, [medicalCardData]);

  // Функция для загрузки данных моделирования
  const loadModelingDataForMedicalCard = useCallback(async (patientId) => {
    if (!patientId) return null;

    try {
      // 1. Проверяем в контексте (самые актуальные данные)
      if (medicalCardData?.modeling &&
          medicalCardData.modeling.patientId === patientId) {
        console.log('Found modeling data in context for patient:', patientId);
        return medicalCardData.modeling;
      }

      // 2. Проверяем в localStorage
      const storageKeys = Object.keys(localStorage).filter(key =>
        key.includes('modeling') && key.includes(patientId.toString())
      );

      // Сортируем по дате (самые новые сначала)
      storageKeys.sort((a, b) => {
        const timeA = parseInt(a.split('_').pop()) || 0;
        const timeB = parseInt(b.split('_').pop()) || 0;
        return timeB - timeA;
      });

      for (const key of storageKeys) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.patientId === patientId || parsed.patientId?.toString() === patientId.toString()) {
              console.log('Found modeling data in localStorage:', key);
              return parsed;
            }
          }
        } catch (e) {
          console.warn('Error parsing localStorage data:', e);
        }
      }

      // 3. Проверяем в модуле medical_card
      const medicalCardKey = `medical_card_${patientId}`;
      const medicalCardStored = localStorage.getItem(medicalCardKey);
      if (medicalCardStored) {
        const parsed = JSON.parse(medicalCardStored);
        if (parsed.modules?.modeling) {
          console.log('Found modeling data in medical_card:', medicalCardKey);
          return parsed.modules.modeling.data || parsed.modules.modeling;
        }
      }

      return null;
    } catch (error) {
      console.error('Error loading modeling data for medical card:', error);
      return null;
    }
  }, [medicalCardData]);

  // Функция для загрузки данных КТ
  const loadCTDataForMedicalCard = useCallback(async (patientId) => {
    if (!patientId) return null;

    try {
      // 1. Проверяем в контексте (самые актуальные данные)
      if (medicalCardData?.ct &&
          medicalCardData.ct.patientId === patientId) {
        console.log('Found CT data in context for patient:', patientId);
        return medicalCardData.ct;
      }

      // 2. Проверяем в localStorage
      const storageKeys = Object.keys(localStorage).filter(key =>
        key.includes('ct') && key.includes(patientId.toString())
      );

      // Сортируем по дате (самые новые сначала)
      storageKeys.sort((a, b) => {
        const timeA = parseInt(a.split('_').pop()) || 0;
        const timeB = parseInt(b.split('_').pop()) || 0;
        return timeB - timeA;
      });

      for (const key of storageKeys) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.patientId === patientId || parsed.patientId?.toString() === patientId.toString()) {
              console.log('Found CT data in localStorage:', key);
              return parsed;
            }
          }
        } catch (e) {
          console.warn('Error parsing localStorage data:', e);
        }
      }

      // 3. Проверяем в модуле medical_card
      const medicalCardKey = `medical_card_${patientId}`;
      const medicalCardStored = localStorage.getItem(medicalCardKey);
      if (medicalCardStored) {
        const parsed = JSON.parse(medicalCardStored);
        if (parsed.modules?.ct) {
          console.log('Found CT data in medical_card:', medicalCardKey);
          return parsed.modules.ct.data || parsed.modules.ct;
        }
      }

      return null;
    } catch (error) {
      console.error('Error loading CT data for medical card:', error);
      return null;
    }
  }, [medicalCardData]);

  return {
    loadPhotometryDataForMedicalCard,
    loadBiometryDataForMedicalCard,
    loadCephalometryDataForMedicalCard,
    loadModelingDataForMedicalCard,
    loadCTDataForMedicalCard
  };
};
