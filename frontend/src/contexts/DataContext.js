import React, { createContext, useState, useContext, useCallback } from 'react';

// Создаем контекст
export const DataContext = createContext();

// Хук для использования контекста
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Провайдер контекста
export const DataProvider = ({ children }) => {
  // Состояние для медицинской карты
  const [medicalCardData, setMedicalCardData] = useState({
    patient: null,
    modules: {},
    cephalometry: null,
    photometry: null,
    biometry: null,
    ct: null,
    modeling: null,
    diagnostics: [],
    history: []
  });

  // Состояние для активного пациента
  const [currentPatient, setCurrentPatient] = useState(null);

  // Функция для обновления данных медицинской карты
  const updateMedicalCardData = useCallback((action) => {
    setMedicalCardData(prev => {
      switch (action.type) {
        case 'UPDATE_CEPHALOMETRY':
          console.log('Updating cephalometry data:', action.data);
          const newDiagnostic = {
            type: 'cephalometry',
            date: action.data.analysisDate || new Date().toISOString().split('T')[0],
            diagnosis: action.data.conclusions?.[0] || 'Цефалометрический анализ',
            recommendations: action.data.recommendations || []
          };
          
          return {
            ...prev,
            cephalometry: action.data,
            modules: {
              ...prev.modules,
              cephalometry: {
                data: action.data,
                updatedAt: new Date().toISOString(),
                patientId: action.patientId || action.data.patientId,
                source: 'data_context'
              }
            },
            diagnostics: [
              ...prev.diagnostics,
              newDiagnostic
            ],
            history: [
              ...prev.history,
              {
                type: 'cephalometry',
                data: action.data,
                timestamp: new Date().toISOString(),
                patientId: action.patientId || action.data.patientId
              }
            ]
          };
        
        case 'UPDATE_PHOTOMETRY':
          console.log('Updating photometry data in context:', action.data);
          const photometryDiagnostic = {
            type: 'photometry',
            date: action.data.analysisDate || new Date().toISOString().split('T')[0],
            diagnosis: 'Фотометрический анализ',
            measurements: action.data.measurements || {}
          };
          
          const photometryModuleData = {
            data: action.data,
            updatedAt: new Date().toISOString(),
            patientId: action.patientId || action.data.patientId,
            source: 'data_context'
          };
          
          return {
            ...prev,
            photometry: action.data,
            modules: {
              ...prev.modules,
              photometry: photometryModuleData
            },
            diagnostics: [
              ...prev.diagnostics,
              photometryDiagnostic
            ],
            history: [
              ...prev.history,
              {
                type: 'photometry',
                data: action.data,
                timestamp: new Date().toISOString(),
                patientId: action.patientId || action.data.patientId
              }
            ]
          };
        
        case 'UPDATE_BIOMETRY':
          console.log('Updating biometry data in context:', action.data);
          const biometryDiagnostic = {
            type: 'biometry',
            date: action.data.analysisDate || new Date().toISOString().split('T')[0],
            diagnosis: 'Биометрический анализ зубных рядов',
            measurements: action.data.measurements || {},
            tonIndex: action.data.tonIndex,
            boltonAnalysis: action.data.boltonAnalysis
          };
          
          const biometryModuleData = {
            data: action.data,
            updatedAt: new Date().toISOString(),
            patientId: action.patientId || action.data.patientId,
            source: 'data_context'
          };
          
          return {
            ...prev,
            biometry: action.data,
            modules: {
              ...prev.modules,
              biometry: biometryModuleData
            },
            diagnostics: [
              ...prev.diagnostics,
              biometryDiagnostic
            ],
            history: [
              ...prev.history,
              {
                type: 'biometry',
                data: action.data,
                timestamp: new Date().toISOString(),
                patientId: action.patientId || action.data.patientId
              }
            ]
          };
        
        case 'UPDATE_CT':
          return {
            ...prev,
            ct: action.data,
            modules: {
              ...prev.modules,
              ct: {
                data: action.data,
                updatedAt: new Date().toISOString(),
                source: 'data_context'
              }
            }
          };
        
        case 'UPDATE_MODELING':
          return {
            ...prev,
            modeling: action.data,
            modules: {
              ...prev.modules,
              modeling: {
                data: action.data,
                updatedAt: new Date().toISOString(),
                source: 'data_context'
              }
            }
          };
        
        case 'SET_PATIENT':
          return {
            ...prev,
            patient: action.patient
          };
        
        case 'ADD_DIAGNOSIS':
          return {
            ...prev,
            diagnostics: [
              ...prev.diagnostics,
              action.diagnosis
            ]
          };
        
        case 'ADD_MODULE_DATA':
          return {
            ...prev,
            modules: {
              ...prev.modules,
              [action.moduleType]: {
                data: action.data,
                updatedAt: new Date().toISOString(),
                source: 'data_context'
              }
            }
          };
        
        case 'CLEAR_DATA':
          return {
            patient: null,
            modules: {},
            cephalometry: null,
            photometry: null,
            biometry: null,
            ct: null,
            modeling: null,
            diagnostics: [],
            history: []
          };
        
        default:
          return prev;
      }
    });
  }, []);

  // Функция для добавления измерений (с улучшенной структурой)
  const addMeasurements = useCallback((moduleType, measurements, additionalData = {}) => {
    console.log(`Adding measurements for ${moduleType}:`, measurements, additionalData);
    
    // Получаем ID пациента
    const patientId = currentPatient?.id || medicalCardData.patient?.id || additionalData.patientId || 1;
    
    // Формируем полные данные для сохранения
    const moduleData = {
      moduleType,
      date: new Date().toISOString().split('T')[0],
      measurements,
      patientId,
      patientName: additionalData.patientName || currentPatient?.fullName || 'Пациент',
      analysisDate: additionalData.analysisDate || new Date().toISOString().split('T')[0],
      projectionType: additionalData.projectionType,
      structuredData: additionalData.structuredData,
      report: additionalData.fullReport,
      ...additionalData
    };

    // Обновляем соответствующий модуль
    const actionType = `UPDATE_${moduleType.toUpperCase()}`;
    updateMedicalCardData({
      type: actionType,
      data: moduleData,
      patientId: patientId
    });
    
    // Сохраняем также в localStorage для надежности
    try {
      const storageKey = `${moduleType}_data_${patientId}_${Date.now()}`;
      const storageData = {
        ...moduleData,
        savedAt: new Date().toISOString(),
        source: 'medical_card_context'
      };
      localStorage.setItem(storageKey, JSON.stringify(storageData));
      console.log(`Saved ${moduleType} data to localStorage:`, storageKey);
      
      // Также обновляем основную медицинскую карту
      const medicalCardKey = `medical_card_${patientId}`;
      const existingCard = localStorage.getItem(medicalCardKey);
      let medicalCardData = existingCard ? JSON.parse(existingCard) : {
        patientId: patientId,
        modules: {},
        loadedAt: new Date().toISOString()
      };
      
      // Обновляем данные в медицинской карте
      medicalCardData.modules = {
        ...medicalCardData.modules,
        [moduleType]: {
          data: storageData,
          updatedAt: new Date().toISOString(),
          source: 'direct_save'
        }
      };
      
      // Обновляем интегрированные данные
      if (moduleType === 'photometry' && additionalData.structuredData) {
        medicalCardData.photoAnalysis = {
          ...medicalCardData.photoAnalysis,
          ...additionalData.structuredData
        };
      }
      
      medicalCardData.lastUpdated = new Date().toISOString();
      localStorage.setItem(medicalCardKey, JSON.stringify(medicalCardData));
      console.log(`Updated medical card for patient ${patientId} with ${moduleType} data`);
      
    } catch (storageError) {
      console.error('Error saving to localStorage:', storageError);
    }
    
    return { success: true, patientId, moduleType };
  }, [currentPatient, medicalCardData.patient, updateMedicalCardData]);

  // Функция для получения данных модуля
  const getModuleData = useCallback((moduleType) => {
    return medicalCardData.modules[moduleType] || null;
  }, [medicalCardData.modules]);

  // Функция для получения всех данных пациента
  const getAllPatientData = useCallback(() => {
    return {
      patient: medicalCardData.patient,
      modules: medicalCardData.modules,
      diagnostics: medicalCardData.diagnostics,
      history: medicalCardData.history,
      summary: {
        cephalometry: medicalCardData.cephalometry ? '✓ Данные загружены' : '✗ Нет данных',
        photometry: medicalCardData.photometry ? '✓ Данные загружены' : '✗ Нет данных',
        biometry: medicalCardData.biometry ? '✓ Данные загружены' : '✗ Нет данных',
        ct: medicalCardData.ct ? '✓ Данные загружены' : '✗ Нет данных',
        modeling: medicalCardData.modeling ? '✓ Данные загружены' : '✗ Нет данных'
      }
    };
  }, [medicalCardData]);

  // Функция для загрузки данных фотометрии
  const loadPhotometryData = useCallback((patientId) => {
    if (!patientId) return null;
    
    try {
      // 1. Проверяем в контексте (самые актуальные данные)
      if (medicalCardData.photometry && 
          medicalCardData.photometry.patientId === patientId) {
        console.log('Found photometry data in context for patient:', patientId);
        return medicalCardData.photometry;
      }
      
      // 2. Проверяем в localStorage
      const storageKeys = Object.keys(localStorage).filter(key => 
        key.includes('photometry') && (key.includes(patientId.toString()) || key.includes(`_${patientId}_`))
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
        if (parsed.photoAnalysis && parsed.photoAnalysis.frontal) {
          console.log('Found photoAnalysis data in medical_card:', medicalCardKey);
          return {
            patientId: patientId,
            structuredData: parsed.photoAnalysis,
            source: 'medical_card_analysis'
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error loading photometry data:', error);
      return null;
    }
  }, [medicalCardData]);

  const value = {
    medicalCardData,
    currentPatient,
    setCurrentPatient,
    updateMedicalCardData,
    addMeasurements,
    getModuleData,
    getAllPatientData,
    loadPhotometryData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};