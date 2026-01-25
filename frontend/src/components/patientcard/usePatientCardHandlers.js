import { useCallback } from 'react';
import fileService from '../../services/fileService';

export const usePatientCardHandlers = (patient, medicalCardData) => {
  // Функция для загрузки данных фотометрии
  const loadPhotometryData = useCallback(async (patientId) => {
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

      // 4. Загружаем фотофайлы из бэкенда если нет обработанных данных
      try {
        // Use runtime configuration with fallback to build-time environment variable
        const getApiBaseUrl = () => {
          // First try runtime config (from env-config.js)
          if (typeof window !== 'undefined' && window._env_ && window._env_.REACT_APP_URL_API) {
            return window._env_.REACT_APP_URL_API;
          }
          // Fallback to build-time environment variable
          return process.env.REACT_APP_URL_API || 'http://109.196.102.193:5001';
        };
        
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/v1/files/patient/${patientId}/files?file_type=photo`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const files = await response.json();
          
          if (files && Array.isArray(files) && files.length > 0) {
            // Создаем базовую структуру фотометрии с изображениями
            const photoUrls = {};
            let photoCount = 0;
            
            for (const file of files) {
              // Ensure we're checking the right file type - might be an enum value
              const fileType = typeof file.file_type === 'object' ? file.file_type.value : file.file_type;
              if ((fileType === 'photo' || fileType === 'PHOTO') && photoCount < 4) { // Предполагаем до 4 фото
                // Используем сервис для получения URL изображения с авторизацией
                try {
                  const photoUrl = await fileService.getImageUrl(file.id);
                  
                  if (photoCount === 0) {
                    photoUrls.frontal = photoUrl; // Предполагаем, что первое фото - анфас
                  } else if (photoCount === 1) {
                    photoUrls.profile = photoUrl; // Профиль
                  } else if (photoCount === 2) {
                    photoUrls.profile45 = photoUrl; // Под углом 45
                  } else if (photoCount === 3) {
                    photoUrls.intraoral = photoUrl; // Внутриротовые
                  }
                  
                  photoCount++;
                } catch (urlError) {
                  console.error(`Error getting URL for file ${file.id}:`, urlError);
                  // Продолжаем с другими файлами
                  continue;
                }
              }
            }
            
            // Возвращаем структуру с фото, но без измерений
            return {
              patientId,
              patientName: `Patient ${patientId}`,
              analysisDate: new Date().toISOString(),
              projectionType: 'frontal', // по умолчанию
              measurements: {},
              points: {},
              scale: 0, // без калибровки
              images: photoUrls,
              report: null,
              structuredData: null
            };
          }
        } else {
          console.warn('Failed to fetch photo files:', response.status, response.statusText);
        }
      } catch (fetchError) {
        console.warn('Could not fetch photo files from backend:', fetchError);
        // Продолжаем выполнение, если не удалось получить фото
      }

      return null;
    } catch (error) {
      console.error('Error loading photometry data:', error);
      return null;
    }
  }, [medicalCardData]);

  // Функция для загрузки данных биометрии
  const loadBiometryData = useCallback(async (patientId) => {
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
      console.error('Error loading biometry data:', error);
      return null;
    }
  }, [medicalCardData]);

  // Функция для загрузки данных цефалометрии
  const loadCephalometryData = useCallback(async (patientId) => {
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
      console.error('Error loading cephalometry data:', error);
      return null;
    }
  }, [medicalCardData]);

  // Функция для загрузки данных моделирования
  const loadModelingData = useCallback(async (patientId) => {
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
      console.error('Error loading modeling data:', error);
      return null;
    }
  }, [medicalCardData]);

  // Функция для загрузки данных КТ
  const loadCTData = useCallback(async (patientId) => {
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
      console.error('Error loading CT data:', error);
      return null;
    }
  }, [medicalCardData]);

  // Функция для загрузки истории болезни
  const loadMedicalHistory = useCallback(async (patientId) => {
    if (!patientId) return [];

    try {
      // Демонстрационные данные истории болезни
      const demoHistory = [
        {
          id: 1,
          date: '2024-01-15',
          type: 'Фотометрия',
          doctor: 'Иванов А.С.',
          diagnosis: 'Симметричное лицо, прямой профиль',
          treatment: 'Рекомендовано ортодонтическое лечение',
          notes: 'Пациент жалоб не предъявляет'
        },
        {
          id: 2,
          date: '2024-01-15',
          type: 'Цефалометрия',
          doctor: 'Петрова Е.В.',
          diagnosis: 'Скелетный I класс, нейтральный рост',
          treatment: 'Показано лечение на брекетах',
          notes: 'Воздухоносные пути в норме'
        },
        {
          id: 3,
          date: '2024-01-14',
          type: 'Биометрия',
          doctor: 'Сидоров Д.М.',
          diagnosis: 'Несоответствие зубных рядов 77.2%',
          treatment: 'Расширение верхней челюсти',
          notes: 'Требуется сепарация 4.5 мм'
        },
        {
          id: 4,
          date: '2024-01-10',
          type: 'Консультация',
          doctor: 'Московец В.И.',
          diagnosis: 'Дистальная окклюзия, скученность',
          treatment: 'План лечения разработан',
          notes: 'Первичный осмотр, сбор анамнеза'
        }
      ];

      return demoHistory;
    } catch (error) {
      console.error('Error loading medical history:', error);
      return [];
    }
  }, []);

  return {
    loadPhotometryData,
    loadBiometryData,
    loadCephalometryData,
    loadModelingData,
    loadCTData,
    loadMedicalHistory
  };
};
