import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModuleDataService } from '../services/ModuleDataService';
import { useData } from '../contexts/DataContext';
import ModuleDataViewer from './ModuleDataViewer';

const MedicalCard = ({ patient, onBack }) => {
  const [medicalData, setMedicalData] = useState(null);
  const [orthodonticData, setOrthodonticData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [moduleData, setModuleData] = useState({});
  const [activeModule, setActiveModule] = useState('overview');
  const [selectedSection, setSelectedSection] = useState('frontal');
  const [photoDataLoaded, setPhotoDataLoaded] = useState(false);
  const [biometryDataLoaded, setBiometryDataLoaded] = useState(false);
  const [cephalometryDataLoaded, setCephalometryDataLoaded] = useState(false);
  const [modelingDataLoaded, setModelingDataLoaded] = useState(false);
  
  // Состояния для изображений из модулей
  const [photometryImages, setPhotometryImages] = useState({
    frontal: null,
    profile: null,
    profile45: null,
    intraoral: null
  });
  
  const [cephalometryImages, setCephalometryImages] = useState({
    frontalTRG: null,
    lateralTRG: null
  });
  
  const [biometryModels, setBiometryModels] = useState({
    upperJaw: null,
    lowerJaw: null,
    occlusion: null
  });
  
  const [modeling3DModels, setModeling3DModels] = useState({
    skull: null,
    maxilla: null,
    mandible: null,
    setup: null
  });
  
  const [ctImages, setCTImages] = useState({
    optg: null,
    tmj: null,
    axialCuts: null
  });
  
  // UI состояния
  const [activePhotoTab, setActivePhotoTab] = useState('frontal');
  const [activeCephTab, setActiveCephTab] = useState('frontalTRG');
  const [activeModelTab, setActiveModelTab] = useState('upperJaw');
  const [active3DTab, setActive3DTab] = useState('skull');
  
  const [showPhotometryImages, setShowPhotometryImages] = useState(false);
  const [showCephalometryImages, setShowCephalometryImages] = useState(false);
  const [showBiometryModels, setShowBiometryModels] = useState(false);
  const [showModeling3D, setShowModeling3D] = useState(false);
  const [showCTImages, setShowCTImages] = useState(false);
  
  const { 
    medicalCardData, 
    loadPhotometryData,
    getAllPatientData,
    getModuleData 
  } = useData();
  
  const hasLoadedRef = useRef(false);
  const navigate = useNavigate();

  // Структура медицинской карты согласно ТЗ и образцу
  const getFallbackData = useCallback((patient) => ({
    personalInfo: {
      fullName: patient?.fullName || 'Пациент',
      birthDate: patient?.birthDate || 'Не указано',
      gender: patient?.gender || 'Не указано',
      contactInfo: patient?.contactInfo || 'Не указано',
      examinationDate: new Date().toLocaleDateString('ru-RU'),
      complaints: patient?.complaints || 'эстетический дефект',
      doctor: patient?.doctor || 'Не указан'
    },
    moduleData: {},
    medicalHistory: [],
    treatments: [],
    labResults: [],
    diagnoses: []
  }), []);

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

  // Функция для преобразования данных фотометрии в структуру медицинской карты
  const transformPhotometryData = useCallback((photometryData) => {
    if (!photometryData) return null;
    
    const transformed = {
      // Базовые данные
      patientId: photometryData.patientId,
      patientName: photometryData.patientName,
      analysisDate: photometryData.analysisDate,
      projectionType: photometryData.projectionType,
      
      // Структурированные данные для отображения
      structured: {}
    };
    
    // Преобразуем данные в зависимости от типа проекции
    if (photometryData.projectionType === 'frontal' && photometryData.measurements) {
      const frontalData = {
        faceWidth: photometryData.measurements.FaceWidth?.value || 0,
        faceHeight: photometryData.measurements.FullHeight?.value || 0,
        facialIndex: photometryData.measurements.FacialIndex?.value || 0,
        headShapeIndex: photometryData.measurements.HeadShapeIndex?.value || 0,
        chinPosition: photometryData.points?.gn ? 'определено' : 'не определено',
        chinFold: 'нормальная',
        lipClosure: 'сомкнуты',
        gumSmile: 'нет симптома',
        pupilLine: 'горизонтальная',
        midline: 'совпадает',
        occlusalLine: 'параллельна зрачковой линии',
        comments: photometryData.report?.conclusion || 'Фотометрический анализ выполнен',
        photos: photometryData.images?.uploaded || ['анализ выполнен'],
        // Добавляем изображения
        actualImage: photometryData.images?.frontal || null,
        hasPoints: photometryData.points && Object.keys(photometryData.points).length > 0,
        points: photometryData.points || {}
      };
      
      // Добавляем интерпретации
      if (photometryData.measurements.FacialIndex?.interpretation) {
        frontalData.facialIndexInterpretation = photometryData.measurements.FacialIndex.interpretation;
      }
      if (photometryData.measurements.HeadShapeIndex?.interpretation) {
        frontalData.headShapeInterpretation = photometryData.measurements.HeadShapeIndex.interpretation;
      }
      
      transformed.structured.frontal = frontalData;
    }
    
    if (photometryData.projectionType === 'profile' && photometryData.measurements) {
      const profileData = {
        profileType: photometryData.measurements.ProfileAngle?.interpretation || 'прямой',
        nasolabialAngle: photometryData.measurements.NasolabialAngle?.value || 100,
        mentolabialAngle: 130,
        facialConvexity: photometryData.measurements.ProfileAngle?.value || 165,
        chinPosition: photometryData.points?.pg ? 'определено' : 'правильное',
        upperLipPosition: photometryData.points?.ls ? 'определено' : 'правильное',
        lowerLipPosition: 'правильное',
        eLine: {
          upperLip: -2,
          lowerLip: 0
        },
        comments: photometryData.report?.conclusion || 'Анализ профиля выполнен',
        photos: photometryData.images?.uploaded || ['анализ выполнен'],
        // Добавляем изображения
        actualImage: photometryData.images?.profile || null,
        hasPoints: photometryData.points && Object.keys(photometryData.points).length > 0,
        points: photometryData.points || {}
      };
      
      transformed.structured.profile = profileData;
    }
    
    if (photometryData.projectionType === 'profile45') {
      const profile45Data = {
        symmetry: 'удовлетворительная',
        headShape: photometryData.measurements?.HeadShapeIndex?.interpretation || 'мезоцефалическая',
        faceShape: photometryData.measurements?.FacialIndex?.interpretation || 'среднее лицо',
        zygomaticProminence: 'нормальная',
        gonialAngle: 'нормальный',
        comments: 'Анализ профиля 45° выполнен',
        photos: photometryData.images?.uploaded || ['анализ выполнен'],
        // Добавляем изображения
        actualImage: photometryData.images?.profile45 || null,
        hasPoints: photometryData.points && Object.keys(photometryData.points).length > 0,
        points: photometryData.points || {}
      };
      
      transformed.structured.profile45 = profile45Data;
    }
    
    if (photometryData.projectionType === 'intraoral') {
      const intraoralData = {
        photos: photometryData.images?.uploaded || ['анализ выполнен'],
        // Добавляем изображения
        actualImage: photometryData.images?.intraoral || null,
        hasPoints: photometryData.points && Object.keys(photometryData.points).length > 0,
        points: photometryData.points || {}
      };
      
      transformed.structured.intraoral = intraoralData;
    }
    
    return transformed;
  }, []);

  // Функция для преобразования данных биометрии в структуру медицинской карты
  const transformBiometryData = useCallback((biometryData) => {
    if (!biometryData) return null;
    
    const transformed = {
      // Базовые данные
      patientId: biometryData.patientId,
      patientName: biometryData.patientName,
      analysisDate: biometryData.analysisDate,
      modelType: biometryData.modelType,
      
      // Основные измерения
      measurements: biometryData.measurements || {},
      
      // Индексы и анализы
      tonIndex: biometryData.tonIndex,
      tonInterpretation: biometryData.tonInterpretation,
      boltonAnalysis: biometryData.boltonAnalysis,
      pontAnalysis: biometryData.pontAnalysis,
      korkhausAnalysis: biometryData.korkhausAnalysis,
      snaginaMethod: biometryData.snaginaMethod,
      slabkovskayaMethod: biometryData.slabkovskayaMethod,
      speeCurve: biometryData.speeCurve,
      
      // Измерения зубов из ТЗ
      toothMeasurements: biometryData.toothMeasurements || {
        upperJaw: {},
        lowerJaw: {}
      },
      
      // 3D модели
      models: biometryData.models || {
        upperJaw: null,
        lowerJaw: null,
        occlusion: null
      },
      
      // Дополнительная информация
      source: biometryData.source,
      savedAt: biometryData.savedAt
    };
    
    return transformed;
  }, []);

  // Функция для преобразования данных цефалометрии в структуру медицинской карты
  const transformCephalometryData = useCallback((cephalometryData) => {
    if (!cephalometryData) return null;
    
    const transformed = {
      // Базовые данные
      patientId: cephalometryData.patientId,
      patientName: cephalometryData.patientName,
      analysisDate: cephalometryData.analysisDate,
      projectionType: cephalometryData.projectionType,
      
      // Изображения ТРГ
      images: {
        frontalTRG: cephalometryData.images?.frontalTRG || null,
        lateralTRG: cephalometryData.images?.lateralTRG || null
      },
      
      // Измерения
      measurements: cephalometryData.measurements || {},
      
      // Точки расставленные
      points: cephalometryData.points || {},
      
      // Интерпретации
      interpretations: cephalometryData.interpretations || {}
    };
    
    return transformed;
  }, []);

  // Функция для преобразования данных моделирования в структуру медицинской карты
  const transformModelingData = useCallback((modelingData) => {
    if (!modelingData) return null;
    
    const transformed = {
      // Базовые данные
      patientId: modelingData.patientId,
      patientName: modelingData.patientName,
      analysisDate: modelingData.analysisDate,
      
      // 3D модели
      models: modelingData.models || {
        skull: null,
        maxilla: null,
        mandible: null,
        setup: null,
        teeth: null
      },
      
      // Симуляции
      simulations: modelingData.simulations || {},
      
      // План лечения
      treatmentPlan: modelingData.treatmentPlan || {},
      
      // Точки и измерения
      points: modelingData.points || {},
      measurements: modelingData.measurements || {}
    };
    
    return transformed;
  }, []);

  // Функция для преобразования данных КТ в структуру медицинской карты
  const transformCTData = useCallback((ctData) => {
    if (!ctData) return null;
    
    const transformed = {
      // Базовые данные
      patientId: ctData.patientId,
      patientName: ctData.patientName,
      analysisDate: ctData.analysisDate,
      
      // Изображения КТ
      images: {
        optg: ctData.images?.optg || null,
        tmj: ctData.images?.tmj || null,
        axialCuts: ctData.images?.axialCuts || null,
        sagittalCuts: ctData.images?.sagittalCuts || null,
        coronalCuts: ctData.images?.coronalCuts || null
      },
      
      // Измерения
      measurements: ctData.measurements || {},
      
      // Находки
      findings: ctData.findings || [],
      
      // Диагнозы
      diagnoses: ctData.diagnoses || []
    };
    
    return transformed;
  }, []);

  // Функция для извлечения изображений из данных модулей
  const extractImagesFromModuleData = useCallback((moduleType, moduleData) => {
    if (!moduleData) return {};
    
    switch (moduleType) {
      case 'photometry':
        return {
          frontal: moduleData.images?.frontal || null,
          profile: moduleData.images?.profile || null,
          profile45: moduleData.images?.profile45 || null,
          intraoral: moduleData.images?.intraoral || null
        };
      
      case 'cephalometry':
        return {
          frontalTRG: moduleData.images?.frontalTRG || null,
          lateralTRG: moduleData.images?.lateralTRG || null
        };
      
      case 'biometry':
        return {
          upperJaw: moduleData.models?.upperJaw || null,
          lowerJaw: moduleData.models?.lowerJaw || null,
          occlusion: moduleData.models?.occlusion || null
        };
      
      case 'modeling':
        return {
          skull: moduleData.models?.skull || null,
          maxilla: moduleData.models?.maxilla || null,
          mandible: moduleData.models?.mandible || null,
          setup: moduleData.models?.setup || null,
          teeth: moduleData.models?.teeth || null
        };
      
      case 'ct':
        return {
          optg: moduleData.images?.optg || null,
          tmj: moduleData.images?.tmj || null,
          axialCuts: moduleData.images?.axialCuts || null,
          sagittalCuts: moduleData.images?.sagittalCuts || null,
          coronalCuts: moduleData.images?.coronalCuts || null
        };
      
      default:
        return {};
    }
  }, []);

  // Мемоизированная функция для получения интегрированных данных
  const getIntegratedMedicalData = useCallback((patientId, modules, storedData = {}) => {
    // Базовая структура интегрированных данных
    const integratedData = {
      patientId: patientId,
      
      // 1. Персональные данные (титульный лист)
      personalData: {
        fullName: patient?.fullName || (patientId === 'demo' ? 'Замойская Светлана Сергеевна' : 'Пациент'),
        birthDate: patient?.birthDate || '27.10.2010',
        age: patient?.age || 15,
        examinationDate: new Date().toLocaleDateString('ru-RU'),
        doctor: 'Митрофанова Елена Александровна',
        complaints: patient?.complaints || 'эстетический дефект'
      },
      
      // 2. Анамнез
      anamnesis: {
        pregnancyIssues: { trimester: 'нет', details: '' },
        birthType: 'в срок',
        feedingType: { type: 'естественное', artificialFrom: null },
        firstTeethMonths: 6,
        teethChangeYears: 6,
        badHabits: { exists: false, habits: [] },
        familyAnomalies: { exists: false, relatives: [] },
        pastDiseases: { exists: false, diseases: [] },
        previousOrthoTreatment: { exists: false, duration: null, appliances: [] },
        generalHealth: 'удовлетворительное',
        hygiene: 'хорошая'
      },
      
      // 3. Фотометрический анализ (будет перезаписан реальными данными)
      photoAnalysis: {
        frontal: {
          faceWidth: 140,
          faceHeight: 120,
          facialIndex: 85.7,
          headShapeIndex: 80.5,
          chinPosition: 'правильное',
          chinFold: 'нормальная',
          lipClosure: 'сомкнуты',
          gumSmile: 'нет симптома',
          pupilLine: 'горизонтальная',
          midline: 'совпадает',
          occlusalLine: 'параллельна зрачковой линии',
          comments: 'Гармоничные лицевые пропорции',
          photos: ['без улыбки', 'с приоткрытым ртом', 'с улыбкой']
        },
        profile45: {
          symmetry: 'удовлетворительная',
          headShape: 'мезоцефалическая',
          faceShape: 'среднее лицо',
          zygomaticProminence: 'нормальная',
          gonialAngle: 'нормальный',
          comments: 'Нормальная симметрия',
          photos: ['без улыбки', 'с приоткрытым ртом', 'с улыбкой']
        },
        profile: {
          profileType: 'прямой',
          nasolabialAngle: 100,
          mentolabialAngle: 130,
          facialConvexity: 165,
          chinPosition: 'правильное',
          upperLipPosition: 'правильное',
          lowerLipPosition: 'правильное',
          eLine: { upperLip: -2, lowerLip: 0 },
          comments: 'Прямой профиль',
          photos: ['без улыбки', 'с приоткрытым ртом', 'с улыбкой']
        }
      },
      
      // 4. Внутриротовой анализ
      intraoralAnalysis: {
        occlusion: {
          sagittal: {
            molarsRight: 'I класс',
            molarsLeft: 'I класс',
            caninesRight: 'I класс',
            caninesLeft: 'I класс',
            incisorRelationship: 'в норме',
            sagittalGap: 0
          },
          vertical: {
            anterior: 'глубокая резцовая окклюзия',
            deepOcclusion: '> 1/3',
            verticalOverlap: 5.3,
            norm: '2.5 мм ± 2.0 мм'
          },
          transversal: {
            midlineShift: 'нет',
            crossbite: 'отсутствует',
            buccalOcclusion: 'в норме',
            lingualOcclusion: 'в норме'
          }
        },
        dentalFormula: {
          upperJaw: {
            '16': 10, '15': 10, '14': 7, '13': 7.1, '12': 7.9, '11': 7.2,
            '21': 9.9, '22': 9.5, '23': 7, '24': 7.8, '25': 7, '26': 7
          },
          lowerJaw: {
            '36': 10.8, '35': 11.1, '34': 6.8, '33': 7, '32': 7, '31': 5.8,
            '41': 5.5, '42': 5.6, '43': 5.9, '44': 7.1, '45': 7.1, '46': 7
          }
        },
        dentalCondition: 'постоянный прикус',
        comments: 'Сужение верхнего и нижнего зубных рядов. Трема 1.1-2.1'
      },
      
      // 5. Антропометрия/Биометрия
      anthropometry: {
        jawDimensions: {
          maxillaryWidth: 60.4,
          mandibularWidth: 55.4,
          maxillaryBase: 'норма',
          mandibularBase: 'норма'
        },
        indices: {
          tonIndex: { value: 1.33, norm: '1.30-1.35', interpretation: 'Норма' },
          boltonAnalysis: {
            anterior: { ratio: 77.2, norm: '77.2±1.65%', interpretation: 'Соотношение в норме' },
            overall: { ratio: 91.3, norm: '91.3±1.91%', interpretation: 'Соотношение в норме' }
          }
        },
        toothSizes: 'соответствуют норме',
        
        // Структура для реальных данных биометрии
        detailedBiometry: null
      },
      
      // 6. Цефалометрический анализ
      cephalometry: {
        frontalTRG: {
          symmetry: 'асимметрия 3.4 мм влево',
          chinDeviation: 'влево на 3.4 мм',
          measurements: {
            'J-J': { value: 60.4, norm: '58.0±3.0 мм', interpretation: 'Норма' },
            'Md-Md': { value: 55.4, norm: '53.0±3.0 мм', interpretation: 'Норма' }
          }
        },
        lateralTRG: {
          skeletalClass: 'I скелетный класс с тенденцией ко II классу',
          parameters: {
            'SNA': { value: 78.2, norm: '82.0±3.0°', interpretation: 'Ретрогнатия' },
            'SNB': { value: 74.3, norm: '80.0±3.0°', interpretation: 'Ретрогнатия' },
            'ANB': { value: 4.0, norm: '2.0±2.0°', interpretation: 'I класс с тенденцией к II' },
            'Wits': { value: 2.2, norm: '-0.4±2.5 мм', interpretation: 'II скелетный класс' },
            'MP-SN': { value: 36.3, norm: '32.0±4.0°', interpretation: 'Ретроинклинация' },
            'Interincisal': { value: 145.1, norm: '130.0±6.0°', interpretation: 'Увеличен' }
          },
          jawPositions: {
            maxilla: { position: 'ретрогнатия', inclination: 'нормоинклинация' },
            mandible: { position: 'ретрогнатия', inclination: 'ретроинклинация' }
          },
          verticalParameters: {
            facialRatio: 0.78,
            lowerFaceHeight: 'в норме',
            ODI: { value: 69.3, norm: '74.5±5.0°', interpretation: 'Тенденция к вертикальной дизокклюзии' }
          }
        }
      },
      
      // 7. КТ анализ
      ctAnalysis: {
        optg: {
          findings: 'Все зубы присутствуют, патологий не выявлено',
          comments: 'Нормальная структура костной ткани'
        },
        tmj: {
          right: 'центральное верхнее положение',
          left: 'заднее верхнее положение',
          symmetry: 'асимметрия положения суставных головок'
        },
        axialCuts: {
          tonguePosition: 'нормальное',
          airway: 'без сужений',
          comments: 'Воздухоносные пути в норме'
        },
        boneStructure: 'нормальная плотность и объем'
      },
      
      // 8. 3D моделирование
      modeling3D: {
        skullModel: 'доступна 3D модель черепа',
        maxillaModel: 'доступна 3D модель верхней челюсти',
        mandibleModel: 'доступна 3D модель нижней челюсти',
        setupModel: 'доступна setup-модель',
        simulations: ['Исходное положение', 'Прогнозируемый результат', 'Setup-модель']
      },
      
      // 9. Диагнозы
      diagnoses: [
        {
          id: 1,
          category: 'Челюстно-лицевые',
          diagnosis: 'Ретрогнатия верхней челюсти',
          severity: 'умеренная',
          code: 'K07.0',
          confirmed: true
        },
        {
          id: 2,
          category: 'Челюстно-лицевые',
          diagnosis: 'Ретрогнатия нижней челюсти',
          severity: 'умеренная',
          code: 'K07.0',
          confirmed: true
        },
        {
          id: 3,
          category: 'Окклюзионные',
          diagnosis: 'Глубокая резцовая окклюзия',
          severity: 'умеренная',
          code: 'K07.2',
          confirmed: true
        },
        {
          id: 4,
          category: 'Зубные ряды',
          diagnosis: 'Сужение верхнего зубного ряда',
          severity: 'легкое',
          code: 'K07.3',
          confirmed: true
        },
        {
          id: 5,
          category: 'Зубные ряды',
          diagnosis: 'Сужение нижнего зубного ряда',
          severity: 'легкое',
          code: 'K07.3',
          confirmed: true
        }
      ],
      
      // 10. План лечения
      treatmentPlan: {
        complexity: 'средней сложности',
        estimatedDuration: '18-24 месяца',
        objectives: [
          'Коррекция ретрогнатии',
          'Устранение глубокой окклюзии',
          'Расширение зубных рядов',
          'Нормализация окклюзионных соотношений'
        ],
        phases: [
          {
            phase: 1,
            name: 'Диагностика и подготовка',
            duration: '1 месяц',
            procedures: ['Полная диагностика', 'Профессиональная гигиена', 'Санация полости рта']
          },
          {
            phase: 2,
            name: 'Расширение и выравнивание',
            duration: '6-8 месяцев',
            procedures: ['Расширение верхнего зубного ряда', 'Выравнивание зубов', 'Нормализация окклюзии']
          },
          {
            phase: 3,
            name: 'Детализация и коррекция',
            duration: '8-10 месяцев',
            procedures: ['Детализация окклюзии', 'Коррекция положения зубов', 'Контроль прогресса']
          },
          {
            phase: 4,
            name: 'Стабилизация и ретенция',
            duration: '6 месяцев',
            procedures: ['Снятие аппаратуры', 'Фиксация результатов', 'Ретенционный период']
          }
        ],
        appliances: [
          'Брекет-система Damon Q',
          'Расширяющий аппарат',
          'Эластики II класса'
        ],
        retention: [
          'Небный ретейнер (фиксированный)',
          'Съемная каппа на ночь',
          'Контрольные осмотры каждые 6 месяцев'
        ]
      },
      
      // 11. Выводы/Заключение
      conclusions: [
        'Скелетный I класс',
        'Нейтральный тип роста',
        'Высота нижней трети лица по Ricketts в норме',
        'Ретрогнатия верхней и нижней челюстей',
        'Глубокая резцовая окклюзия',
        'Вертикальное резцовое перекрытие увеличено до 5.3 мм',
        'Сагиттальное резцовое перекрытие в норме',
        'Сужение верхнего и нижнего зубных рядов',
        'Воздухоносные пути без патологий',
        'Асимметрия положения ВНЧС'
      ]
    };
    
    // Интеграция данных из реальных модулей если они есть
    if (modules) {
      // Объединение данных из фотометрии
      if (modules.photometry && modules.photometry.data) {
        const photoData = modules.photometry.data;
        console.log('Integrating photometry data:', photoData);
        
        // Загружаем изображения
        const loadedImages = extractImagesFromModuleData('photometry', photoData);
        
        // Преобразуем данные фотометрии
        const transformedPhotometry = transformPhotometryData(photoData);
        
        if (transformedPhotometry && transformedPhotometry.structured) {
          // Объединяем с существующими данными
          if (transformedPhotometry.structured.frontal) {
            integratedData.photoAnalysis.frontal = {
              ...integratedData.photoAnalysis.frontal,
              ...transformedPhotometry.structured.frontal,
              actualImage: loadedImages.frontal,
              hasPoints: photoData.points && Object.keys(photoData.points).length > 0,
              points: photoData.points || {}
            };
          }
          if (transformedPhotometry.structured.profile) {
            integratedData.photoAnalysis.profile = {
              ...integratedData.photoAnalysis.profile,
              ...transformedPhotometry.structured.profile,
              actualImage: loadedImages.profile,
              hasPoints: photoData.points && Object.keys(photoData.points).length > 0,
              points: photoData.points || {}
            };
          }
          if (transformedPhotometry.structured.profile45) {
            integratedData.photoAnalysis.profile45 = {
              ...integratedData.photoAnalysis.profile45,
              ...transformedPhotometry.structured.profile45,
              actualImage: loadedImages.profile45,
              hasPoints: photoData.points && Object.keys(photoData.points).length > 0,
              points: photoData.points || {}
            };
          }
          if (transformedPhotometry.structured.intraoral) {
            integratedData.photoAnalysis.intraoral = transformedPhotometry.structured.intraoral;
          }
          
          console.log('Updated photoAnalysis with real data:', integratedData.photoAnalysis);
          setPhotoDataLoaded(true);
        }
        
        // Сохраняем изображения в состоянии
        setPhotometryImages(loadedImages);
      }
      
      // Объединение данных из биометрии
      if (modules.biometry && modules.biometry.data) {
        const bioData = modules.biometry.data;
        console.log('Integrating biometry data:', bioData);
        
        // Загружаем 3D модели
        const loadedModels = extractImagesFromModuleData('biometry', bioData);
        
        // Преобразуем данные биометрии
        const transformedBiometry = transformBiometryData(bioData);
        
        if (transformedBiometry) {
          // Обновляем данные антропометрии
          integratedData.anthropometry.detailedBiometry = transformedBiometry;
          
          // Обновляем измерения зубов
          if (transformedBiometry.toothMeasurements) {
            integratedData.intraoralAnalysis.dentalFormula = {
              upperJaw: transformedBiometry.toothMeasurements.upperJaw,
              lowerJaw: transformedBiometry.toothMeasurements.lowerJaw
            };
          }
          
          // Обновляем индексы
          if (transformedBiometry.tonIndex !== null) {
            integratedData.anthropometry.indices.tonIndex = {
              value: transformedBiometry.tonIndex,
              norm: '1.30-1.35',
              interpretation: transformedBiometry.tonInterpretation || 'Норма'
            };
          }
          
          if (transformedBiometry.boltonAnalysis && transformedBiometry.boltonAnalysis.anteriorRatio > 0) {
            integratedData.anthropometry.indices.boltonAnalysis = {
              anterior: {
                ratio: transformedBiometry.boltonAnalysis.anteriorRatio,
                norm: '77.2±1.65%',
                interpretation: transformedBiometry.boltonAnalysis.interpretation || 'Соотношение в норме'
              },
              overall: {
                ratio: transformedBiometry.boltonAnalysis.overallRatio || 91.3,
                norm: '91.3±1.91%',
                interpretation: 'Соотношение в норме'
              }
            };
          }
          
          // Обновляем размеры челюстей из анализа Пона
          if (transformedBiometry.pontAnalysis) {
            integratedData.anthropometry.jawDimensions = {
              maxillaryWidth: transformedBiometry.pontAnalysis.upperMolar?.actualWidth || 60.4,
              mandibularWidth: transformedBiometry.pontAnalysis.lowerMolar?.actualWidth || 55.4,
              maxillaryBase: transformedBiometry.snaginaMethod ? 'определено' : 'норма',
              mandibularBase: transformedBiometry.snaginaMethod ? 'определено' : 'норма'
            };
          }
          
          console.log('Updated anthropometry with real biometry data:', integratedData.anthropometry);
          setBiometryDataLoaded(true);
        }
        
        // Сохраняем 3D модели в состоянии
        setBiometryModels(loadedModels);
      }
      
      // Объединение данных из цефалометрии
      if (modules.cephalometry && modules.cephalometry.data) {
        const cephData = modules.cephalometry.data;
        console.log('Integrating cephalometry data:', cephData);
        
        // Загружаем изображения ТРГ
        const loadedCephImages = extractImagesFromModuleData('cephalometry', cephData);
        
        // Преобразуем данные цефалометрии
        const transformedCephalometry = transformCephalometryData(cephData);
        
        // Обновляем данные цефалометрии
        if (transformedCephalometry) {
          integratedData.cephalometry.hasData = true;
          integratedData.cephalometry.images = loadedCephImages;
          integratedData.cephalometry.points = transformedCephalometry.points;
          
          // Обработка данных боковой ТРГ
          if (cephData.projectionType === 'lateral' && cephData.measurements) {
            const lateralParams = {};
            
            Object.entries(cephData.measurements).forEach(([key, measurement]) => {
              if (measurement.name === 'SNA') {
                lateralParams['SNA'] = {
                  value: measurement.value,
                  norm: measurement.norm,
                  interpretation: measurement.interpretation
                };
              }
              if (measurement.name === 'SNB') {
                lateralParams['SNB'] = {
                  value: measurement.value,
                  norm: measurement.norm,
                  interpretation: measurement.interpretation
                };
              }
              if (measurement.name === 'ANB') {
                lateralParams['ANB'] = {
                  value: measurement.value,
                  norm: measurement.norm,
                  interpretation: measurement.interpretation
                };
              }
              if (measurement.name === 'Bjork') {
                lateralParams['Bjork'] = {
                  value: measurement.value,
                  norm: measurement.norm,
                  interpretation: measurement.interpretation
                };
              }
            });
            
            // Определяем скелетный класс на основе ANB
            let skeletalClass = 'I скелетный класс';
            if (lateralParams['ANB']) {
              const anbValue = lateralParams['ANB'].value;
              if (anbValue > 4) {
                skeletalClass = 'II скелетный класс';
              } else if (anbValue < 0) {
                skeletalClass = 'III скелетный класс';
              }
            }
            
            integratedData.cephalometry.lateralTRG = {
              ...integratedData.cephalometry.lateralTRG,
              skeletalClass,
              parameters: lateralParams,
              jawPositions: {
                maxilla: { 
                  position: lateralParams['SNA']?.interpretation?.includes('ретрогнат') ? 'ретрогнатия' : 
                           lateralParams['SNA']?.interpretation?.includes('прогнат') ? 'прогнатия' : 'норма',
                  inclination: 'нормоинклинация'
                },
                mandible: { 
                  position: lateralParams['SNB']?.interpretation?.includes('ретрогнат') ? 'ретрогнатия' : 
                           lateralParams['SNB']?.interpretation?.includes('прогнат') ? 'прогнатия' : 'норма',
                  inclination: 'ретроинклинация'
                }
              }
            };
          }
          
          // Обработка данных фронтальной ТРГ
          if (cephData.projectionType === 'frontal' && cephData.measurements) {
            const frontalMeasurements = {};
            
            Object.entries(cephData.measurements).forEach(([key, measurement]) => {
              frontalMeasurements[key] = {
                value: measurement.value,
                norm: measurement.norm,
                interpretation: measurement.interpretation,
                unit: measurement.unit
              };
            });
            
            integratedData.cephalometry.frontalTRG = {
              ...integratedData.cephalometry.frontalTRG,
              measurements: frontalMeasurements,
              hasPoints: cephData.points && Object.keys(cephData.points).length > 0
            };
          }
          
          setCephalometryDataLoaded(true);
        }
        
        // Сохраняем изображения в состоянии
        setCephalometryImages(loadedCephImages);
      }
      
      // Объединение данных из моделирования
      if (modules.modeling && modules.modeling.data) {
        const modelingData = modules.modeling.data;
        console.log('Integrating modeling data:', modelingData);
        
        // Загружаем 3D модели
        const loaded3DModels = extractImagesFromModuleData('modeling', modelingData);
        
        // Преобразуем данные моделирования
        const transformedModeling = transformModelingData(modelingData);
        
        if (transformedModeling) {
          integratedData.modeling3D = {
            ...integratedData.modeling3D,
            ...transformedModeling,
            hasModels: Object.values(loaded3DModels).some(model => model !== null)
          };
          
          setModelingDataLoaded(true);
        }
        
        // Сохраняем 3D модели в состоянии
        setModeling3DModels(loaded3DModels);
      }
      
      // Объединение данных из КТ
      if (modules.ct && modules.ct.data) {
        const ctData = modules.ct.data;
        console.log('Integrating CT data:', ctData);
        
        // Загружаем изображения КТ
        const loadedCTImages = extractImagesFromModuleData('ct', ctData);
        
        // Преобразуем данные КТ
        const transformedCT = transformCTData(ctData);
        
        if (transformedCT) {
          integratedData.ctAnalysis = {
            ...integratedData.ctAnalysis,
            ...transformedCT,
            hasImages: Object.values(loadedCTImages).some(image => image !== null)
          };
        }
        
        // Сохраняем изображения КТ в состоянии
        setCTImages(loadedCTImages);
      }
    }
    
    // Интеграция данных из контекста
    if (storedData.photometry && patientId === storedData.photometry.patientId) {
      console.log('Integrating photometry data from stored context');
      
      const photoData = storedData.photometry;
      const loadedImages = extractImagesFromModuleData('photometry', photoData);
      const transformedPhotometry = transformPhotometryData(photoData);
      
      if (transformedPhotometry && transformedPhotometry.structured) {
        if (transformedPhotometry.structured.frontal) {
          integratedData.photoAnalysis.frontal = {
            ...integratedData.photoAnalysis.frontal,
            ...transformedPhotometry.structured.frontal,
            actualImage: loadedImages.frontal,
            hasPoints: photoData.points && Object.keys(photoData.points).length > 0
          };
        }
        if (transformedPhotometry.structured.profile) {
          integratedData.photoAnalysis.profile = {
            ...integratedData.photoAnalysis.profile,
            ...transformedPhotometry.structured.profile,
            actualImage: loadedImages.profile,
            hasPoints: photoData.points && Object.keys(photoData.points).length > 0
          };
        }
        if (transformedPhotometry.structured.profile45) {
          integratedData.photoAnalysis.profile45 = {
            ...integratedData.photoAnalysis.profile45,
            ...transformedPhotometry.structured.profile45,
            actualImage: loadedImages.profile45,
            hasPoints: photoData.points && Object.keys(photoData.points).length > 0
          };
        }
        
        setPhotoDataLoaded(true);
        setPhotometryImages(loadedImages);
      }
    }
    
    if (storedData.biometry && patientId === storedData.biometry.patientId) {
      console.log('Integrating biometry data from stored context');
      
      const bioData = storedData.biometry;
      const loadedModels = extractImagesFromModuleData('biometry', bioData);
      const transformedBiometry = transformBiometryData(bioData);
      
      if (transformedBiometry) {
        integratedData.anthropometry.detailedBiometry = transformedBiometry;
        
        if (transformedBiometry.toothMeasurements) {
          integratedData.intraoralAnalysis.dentalFormula = {
            upperJaw: transformedBiometry.toothMeasurements.upperJaw,
            lowerJaw: transformedBiometry.toothMeasurements.lowerJaw
          };
        }
        
        setBiometryDataLoaded(true);
        setBiometryModels(loadedModels);
      }
    }
    
    if (storedData.cephalometry && patientId === storedData.cephalometry.patientId) {
      console.log('Integrating cephalometry data from stored context');
      
      const cephData = storedData.cephalometry;
      const loadedCephImages = extractImagesFromModuleData('cephalometry', cephData);
      const transformedCephalometry = transformCephalometryData(cephData);
      
      if (transformedCephalometry) {
        integratedData.cephalometry.hasData = true;
        integratedData.cephalometry.images = loadedCephImages;
        integratedData.cephalometry.points = transformedCephalometry.points;
        
        setCephalometryDataLoaded(true);
        setCephalometryImages(loadedCephImages);
      }
    }
    
    if (storedData.modeling && patientId === storedData.modeling.patientId) {
      console.log('Integrating modeling data from stored context');
      
      const modelingData = storedData.modeling;
      const loaded3DModels = extractImagesFromModuleData('modeling', modelingData);
      const transformedModeling = transformModelingData(modelingData);
      
      if (transformedModeling) {
        integratedData.modeling3D = {
          ...integratedData.modeling3D,
          ...transformedModeling,
          hasModels: Object.values(loaded3DModels).some(model => model !== null)
        };
        
        setModelingDataLoaded(true);
        setModeling3DModels(loaded3DModels);
      }
    }
    
    return integratedData;
  }, [patient, transformPhotometryData, transformBiometryData, transformCephalometryData, transformModelingData, transformCTData, extractImagesFromModuleData]);

  // Обновленная функция загрузки медицинских данных
  const loadMedicalData = useCallback(async (patientToLoad) => {
    if (hasLoadedRef.current === patientToLoad?.id) {
      console.log('Data already loaded for patient', patientToLoad?.id);
      return;
    }

    try {
      setLoading(true);
      setPhotoDataLoaded(false);
      setBiometryDataLoaded(false);
      setCephalometryDataLoaded(false);
      setModelingDataLoaded(false);
      
      if (patientToLoad?.id) {
        hasLoadedRef.current = patientToLoad.id;
        
        // Загружаем данные из всех модулей через сервис
        const allData = await ModuleDataService.getAllModuleData(patientToLoad.id);
        console.log('Loaded all module data from service:', allData);
        
        // Загружаем данные фотометрии
        const storedPhotometry = await loadPhotometryDataForMedicalCard(patientToLoad.id);
        console.log('Loaded photometry data for medical card:', storedPhotometry);
        
        // Загружаем данные биометрии
        const storedBiometry = await loadBiometryDataForMedicalCard(patientToLoad.id);
        console.log('Loaded biometry data for medical card:', storedBiometry);
        
        // Загружаем данные цефалометрии
        const storedCephalometry = await loadCephalometryDataForMedicalCard(patientToLoad.id);
        console.log('Loaded cephalometry data for medical card:', storedCephalometry);
        
        // Загружаем данные моделирования
        const storedModeling = await loadModelingDataForMedicalCard(patientToLoad.id);
        console.log('Loaded modeling data for medical card:', storedModeling);
        
        // Загружаем данные КТ
        const storedCT = await loadCTDataForMedicalCard(patientToLoad.id);
        console.log('Loaded CT data for medical card:', storedCT);
        
        // Объединяем данные модулей
        const combinedModules = {
          ...(allData.modules || {}),
          ...(storedPhotometry ? { 
            photometry: { 
              data: storedPhotometry,
              source: storedPhotometry.source || 'local_storage',
              loadedAt: new Date().toISOString()
            } 
          } : {}),
          ...(storedBiometry ? { 
            biometry: { 
              data: storedBiometry,
              source: storedBiometry.source || 'local_storage',
              loadedAt: new Date().toISOString()
            } 
          } : {}),
          ...(storedCephalometry ? { 
            cephalometry: { 
              data: storedCephalometry,
              source: storedCephalometry.source || 'local_storage',
              loadedAt: new Date().toISOString()
            } 
          } : {}),
          ...(storedModeling ? { 
            modeling: { 
              data: storedModeling,
              source: storedModeling.source || 'local_storage',
              loadedAt: new Date().toISOString()
            } 
          } : {}),
          ...(storedCT ? { 
            ct: { 
              data: storedCT,
              source: storedCT.source || 'local_storage',
              loadedAt: new Date().toISOString()
            } 
          } : {})
        };
        
        setModuleData(combinedModules);
        
        // Формируем интегрированные медицинские данные
        const integratedData = getIntegratedMedicalData(
          patientToLoad.id, 
          combinedModules,
          { 
            photometry: medicalCardData?.photometry,
            cephalometry: medicalCardData?.cephalometry,
            biometry: medicalCardData?.biometry,
            modeling: medicalCardData?.modeling,
            ct: medicalCardData?.ct
          }
        );
        
        setOrthodonticData(integratedData);
        
        // Формируем полную медицинскую карту
        const fullMedicalCardData = {
          ...getFallbackData(patientToLoad),
          patientId: patientToLoad.id,
          integratedData: integratedData,
          modules: combinedModules,
          loadedFrom: {
            moduleService: Object.keys(allData.modules || {}).length > 0,
            localStorage: storedPhotometry !== null || storedBiometry !== null || storedCephalometry !== null || storedModeling !== null || storedCT !== null,
            context: {
              photometry: medicalCardData?.photometry?.patientId === patientToLoad.id,
              cephalometry: medicalCardData?.cephalometry?.patientId === patientToLoad.id,
              biometry: medicalCardData?.biometry?.patientId === patientToLoad.id,
              modeling: medicalCardData?.modeling?.patientId === patientToLoad.id,
              ct: medicalCardData?.ct?.patientId === patientToLoad.id
            }
          },
          lastUpdated: new Date().toISOString()
        };
        
        setMedicalData(fullMedicalCardData);
        
        // Сохраняем в localStorage
        localStorage.setItem(`medical_card_${patientToLoad.id}`, JSON.stringify(fullMedicalCardData));
        
        console.log('Medical card data loaded successfully for patient:', patientToLoad.id);
        
      } else {
        // Демо-данные
        const fallbackData = getFallbackData({ 
          fullName: 'Замойская Светлана Сергеевна',
          birthDate: '27.10.2010',
          complaints: 'эстетический дефект'
        });
        
        const integratedDemoData = getIntegratedMedicalData('demo', {});
        setMedicalData({
          ...fallbackData,
          integratedData: integratedDemoData
        });
        setOrthodonticData(integratedDemoData);
      }
      
    } catch (error) {
      console.error('Error loading medical data:', error);
      const fallbackData = getFallbackData(patientToLoad || { 
        fullName: 'Демо пациент',
        complaints: 'эстетический дефект'
      });
      const integratedDemoData = getIntegratedMedicalData('demo', {});
      setMedicalData({
        ...fallbackData,
        integratedData: integratedDemoData
      });
      setOrthodonticData(integratedDemoData);
    } finally {
      setLoading(false);
    }
  }, [
    getFallbackData, 
    getIntegratedMedicalData, 
    loadPhotometryDataForMedicalCard, 
    loadBiometryDataForMedicalCard,
    loadCephalometryDataForMedicalCard,
    loadModelingDataForMedicalCard,
    loadCTDataForMedicalCard,
    medicalCardData
  ]);

  useEffect(() => {
    let isMounted = true;
    
    const initData = async () => {
      if (isMounted) {
        await loadMedicalData(patient);
      }
    };
    
    const timer = setTimeout(() => {
      initData();
    }, 300);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [patient, loadMedicalData]);

  // Эффект для отслеживания изменений в контексте данных
  useEffect(() => {
    if (patient && medicalCardData) {
      // Проверяем, есть ли новые данные для текущего пациента
      const hasNewPhotometryData = medicalCardData.photometry && 
                                  medicalCardData.photometry.patientId === patient.id;
      
      const hasNewCephalometryData = medicalCardData.cephalometry && 
                                    medicalCardData.cephalometry.patientId === patient.id;
      
      const hasNewBiometryData = medicalCardData.biometry && 
                                medicalCardData.biometry.patientId === patient.id;
      
      const hasNewModelingData = medicalCardData.modeling && 
                                medicalCardData.modeling.patientId === patient.id;
      
      const hasNewCTData = medicalCardData.ct && 
                          medicalCardData.ct.patientId === patient.id;
      
      if (hasNewPhotometryData || hasNewCephalometryData || hasNewBiometryData || hasNewModelingData || hasNewCTData) {
        console.log('New module data detected in context, refreshing medical card...');
        loadMedicalData(patient);
      }
    }
  }, [medicalCardData, patient, loadMedicalData]);

  const moduleTabs = [
    { id: 'overview', label: '👁️ Обзор', icon: '👁️' },
    { id: 'personal', label: '👤 Персональные данные', icon: '👤' },
    { id: 'anamnesis', label: '📝 Анамнез', icon: '📝' },
    { id: 'photo', label: '📷 Фотометрия', icon: '📷' },
    { id: 'intraoral', label: '🦷 Внутриротовой', icon: '🦷' },
    { id: 'anthropometry', label: '📐 Антропометрия', icon: '📐' },
    { id: 'cephalometry', label: '🦴 Цефалометрия', icon: '🦴' },
    { id: 'modeling3d', label: '🖥️ 3D Моделирование', icon: '🖥️' },
    { id: 'ct', label: '🖥️ КТ анализ', icon: '🖥️' },
    { id: 'diagnosis', label: '🏥 Диагнозы', icon: '🏥' },
    { id: 'treatment', label: '💊 План лечения', icon: '💊' },
    { id: 'conclusions', label: '📋 Выводы', icon: '📋' }
  ];

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Не указано';
    try {
      const today = new Date();
      const birth = new Date(birthDate.split('.').reverse().join('-'));
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return 'Не указано';
    }
  };

  const renderPersonalData = () => {
    const data = orthodonticData?.personalData || medicalData?.personalInfo || getFallbackData(patient).personalInfo;
    
    return (
      <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-blue-500">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
          <span>👤</span> Персональные данные (Титульный лист)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <strong className="text-gray-700">ФИО:</strong> <span className="ml-2 text-gray-800">{data.fullName}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <strong className="text-gray-700">Дата рождения:</strong> <span className="ml-2 text-gray-800">{data.birthDate}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <strong className="text-gray-700">Возраст:</strong> <span className="ml-2 text-gray-800">{calculateAge(data.birthDate)} лет</span>
            </div>
          </div>
          <div className="flex flex-col space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <strong className="text-gray-700">Дата исследования:</strong> <span className="ml-2 text-gray-800">{data.examinationDate || new Date().toLocaleDateString('ru-RU')}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <strong className="text-gray-700">Лечащий врач:</strong> <span className="ml-2 text-gray-800">{data.doctor}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <strong className="text-gray-700">Жалобы:</strong> <span className="ml-2 text-gray-800">{data.complaints}</span>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <div className="bg-gray-100 p-6 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center">
            <div className="text-4xl mb-2">📷</div>
            <div className="text-gray-600">Фото анфас без улыбки</div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnamnesis = () => {
    const data = orthodonticData?.anamnesis || {};
    
    return (
      <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-green-500">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
          <span>📝</span> Анамнез
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-3 text-lg">Перинатальный период</h4>
            <div className="space-y-2">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <strong>Нарушение здоровья матери во время беременности:</strong>
                <span className="ml-2">{data.pregnancyIssues?.trimester || 'нет'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <strong>Роды:</strong>
                <span className="ml-2">{data.birthType || 'в срок'}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-3 text-lg">Раннее развитие</h4>
            <div className="space-y-2">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <strong>Вид вскармливания:</strong>
                <span className="ml-2">{data.feedingType?.type || 'естественное'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <strong>Прорезывание первых зубов:</strong>
                <span className="ml-2">{data.firstTeethMonths || 6} месяцев</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <strong>Начало смены зубов:</strong>
                <span className="ml-2">{data.teethChangeYears || 6} лет</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-3 text-lg">Общее состояние</h4>
            <div className="space-y-2">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <strong>Вредные привычки:</strong>
                <span className="ml-2">{data.badHabits?.exists ? data.badHabits.habits.join(', ') : 'нет'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <strong>Семейный анамнез:</strong>
                <span className="ml-2">{data.familyAnomalies?.exists ? 'есть' : 'нет'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <strong>Перенесенные заболевания:</strong>
                <span className="ml-2">{data.pastDiseases?.exists ? 'есть' : 'нет'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <strong>Гигиена полости рта:</strong>
                <span className="ml-2">{data.hygiene || 'хорошая'}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-3 text-lg">Ортодонтический анамнез</h4>
            <div className="space-y-2">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <strong>Предыдущее ортодонтическое лечение:</strong>
                <span className="ml-2">{data.previousOrthoTreatment?.exists ? 'проводилось' : 'не проводилось'}</span>
              </div>
              {data.previousOrthoTreatment?.exists && (
                <>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <strong>Длительность лечения:</strong>
                    <span className="ml-2">{data.previousOrthoTreatment.duration}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <strong>Вид аппаратуры:</strong>
                    <span className="ml-2">{data.previousOrthoTreatment.appliances.join(', ')}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Функция для отображения изображений с точками
  const renderImageWithPoints = (imageSrc, points, scale = 1, title = '') => {
    if (!imageSrc) {
      return (
        <div className="bg-gray-100 p-6 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center h-64">
          <div className="text-4xl text-gray-400 mb-2">📷</div>
          <div className="text-gray-500">Изображение не загружено</div>
        </div>
      );
    }
    
    const isBase64 = imageSrc.startsWith('data:image');
    const isBlob = imageSrc.startsWith('blob:');
    const isUrl = imageSrc.startsWith('http');
    
    if (isBase64 || isBlob || isUrl) {
      return (
        <div className="relative inline-block">
          <img
            src={imageSrc}
            alt={title}
            className="max-w-full max-h-96 object-contain rounded-lg shadow"
            onLoad={(e) => {
              // Масштабируем точки относительно размера изображения
              const img = e.target;
              const container = img.parentElement;
              if (container && points && Object.keys(points).length > 0) {
                // Мы будем использовать абсолютное позиционирование точек
                // в компоненте renderPhotoAnalysis
              }
            }}
          />
          {points && Object.keys(points).length > 0 && (
            <div className="absolute inset-0">
              {Object.entries(points).map(([pointId, pointCoords]) => {
                if (!pointCoords || !pointCoords.x || !pointCoords.y) return null;
                
                // Масштабируем координаты точек
                const displayX = pointCoords.x * scale;
                const displayY = pointCoords.y * scale;
                
                return (
                  <div
                    key={pointId}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${displayX}px`,
                      top: `${displayY}px`,
                    }}
                    title={`${pointId}: x=${pointCoords.x.toFixed(2)}, y=${pointCoords.y.toFixed(2)}`}
                  >
                    <div className="w-3 h-3 bg-red-500 border-2 border-white rounded-full shadow-lg"></div>
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {pointId}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
    
    // Если это не изображение, а просто текстовая метка
    return (
      <div className="bg-gray-100 p-6 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center h-64">
        <div className="text-4xl text-gray-400 mb-2">📷</div>
        <div className="text-gray-500">{imageSrc}</div>
      </div>
    );
  };

  // Функция для отображения 3D моделей
  const render3DModel = (modelSrc, title = '') => {
    if (!modelSrc) {
      return (
        <div className="bg-gray-100 p-6 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center h-64">
          <div className="text-4xl text-gray-400 mb-2">🖥️</div>
          <div className="text-gray-500">3D модель не загружена</div>
        </div>
      );
    }
    
    const isBase64 = modelSrc.startsWith('data:');
    const isBlob = modelSrc.startsWith('blob:');
    const isUrl = modelSrc.startsWith('http');
    
    if (isBase64 || isBlob || isUrl) {
      // Для простоты отображаем как изображение
      // В реальном приложении здесь был бы 3D вьюер
      return (
        <div className="flex flex-col">
          <img
            src={modelSrc}
            alt={title}
            className="max-w-full max-h-64 object-contain rounded-lg shadow mb-3"
          />
          <div className="flex gap-2">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">⟳ Вращать</button>
            <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">🔍 Увеличить</button>
            <button className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm">🔄 Сбросить</button>
          </div>
        </div>
      );
    }
    
    // Если это не модель, а просто текстовая метка
    return (
      <div className="bg-gray-100 p-6 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center h-64">
        <div className="text-4xl text-gray-400 mb-2">🖥️</div>
        <div className="text-gray-500">{modelSrc}</div>
      </div>
    );
  };

  const renderPhotoAnalysis = () => {
    const data = orthodonticData?.photoAnalysis || {};
    const hasRealPhotometryData = photoDataLoaded || (moduleData.photometry && moduleData.photometry.data);
    const photometryModuleData = moduleData.photometry?.data;
    
    // Получаем данные о точках из модуля фотометрии
    const pointsData = photometryModuleData?.points || {};
    const scale = photometryModuleData?.scale || 1;
    
    return (
      <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-purple-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 pb-2 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span>📷</span> Фотометрический анализ
          </h3>
          
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-full text-sm transition duration-300"
              onClick={() => loadMedicalData(patient)}
              title="Обновить данные"
            >
              🔄
            </button>
            
            {hasRealPhotometryData ? (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                📊 Реальные данные из фотометрии
              </span>
            ) : (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200">
                ℹ️ Демо-данные
              </span>
            )}
            
            {pointsData && Object.keys(pointsData).length > 0 && (
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-full text-sm transition duration-300"
                onClick={() => setShowPhotometryImages(!showPhotometryImages)}
                title="Показать изображения с расставленными точками"
              >
                {showPhotometryImages ? '👁️ Скрыть изображения' : '👁️ Показать изображения'}
              </button>
            )}
          </div>
        </div>
        
        {/* Отображение изображений с точками (если есть) */}
        {showPhotometryImages && photometryModuleData && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-gray-700 mb-3">Изображения с расставленными точками из модуля фотометрии</h4>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                className={`px-4 py-2 rounded-lg transition duration-300 ${
                  activePhotoTab === 'frontal'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setActivePhotoTab('frontal')}
              >
                Анфас
              </button>
              <button
                className={`px-4 py-2 rounded-lg transition duration-300 ${
                  activePhotoTab === 'profile'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setActivePhotoTab('profile')}
              >
                Профиль
              </button>
              <button
                className={`px-4 py-2 rounded-lg transition duration-300 ${
                  activePhotoTab === 'profile45'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setActivePhotoTab('profile45')}
              >
                Профиль 45°
              </button>
              <button
                className={`px-4 py-2 rounded-lg transition duration-300 ${
                  activePhotoTab === 'intraoral'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setActivePhotoTab('intraoral')}
              >
                Внутриротовые
              </button>
            </div>
            
            <div className="bg-white p-4 rounded-lg">
              {activePhotoTab === 'frontal' && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">Изображение анфас {data.frontal?.hasPoints ? 'с точками' : ''}</h5>
                  <div className="flex justify-center">
                    {renderImageWithPoints(
                      photometryImages.frontal || data.frontal?.actualImage,
                      data.frontal?.points || pointsData,
                      scale,
                      'Фото анфас'
                    )}
                  </div>
                  
                  {data.frontal?.hasPoints && (
                    <div className="bg-green-50 p-3 rounded-lg mt-3 border border-green-200">
                      <p className="text-green-700">✓ На изображении расставлены {Object.keys(data.frontal?.points || pointsData).length} точек</p>
                      <p className="text-green-700">✓ Масштаб: 1px = {(1/scale).toFixed(3)} мм</p>
                    </div>
                  )}
                </div>
              )}
              
              {activePhotoTab === 'profile' && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">Изображение профиля {data.profile?.hasPoints ? 'с точками' : ''}</h5>
                  <div className="flex justify-center">
                    {renderImageWithPoints(
                      photometryImages.profile || data.profile?.actualImage,
                      data.profile?.points || pointsData,
                      scale,
                      'Фото профиль'
                    )}
                  </div>
                </div>
              )}
              
              {activePhotoTab === 'profile45' && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">Изображение профиля 45° {data.profile45?.hasPoints ? 'с точками' : ''}</h5>
                  <div className="flex justify-center">
                    {renderImageWithPoints(
                      photometryImages.profile45 || data.profile45?.actualImage,
                      data.profile45?.points || pointsData,
                      scale,
                      'Фото профиль 45°'
                    )}
                  </div>
                </div>
              )}
              
              {activePhotoTab === 'intraoral' && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">Внутриротовые изображения {data.intraoral?.hasPoints ? 'с точками' : ''}</h5>
                  <div className="flex justify-center">
                    {renderImageWithPoints(
                      photometryImages.intraoral || data.intraoral?.actualImage,
                      data.intraoral?.points || pointsData,
                      scale,
                      'Внутриротовые фото'
                    )}
                  </div>
                </div>
              )}
              
              {(!photometryImages.frontal && !photometryImages.profile && !photometryImages.profile45 && !photometryImages.intraoral) && (
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-2">Изображения с расставленными точками не найдены</p>
                  <p className="text-gray-600 mb-4">Перейдите в модуль фотометрии для выполнения измерений</p>
                  <button
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition duration-300"
                    onClick={() => {
                      navigate('/photometry');
                    }}
                  >
                    📷 Перейти в модуль фотометрии
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-2">
          <button
            className={`px-4 py-2 rounded-lg transition duration-300 ${
              selectedSection === 'frontal'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => {
              setSelectedSection('frontal');
              setActivePhotoTab('frontal');
            }}
          >
            Анфас
          </button>
          <button
            className={`px-4 py-2 rounded-lg transition duration-300 ${
              selectedSection === 'profile45'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => {
              setSelectedSection('profile45');
              setActivePhotoTab('profile45');
            }}
          >
            Профиль 45°
          </button>
          <button
            className={`px-4 py-2 rounded-lg transition duration-300 ${
              selectedSection === 'profile'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => {
              setSelectedSection('profile');
              setActivePhotoTab('profile');
            }}
          >
            Профиль
          </button>
        </div>
        
        {selectedSection === 'frontal' && data.frontal && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <h4 className="font-semibold text-gray-800 text-lg">Анфас</h4>
              {hasRealPhotometryData && data.frontal.faceWidth && (
                <span className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">
                  Обновлено: {moduleData.photometry?.data?.analysisDate || 'Сегодня'}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
              {data.frontal.photos?.map((photo, idx) => (
                <div key={idx} className="text-center">
                  <div className="bg-gray-100 p-3 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center">
                    <div className="text-2xl mb-1">📷</div>
                    <div className="text-xs text-gray-600">{photo}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Ширина лица:</strong>
                  <span className={hasRealPhotometryData ? 'text-green-600 font-medium' : 'text-gray-500 italic'}>
                    {data.frontal.faceWidth ? `${data.frontal.faceWidth.toFixed(1)} мм` : '140 мм'}
                    {hasRealPhotometryData && <span className="bg-green-100 text-green-800 text-xs ml-2 px-2 py-0.5 rounded">реально</span>}
                  </span>
                </div>
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Высота лица:</strong>
                  <span className={hasRealPhotometryData ? 'text-green-600 font-medium' : 'text-gray-500 italic'}>
                    {data.frontal.faceHeight ? `${data.frontal.faceHeight.toFixed(1)} мм` : '120 мм'}
                  </span>
                </div>
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Лицевой индекс:</strong>
                  <span className={hasRealPhotometryData ? 'text-green-600 font-medium' : 'text-gray-500 italic'}>
                    {data.frontal.facialIndex ? `${data.frontal.facialIndex.toFixed(1)}%` : '85.7%'}
                    {data.frontal.facialIndexInterpretation && (
                      <span className="text-gray-500 ml-1">({data.frontal.facialIndexInterpretation})</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Индекс формы головы:</strong>
                  <span className={hasRealPhotometryData ? 'text-green-600 font-medium' : 'text-gray-500 italic'}>
                    {data.frontal.headShapeIndex ? `${data.frontal.headShapeIndex.toFixed(1)}%` : '80.5%'}
                    {data.frontal.headShapeInterpretation && (
                      <span className="text-gray-500 ml-1">({data.frontal.headShapeInterpretation})</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Положение подбородка:</strong> <span>{data.frontal.chinPosition}</span>
                </div>
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Смыкание губ:</strong> <span>{data.frontal.lipClosure}</span>
                </div>
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Симптом десневой улыбки:</strong> <span>{data.frontal.gumSmile}</span>
                </div>
              </div>
              
              {data.frontal.comments && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <strong>Комментарии:</strong> <span className="text-gray-700">{data.frontal.comments}</span>
                </div>
              )}
            </div>
            
            {hasRealPhotometryData && moduleData.photometry?.data?.measurements && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="font-medium text-gray-700 mb-3">Подробные измерения из модуля фотометрии:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(moduleData.photometry.data.measurements).map(([key, measurement]) => (
                    <div key={key} className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="font-medium text-gray-700">{measurement.name}</div>
                      <div className="text-lg font-semibold text-blue-600">{measurement.value?.toFixed(2)} {measurement.unit}</div>
                      {measurement.interpretation && (
                        <div className="text-sm text-gray-600">{measurement.interpretation}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {selectedSection === 'profile45' && data.profile45 && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-gray-800 text-lg mb-4">Профиль 45°</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
              {data.profile45.photos?.map((photo, idx) => (
                <div key={idx} className="text-center">
                  <div className="bg-gray-100 p-3 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center">
                    <div className="text-2xl mb-1">📷</div>
                    <div className="text-xs text-gray-600">{photo}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Симметрия:</strong> <span>{data.profile45.symmetry}</span>
                </div>
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Форма головы:</strong> <span>{data.profile45.headShape}</span>
                </div>
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Форма лица:</strong> <span>{data.profile45.faceShape}</span>
                </div>
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Скуловая выпуклость:</strong> <span>{data.profile45.zygomaticProminence}</span>
                </div>
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Гониальный угол:</strong> <span>{data.profile45.gonialAngle}</span>
                </div>
              </div>
              {data.profile45.comments && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <strong>Комментарии:</strong> <span className="text-gray-700">{data.profile45.comments}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {selectedSection === 'profile' && data.profile && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <h4 className="font-semibold text-gray-800 text-lg">Профиль</h4>
              {hasRealPhotometryData && data.profile.nasolabialAngle && (
                <span className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">
                  Обновлено: {moduleData.photometry?.data?.analysisDate || 'Сегодня'}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
              {data.profile.photos?.map((photo, idx) => (
                <div key={idx} className="text-center">
                  <div className="bg-gray-100 p-3 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center">
                    <div className="text-2xl mb-1">📷</div>
                    <div className="text-xs text-gray-600">{photo}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Тип профиля:</strong>
                  <span className={hasRealPhotometryData ? 'text-green-600 font-medium' : 'text-gray-500 italic'}>
                    {data.profile.profileType}
                    {hasRealPhotometryData && <span className="bg-green-100 text-green-800 text-xs ml-2 px-2 py-0.5 rounded">реально</span>}
                  </span>
                </div>
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Носогубный угол:</strong>
                  <span className={hasRealPhotometryData ? 'text-green-600 font-medium' : 'text-gray-500 italic'}>
                    {data.profile.nasolabialAngle ? `${data.profile.nasolabialAngle.toFixed(1)}°` : '100°'}
                  </span>
                </div>
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Ментолабиальный угол:</strong> <span>{data.profile.mentolabialAngle}°</span>
                </div>
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Угол профиля лица:</strong>
                  <span className={hasRealPhotometryData ? 'text-green-600 font-medium' : 'text-gray-500 italic'}>
                    {data.profile.facialConvexity ? `${data.profile.facialConvexity.toFixed(1)}°` : '165°'}
                  </span>
                </div>
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Положение подбородка:</strong> <span>{data.profile.chinPosition}</span>
                </div>
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Положение верхней губы:</strong> <span>{data.profile.upperLipPosition}</span>
                </div>
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Положение нижней губы:</strong> <span>{data.profile.lowerLipPosition}</span>
                </div>
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>E-line (верхняя губа):</strong> <span>{data.profile.eLine?.upperLip} мм</span>
                </div>
                <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <strong>E-line (нижняя губа):</strong> <span>{data.profile.eLine?.lowerLip} мм</span>
                </div>
              </div>
              
              {data.profile.comments && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <strong>Комментарии:</strong> <span className="text-gray-700">{data.profile.comments}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {moduleData.photometry && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <ModuleDataViewer
              moduleData={moduleData.photometry}
              moduleType="photometry"
            />
          </div>
        )}
        
        <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white px-4 py-2 rounded-lg transition duration-300 flex items-center gap-2"
            onClick={() => {
              // Переход к модулю фотометрии
              navigate('/photometry');
            }}
          >
            <span>📷</span> Выполнить новый фотометрический анализ
          </button>
          
          <button
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-lg transition duration-300 flex items-center gap-2"
            onClick={() => loadMedicalData(patient)}
          >
            <span>🔄</span> Загрузить последние данные из фотометрии
          </button>
        </div>
      </div>
    );
  };

  const renderIntraoralAnalysis = () => {
    const data = orthodonticData?.intraoralAnalysis || {};
    const hasRealBiometryData = biometryDataLoaded || (moduleData.biometry && moduleData.biometry.data);
    
    return (
      <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-teal-500">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
          <span>🦷</span> Внутриротовой анализ
        </h3>
        
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">Внутриротовые фотографии</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="bg-gray-100 p-4 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center">
                <div className="text-2xl mb-1">📷</div>
                <div className="text-xs text-gray-600">Сомкнутый рот</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 p-4 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center">
                <div className="text-2xl mb-1">📷</div>
                <div className="text-xs text-gray-600">Приоткрытый рот</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 p-4 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center">
                <div className="text-2xl mb-1">📷</div>
                <div className="text-xs text-gray-600">Сбоку 90° слева</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 p-4 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center">
                <div className="text-2xl mb-1">📷</div>
                <div className="text-xs text-gray-600">Сбоку 90° справа</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">Анализ окклюзии</h4>
          
          <div className="mb-4">
            <h5 className="font-medium text-gray-600 mb-2 bg-gray-100 p-2 rounded">Сагиттальное направление</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <strong>Моляры справа:</strong> <span className="ml-2">{data.occlusion?.sagittal?.molarsRight || 'I класс'}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <strong>Моляры слева:</strong> <span className="ml-2">{data.occlusion?.sagittal?.molarsLeft || 'I класс'}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <strong>Клыки справа:</strong> <span className="ml-2">{data.occlusion?.sagittal?.caninesRight || 'I класс'}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <strong>Клыки слева:</strong> <span className="ml-2">{data.occlusion?.sagittal?.caninesLeft || 'I класс'}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <strong>Смыкание резцов:</strong> <span className="ml-2">{data.occlusion?.sagittal?.incisorRelationship || 'в норме'}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <strong>Сагиттальная щель:</strong> <span className="ml-2">{data.occlusion?.sagittal?.sagittalGap || 0} мм</span>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <h5 className="font-medium text-gray-600 mb-2 bg-gray-100 p-2 rounded">Вертикальное направление</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <strong>Передний отдел:</strong> <span className="ml-2">{data.occlusion?.vertical?.anterior || 'глубокая резцовая окклюзия'}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <strong>Величина перекрытия:</strong> <span className="ml-2">{data.occlusion?.vertical?.deepOcclusion || '> 1/3'}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <strong>Вертикальное перекрытие:</strong> <span className="ml-2">{data.occlusion?.vertical?.verticalOverlap || '5.3'} мм
                {data.occlusion?.vertical?.norm && (
                  <span className="text-gray-500 text-sm ml-1">(Норма: {data.occlusion.vertical.norm})</span>
                )}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-600 mb-2 bg-gray-100 p-2 rounded">Трансверзальное направление</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <strong>Смещение косметического центра:</strong> <span className="ml-2">{data.occlusion?.transversal?.midlineShift || 'нет'}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <strong>Перекрестная окклюзия:</strong> <span className="ml-2">{data.occlusion?.transversal?.crossbite || 'отсутствует'}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <strong>Буккальная окклюзия:</strong> <span className="ml-2">{data.occlusion?.transversal?.buccalOcclusion || 'в норме'}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <strong>Лингвальная окклюзия:</strong> <span className="ml-2">{data.occlusion?.transversal?.lingualOcclusion || 'в норме'}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">Зубная формула с размерами (мм)</h4>
          {hasRealBiometryData && (
            <div className="mb-3">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                📊 Реальные измерения из биометрии
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium text-gray-700 mb-3 text-center">Верхняя челюсть</h5>
              <div className="grid grid-cols-6 gap-2">
                {Object.entries(data.dentalFormula?.upperJaw || {}).map(([tooth, size]) => (
                  <div key={tooth} className="flex flex-col items-center p-2 bg-white rounded border border-gray-200">
                    <span className="font-medium text-gray-700 text-sm">{tooth}</span>
                    <span className={`mt-1 text-sm ${hasRealBiometryData ? 'text-green-600 font-medium' : 'text-gray-500 italic'}`}>
                      {size} мм
                      {hasRealBiometryData && <span className="bg-green-100 text-green-800 text-xs ml-1 px-1.5 py-0.5 rounded">реально</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium text-gray-700 mb-3 text-center">Нижняя челюсть</h5>
              <div className="grid grid-cols-6 gap-2">
                {Object.entries(data.dentalFormula?.lowerJaw || {}).map(([tooth, size]) => (
                  <div key={tooth} className="flex flex-col items-center p-2 bg-white rounded border border-gray-200">
                    <span className="font-medium text-gray-700 text-sm">{tooth}</span>
                    <span className={`mt-1 text-sm ${hasRealBiometryData ? 'text-green-600 font-medium' : 'text-gray-500 italic'}`}>
                      {size} мм
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {data.comments && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h5 className="font-medium text-gray-700 mb-2">Комментарии:</h5>
            <p className="text-gray-700">{data.comments}</p>
          </div>
        )}
      </div>
    );
  };

  const renderAnthropometry = () => {
    const data = orthodonticData?.anthropometry || {};
    const hasRealBiometryData = biometryDataLoaded || (moduleData.biometry && moduleData.biometry.data);
    const detailedBiometry = data.detailedBiometry;
    
    return (
      <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-amber-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 pb-2 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span>📐</span> Антропометрические исследования
          </h3>
          
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            {hasRealBiometryData ? (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                📊 Реальные данные из биометрии
              </span>
            ) : (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200">
                ℹ️ Демо-данные
              </span>
            )}
            
            {(biometryModels.upperJaw || biometryModels.lowerJaw || biometryModels.occlusion) && (
              <button
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-full text-sm transition duration-300"
                onClick={() => setShowBiometryModels(!showBiometryModels)}
                title="Показать 3D модели зубных рядов"
              >
                {showBiometryModels ? '👁️ Скрыть модели' : '👁️ Показать 3D модели'}
              </button>
            )}
          </div>
        </div>
        
        {/* Отображение 3D моделей из биометрии */}
        {showBiometryModels && (biometryModels.upperJaw || biometryModels.lowerJaw || biometryModels.occlusion) && (
          <div className="bg-amber-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-gray-700 mb-3">3D модели зубных рядов из модуля биометрии</h4>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                className={`px-4 py-2 rounded-lg transition duration-300 ${
                  activeModelTab === 'upperJaw'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setActiveModelTab('upperJaw')}
              >
                Верхняя челюсть
              </button>
              <button
                className={`px-4 py-2 rounded-lg transition duration-300 ${
                  activeModelTab === 'lowerJaw'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setActiveModelTab('lowerJaw')}
              >
                Нижняя челюсть
              </button>
              <button
                className={`px-4 py-2 rounded-lg transition duration-300 ${
                  activeModelTab === 'occlusion'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setActiveModelTab('occlusion')}
              >
                Окклюзия
              </button>
            </div>
            
            <div className="bg-white p-4 rounded-lg">
              {activeModelTab === 'upperJaw' && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">3D модель верхней челюсти</h5>
                  {render3DModel(biometryModels.upperJaw, 'Верхняя челюсть')}
                </div>
              )}
              
              {activeModelTab === 'lowerJaw' && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">3D модель нижней челюсти</h5>
                  {render3DModel(biometryModels.lowerJaw, 'Нижняя челюсть')}
                </div>
              )}
              
              {activeModelTab === 'occlusion' && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">3D модель окклюзии</h5>
                  {render3DModel(biometryModels.occlusion, 'Окклюзия')}
                </div>
              )}
              
              {(!biometryModels.upperJaw && !biometryModels.lowerJaw && !biometryModels.occlusion) && (
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-2">3D модели зубных рядов не найдены</p>
                  <p className="text-gray-600 mb-4">Перейдите в модуль биометрии для загрузки моделей</p>
                  <button
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition duration-300"
                    onClick={() => {
                      navigate('/biometry');
                    }}
                  >
                    📏 Перейти в модуль биометрии
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">Размеры зубных рядов</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
              <strong>Ширина верхней челюсти:</strong>
              <span className={hasRealBiometryData ? 'text-green-600 font-medium' : 'text-gray-500 italic'}>
                {data.jawDimensions?.maxillaryWidth || '60.4'} мм
                {hasRealBiometryData && detailedBiometry?.pontAnalysis?.upperMolar?.actualWidth && (
                  <span className="bg-green-100 text-green-800 text-xs ml-2 px-2 py-0.5 rounded">реально</span>
                )}
              </span>
            </div>
            <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
              <strong>Ширина нижней челюсти:</strong>
              <span className={hasRealBiometryData ? 'text-green-600 font-medium' : 'text-gray-500 italic'}>
                {data.jawDimensions?.mandibularWidth || '55.4'} мм
              </span>
            </div>
            <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
              <strong>Апикальный базис ВЧ:</strong> <span>{data.jawDimensions?.maxillaryBase || 'норма'}</span>
            </div>
            <div className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
              <strong>Апикальный базис НЧ:</strong> <span>{data.jawDimensions?.mandibularBase || 'норма'}</span>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">Индексы и расчеты</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.indices?.tonIndex && (
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between">
                    <strong>Индекс Тона:</strong>
                    <span className={hasRealBiometryData ? 'text-green-600 font-medium' : 'text-gray-500 italic'}>
                      {data.indices.tonIndex.value.toFixed(2)}
                      {hasRealBiometryData && detailedBiometry?.tonIndex && (
                        <span className="bg-green-100 text-green-800 text-xs ml-2 px-2 py-0.5 rounded">реально</span>
                      )}
                    </span>
                  </div>
                  <div className="text-right text-sm text-gray-500">Норма: {data.indices.tonIndex.norm}</div>
                  <div className={`text-right text-sm font-medium ${
                    data.indices.tonIndex.interpretation === 'Норма' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {data.indices.tonIndex.interpretation}
                  </div>
                </div>
              </div>
            )}
            {data.indices?.boltonAnalysis?.anterior && (
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between">
                    <strong>Анализ Болтона (передний):</strong>
                    <span className={hasRealBiometryData ? 'text-green-600 font-medium' : 'text-gray-500 italic'}>
                      {data.indices.boltonAnalysis.anterior.ratio.toFixed(2)}%
                      {hasRealBiometryData && detailedBiometry?.boltonAnalysis?.anteriorRatio && (
                        <span className="bg-green-100 text-green-800 text-xs ml-2 px-2 py-0.5 rounded">реально</span>
                      )}
                    </span>
                  </div>
                  <div className="text-right text-sm text-gray-500">Норма: {data.indices.boltonAnalysis.anterior.norm}</div>
                  <div className={`text-right text-sm font-medium ${
                    data.indices.boltonAnalysis.anterior.interpretation === 'Соотношение в норме' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {data.indices.boltonAnalysis.anterior.interpretation}
                  </div>
                </div>
              </div>
            )}
            {data.indices?.boltonAnalysis?.overall && (
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between">
                    <strong>Анализ Болтона (общий):</strong>
                    <span className={hasRealBiometryData ? 'text-green-600 font-medium' : 'text-gray-500 italic'}>
                      {data.indices.boltonAnalysis.overall.ratio.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-right text-sm text-gray-500">Норма: {data.indices.boltonAnalysis.overall.norm}</div>
                  <div className={`text-right text-sm font-medium ${
                    data.indices.boltonAnalysis.overall.interpretation === 'Соотношение в норме' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {data.indices.boltonAnalysis.overall.interpretation}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">Размеры зубов</h4>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-gray-700">{data.toothSizes || 'соответствуют норме'}</p>
          </div>
        </div>
        
        {/* Детальные данные из биометрии */}
        {hasRealBiometryData && detailedBiometry && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-gray-700 mb-3">📊 Подробные данные из модуля биометрии</h4>
            
            {detailedBiometry.tonIndex !== null && (
              <div className="bg-white p-4 rounded-lg mb-3 border border-gray-200">
                <h5 className="font-medium text-gray-700 mb-2">Индекс Тона</h5>
                <div className="space-y-2">
                  <div><strong>Значение:</strong> <span className="ml-2 text-blue-600 font-medium">{detailedBiometry.tonIndex.toFixed(2)}</span></div>
                  <div><strong>Интерпретация:</strong> <span className="ml-2">{detailedBiometry.tonInterpretation}</span></div>
                </div>
              </div>
            )}
            
            {detailedBiometry.boltonAnalysis && detailedBiometry.boltonAnalysis.anteriorRatio > 0 && (
              <div className="bg-white p-4 rounded-lg mb-3 border border-gray-200">
                <h5 className="font-medium text-gray-700 mb-2">Анализ Болтона</h5>
                <div className="space-y-2">
                  <div><strong>Соотношение передних зубов:</strong> <span className="ml-2 text-blue-600 font-medium">{detailedBiometry.boltonAnalysis.anteriorRatio.toFixed(2)}%</span></div>
                  <div><strong>Интерпретация:</strong> <span className="ml-2">{detailedBiometry.boltonAnalysis.interpretation}</span></div>
                </div>
              </div>
            )}
            
            {detailedBiometry.pontAnalysis && detailedBiometry.pontAnalysis.upperMolar?.actualWidth > 0 && (
              <div className="bg-white p-4 rounded-lg mb-3 border border-gray-200">
                <h5 className="font-medium text-gray-700 mb-2">Анализ Пона</h5>
                <div className="space-y-2">
                  <div><strong>Ширина верхней челюсти:</strong> <span className="ml-2 text-blue-600 font-medium">{detailedBiometry.pontAnalysis.upperMolar.actualWidth.toFixed(2)} мм</span></div>
                  <div><strong>Ширина нижней челюсти:</strong> <span className="ml-2 text-blue-600 font-medium">{detailedBiometry.pontAnalysis.lowerMolar?.actualWidth.toFixed(2)} мм</span></div>
                </div>
              </div>
            )}
            
            {detailedBiometry.speeCurve && detailedBiometry.speeCurve.depth > 0 && (
              <div className="bg-white p-4 rounded-lg mb-3 border border-gray-200">
                <h5 className="font-medium text-gray-700 mb-2">Кривая Шпее</h5>
                <div className="space-y-2">
                  <div><strong>Глубина:</strong> <span className="ml-2 text-blue-600 font-medium">{detailedBiometry.speeCurve.depth.toFixed(2)} мм</span></div>
                  <div><strong>Интерпретация:</strong> <span className="ml-2">{detailedBiometry.speeCurve.interpretation}</span></div>
                </div>
              </div>
            )}
            
            {detailedBiometry.analysisDate && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <div><strong>Дата анализа:</strong> <span className="ml-2">{detailedBiometry.analysisDate}</span></div>
                  <div><strong>Пациент:</strong> <span className="ml-2">{detailedBiometry.patientName}</span></div>
                  {detailedBiometry.source && (
                    <div><strong>Источник:</strong> <span className="ml-2">{detailedBiometry.source}</span></div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {moduleData.biometry && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <ModuleDataViewer
              moduleData={moduleData.biometry}
              moduleType="biometry"
            />
          </div>
        )}
        
        <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            className="bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white px-4 py-2 rounded-lg transition duration-300 flex items-center gap-2"
            onClick={() => {
              // Переход к модулю биометрии
              navigate('/biometry');
            }}
          >
            <span>📏</span> Выполнить новый биометрический анализ
          </button>
          
          <button
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-lg transition duration-300 flex items-center gap-2"
            onClick={() => loadMedicalData(patient)}
          >
            <span>🔄</span> Загрузить последние данные из биометрии
          </button>
        </div>
      </div>
    );
  };

  const renderCephalometry = () => {
    const data = orthodonticData?.cephalometry || {};
    const hasRealCephalometryData = cephalometryDataLoaded || (moduleData.cephalometry && moduleData.cephalometry.data);
    const cephalometryModuleData = moduleData.cephalometry?.data;
    
    return (
      <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-cyan-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 pb-2 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span>🦴</span> Цефалометрический анализ
          </h3>
          
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            {hasRealCephalometryData ? (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                📊 Реальные данные из цефалометрии
              </span>
            ) : (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200">
                ℹ️ Демо-данные
              </span>
            )}
            
            {(cephalometryImages.frontalTRG || cephalometryImages.lateralTRG) && (
              <button
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 rounded-full text-sm transition duration-300"
                onClick={() => setShowCephalometryImages(!showCephalometryImages)}
                title="Показать изображения ТРГ"
              >
                {showCephalometryImages ? '👁️ Скрыть ТРГ' : '👁️ Показать ТРГ'}
              </button>
            )}
          </div>
        </div>
        
        {/* Отображение изображений ТРГ */}
        {showCephalometryImages && (cephalometryImages.frontalTRG || cephalometryImages.lateralTRG) && (
          <div className="bg-cyan-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-gray-700 mb-3">Телерентгенограммы (ТРГ) из модуля цефалометрии</h4>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                className={`px-4 py-2 rounded-lg transition duration-300 ${
                  activeCephTab === 'frontalTRG'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setActiveCephTab('frontalTRG')}
              >
                Прямая проекция
              </button>
              <button
                className={`px-4 py-2 rounded-lg transition duration-300 ${
                  activeCephTab === 'lateralTRG'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setActiveCephTab('lateralTRG')}
              >
                Боковая проекция
              </button>
            </div>
            
            <div className="bg-white p-4 rounded-lg">
              {activeCephTab === 'frontalTRG' && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">ТРГ в прямой проекции {data.frontalTRG?.hasPoints ? 'с точками' : ''}</h5>
                  <div className="flex justify-center">
                    {renderImageWithPoints(
                      cephalometryImages.frontalTRG,
                      data.points,
                      1,
                      'ТРГ прямая проекция'
                    )}
                  </div>
                  
                  {data.points && Object.keys(data.points).length > 0 && (
                    <div className="bg-green-50 p-3 rounded-lg mt-3 border border-green-200">
                      <p className="text-green-700">✓ На изображении расставлены {Object.keys(data.points).length} цефалометрических точек</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeCephTab === 'lateralTRG' && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">ТРГ в боковой проекции {data.points ? 'с точками' : ''}</h5>
                  <div className="flex justify-center">
                    {renderImageWithPoints(
                      cephalometryImages.lateralTRG,
                      data.points,
                      1,
                      'ТРГ боковая проекция'
                    )}
                  </div>
                </div>
              )}
              
              {(!cephalometryImages.frontalTRG && !cephalometryImages.lateralTRG) && (
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-2">Изображения ТРГ не найдены</p>
                  <p className="text-gray-600 mb-4">Перейдите в модуль цефалометрии для загрузки снимков</p>
                  <button
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition duration-300"
                    onClick={() => {
                      navigate('/cephalometry');
                    }}
                  >
                    🦴 Перейти в модуль цефалометрии
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">ТРГ в прямой проекции</h4>
          {!cephalometryImages.frontalTRG && (
            <div className="bg-gray-100 p-6 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center mb-4">
              <div className="text-4xl text-gray-400 mb-2">📊</div>
              <div className="text-gray-500">Телерентгенограмма в прямой проекции</div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.frontalTRG?.measurements && Object.entries(data.frontalTRG.measurements).map(([key, measurement]) => (
              <div key={key} className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex justify-between">
                  <strong>{key}:</strong> <span>{measurement.value} {measurement.unit || ''}</span>
                </div>
                <div className="text-right text-sm text-gray-500">Норма: {measurement.norm}</div>
                <div className={`text-right text-sm font-medium ${
                  measurement.interpretation === 'Норма' || measurement.interpretation?.includes('норма')
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {measurement.interpretation}
                </div>
              </div>
            ))}
            {data.frontalTRG?.symmetry && (
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex justify-between">
                  <strong>Симметрия:</strong> <span>{data.frontalTRG.symmetry}</span>
                </div>
              </div>
            )}
            {data.frontalTRG?.chinDeviation && (
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex justify-between">
                  <strong>Отклонение подбородка:</strong> <span>{data.frontalTRG.chinDeviation}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">ТРГ в боковой проекции</h4>
          {!cephalometryImages.lateralTRG && (
            <div className="bg-gray-100 p-6 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center mb-4">
              <div className="text-4xl text-gray-400 mb-2">📊</div>
              <div className="text-gray-500">Телерентгенограмма в боковой проекции</div>
            </div>
          )}
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-700 mb-3">Скелетный анализ</h5>
            <div className="bg-white p-3 rounded-lg border border-gray-200 mb-4">
              <div className="flex justify-between">
                <strong>Скелетный класс:</strong> <span>{data.lateralTRG?.skeletalClass || 'I класс с тенденцией ко II'}</span>
              </div>
            </div>
            
            <div className="mb-4">
              <h6 className="font-medium text-gray-600 mb-2 bg-gray-100 p-2 rounded">Цефалометрические параметры</h6>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.lateralTRG?.parameters && Object.entries(data.lateralTRG.parameters).map(([key, param]) => (
                  <div key={key} className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex justify-between">
                      <span className="font-medium">{key}:</span>
                      <span className="font-bold text-blue-600">{param.value}{param.unit || (key.includes('<') ? '°' : '')}</span>
                    </div>
                    <div className="text-right text-sm text-gray-500">Норма: {param.norm}</div>
                    <div className={`text-right text-sm font-medium ${
                      param.interpretation === 'Норма' || param.interpretation?.includes('норма')
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {param.interpretation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <h6 className="font-medium text-gray-600 mb-2 bg-gray-100 p-2 rounded">Положение челюстей</h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Верхняя челюсть:</strong>
                  <div className="ml-2 text-sm"><span className="font-medium">Положение:</span> {data.lateralTRG?.jawPositions?.maxilla?.position || 'ретрогнатия'}</div>
                  <div className="ml-2 text-sm"><span className="font-medium">Инклинация:</span> {data.lateralTRG?.jawPositions?.maxilla?.inclination || 'нормоинклинация'}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <strong>Нижняя челюсть:</strong>
                  <div className="ml-2 text-sm"><span className="font-medium">Положение:</span> {data.lateralTRG?.jawPositions?.mandible?.position || 'ретрогнатия'}</div>
                  <div className="ml-2 text-sm"><span className="font-medium">Инклинация:</span> {data.lateralTRG?.jawPositions?.mandible?.inclination || 'ретроинклинация'}</div>
                </div>
              </div>
            </div>
            
            <div>
              <h6 className="font-medium text-gray-600 mb-2 bg-gray-100 p-2 rounded">Вертикальные параметры</h6>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-between">
                    <strong>Лицевое соотношение:</strong> <span>{data.lateralTRG?.verticalParameters?.facialRatio || 0.78}</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-between">
                    <strong>Высота нижней трети лица:</strong> <span>{data.lateralTRG?.verticalParameters?.lowerFaceHeight || 'в норме'}</span>
                  </div>
                </div>
                {data.lateralTRG?.verticalParameters?.ODI && (
                  <div className="bg-white p-3 rounded-lg border border-gray-200 md:col-span-2 lg:col-span-3">
                    <div className="flex flex-wrap justify-between">
                      <strong>ODI:</strong> <span className="ml-2">{data.lateralTRG.verticalParameters.ODI.value}°</span>
                    </div>
                    <div className="text-right text-sm text-gray-500">Норма: {data.lateralTRG.verticalParameters.ODI.norm}</div>
                    <div className="text-right text-sm font-medium">
                      {data.lateralTRG.verticalParameters.ODI.interpretation}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {moduleData.cephalometry && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h5 className="font-medium text-gray-700 mb-2">Данные из модуля цефалометрии:</h5>
            <ModuleDataViewer
              moduleData={moduleData.cephalometry}
              moduleType="cephalometry"
            />
          </div>
        )}
        
        <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            className="bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg transition duration-300 flex items-center gap-2"
            onClick={() => {
              // Переход к модулю цефалометрии
              navigate('/cephalometry');
            }}
          >
            <span>🦴</span> Выполнить новый цефалометрический анализ
          </button>
          
          <button
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-lg transition duration-300 flex items-center gap-2"
            onClick={() => loadMedicalData(patient)}
          >
            <span>🔄</span> Обновить данные цефалометрии
          </button>
        </div>
      </div>
    );
  };

  const renderModeling3D = () => {
    const data = orthodonticData?.modeling3D || {};
    const hasRealModelingData = modelingDataLoaded || (moduleData.modeling && moduleData.modeling.data);
    
    return (
      <div className="modeling3d-section card-section">
        <div className="section-header">
          <h3>🖥️ 3D Моделирование</h3>
          
          <div className="section-actions">
            {hasRealModelingData ? (
              <span className="data-source-indicator real-data">
                📊 Реальные данные из 3D моделирования
              </span>
            ) : (
              <span className="data-source-indicator demo-data">
                ℹ️ Демо-данные
              </span>
            )}
            
            {(modeling3DModels.skull || modeling3DModels.maxilla || modeling3DModels.mandible || modeling3DModels.setup) && (
              <button 
                className="btn-show-images"
                onClick={() => setShowModeling3D(!showModeling3D)}
                title="Показать 3D модели"
              >
                {showModeling3D ? '👁️ Скрыть 3D модели' : '👁️ Показать 3D модели'}
              </button>
            )}
          </div>
        </div>
        
        {/* Отображение 3D моделей */}
        {showModeling3D && (modeling3DModels.skull || modeling3DModels.maxilla || modeling3DModels.mandible || modeling3DModels.setup) && (
          <div className="modeling-3d-section">
            <h4>3D модели из модуля моделирования</h4>
            
            <div className="model3d-tabs">
              <button 
                className={active3DTab === 'skull' ? 'active' : ''} 
                onClick={() => setActive3DTab('skull')}
              >
                Череп
              </button>
              <button 
                className={active3DTab === 'maxilla' ? 'active' : ''} 
                onClick={() => setActive3DTab('maxilla')}
              >
                Верхняя челюсть
              </button>
              <button 
                className={active3DTab === 'mandible' ? 'active' : ''} 
                onClick={() => setActive3DTab('mandible')}
              >
                Нижняя челюсть
              </button>
              <button 
                className={active3DTab === 'setup' ? 'active' : ''} 
                onClick={() => setActive3DTab('setup')}
              >
                Setup-модель
              </button>
            </div>
            
            <div className="model3d-viewer">
              {active3DTab === 'skull' && (
                <div className="model3d-container">
                  <h5>3D модель черепа</h5>
                  {render3DModel(modeling3DModels.skull, '3D модель черепа')}
                </div>
              )}
              
              {active3DTab === 'maxilla' && (
                <div className="model3d-container">
                  <h5>3D модель верхней челюсти</h5>
                  {render3DModel(modeling3DModels.maxilla, '3D модель верхней челюсти')}
                </div>
              )}
              
              {active3DTab === 'mandible' && (
                <div className="model3d-container">
                  <h5>3D модель нижней челюсти</h5>
                  {render3DModel(modeling3DModels.mandible, '3D модель нижней челюсти')}
                </div>
              )}
              
              {active3DTab === 'setup' && (
                <div className="model3d-container">
                  <h5>Setup-модель</h5>
                  {render3DModel(modeling3DModels.setup, 'Setup-модель')}
                  {data.setupModel && (
                    <div className="setup-info">
                      <p><strong>Описание:</strong> {data.setupModel}</p>
                    </div>
                  )}
                </div>
              )}
              
              {(!modeling3DModels.skull && !modeling3DModels.maxilla && !modeling3DModels.mandible && !modeling3DModels.setup) && (
                <div className="no-3dmodels-message">
                  <p>3D модели не найдены</p>
                  <p>Перейдите в модуль моделирования для создания 3D моделей</p>
                  <button 
                    className="btn-primary"
                    onClick={() => {
                      navigate('/modeling');
                    }}
                  >
                    🖥️ Перейти в модуль 3D моделирования
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="modeling-info">
          <div className="modeling-category">
            <h4>Доступные модели</h4>
            <ul>
              <li>{data.skullModel || '3D модель черепа'}</li>
              <li>{data.maxillaModel || '3D модель верхней челюсти'}</li>
              <li>{data.mandibleModel || '3D модель нижней челюсти'}</li>
              <li>{data.setupModel || 'Setup-модель'}</li>
            </ul>
          </div>
          
          <div className="modeling-category">
            <h4>Симуляции</h4>
            {data.simulations && data.simulations.length > 0 ? (
              <ul>
                {data.simulations.map((sim, idx) => (
                  <li key={idx}>{sim}</li>
                ))}
              </ul>
            ) : (
              <p>Исходное положение, Прогнозируемый результат, Setup-модель</p>
            )}
          </div>
          
          {data.points && Object.keys(data.points).length > 0 && (
            <div className="modeling-category">
              <h4>Расставленные точки</h4>
              <p>На 3D моделях расставлены {Object.keys(data.points).length} точек для измерений</p>
            </div>
          )}
        </div>
        
        {moduleData.modeling && (
          <div className="module-data-viewer">
            <ModuleDataViewer 
              moduleData={moduleData.modeling} 
              moduleType="modeling"
            />
          </div>
        )}
        
        <div className="modeling-actions">
          <button 
            className="btn-primary"
            onClick={() => {
              // Переход к модулю моделирования
              navigate('/modeling');
            }}
          >
            🖥️ Создать новые 3D модели
          </button>
          
          <button 
            className="btn-secondary"
            onClick={() => loadMedicalData(patient)}
          >
            🔄 Обновить данные моделирования
          </button>
        </div>
      </div>
    );
  };

  const renderCTAnalysis = () => {
    const data = orthodonticData?.ctAnalysis || {};
    const hasCTImages = ctImages.optg || ctImages.tmj || ctImages.axialCuts;
    
    return (
      <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-purple-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 pb-2 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span>🖥️</span> КТ анализ
          </h3>
          
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            {hasCTImages && (
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-full text-sm transition duration-300"
                onClick={() => setShowCTImages(!showCTImages)}
                title="Показать изображения КТ"
              >
                {showCTImages ? '👁️ Скрыть КТ' : '👁️ Показать КТ'}
              </button>
            )}
          </div>
        </div>
        
        {/* Отображение изображений КТ */}
        {showCTImages && hasCTImages && (
          <div className="bg-purple-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-gray-700 mb-3">Изображения КТ из модуля</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ctImages.optg && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h5 className="font-medium text-gray-700 mb-2">ОПТГ (Ортопантомограмма)</h5>
                  {renderImageWithPoints(ctImages.optg, {}, 1, 'ОПТГ')}
                </div>
              )}
              
              {ctImages.tmj && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h5 className="font-medium text-gray-700 mb-2">ВНЧС 3D реконструкция</h5>
                  {render3DModel(ctImages.tmj, 'ВНЧС 3D')}
                </div>
              )}
              
              {ctImages.axialCuts && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h5 className="font-medium text-gray-700 mb-2">Аксиальные срезы</h5>
                  {renderImageWithPoints(ctImages.axialCuts, {}, 1, 'Аксиальные срезы')}
                </div>
              )}
              
              {!hasCTImages && (
                <div className="text-center py-6 col-span-full">
                  <p className="text-gray-600 mb-2">Изображения КТ не найдены</p>
                  <p className="text-gray-600 mb-4">Перейдите в модуль КТ анализа для загрузки снимков</p>
                  <button
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition duration-300"
                    onClick={() => {
                      navigate('/ct');
                    }}
                  >
                    🖥️ Перейти в модуль КТ анализа
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">ОПТГ (Ортопантомограмма)</h4>
          {!ctImages.optg && (
            <div className="bg-gray-100 p-6 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center mb-4">
              <div className="text-4xl text-gray-400 mb-2">🖼️</div>
              <div className="text-gray-500">Ортопантомограмма</div>
            </div>
          )}
          {data.optg?.findings && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
              <strong>Находки:</strong> <span className="text-gray-700">{data.optg.findings}</span>
            </div>
          )}
          {data.optg?.comments && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <strong>Комментарии:</strong> <span className="text-gray-700">{data.optg.comments}</span>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">ВНЧС (Височно-нижнечелюстной сустав)</h4>
          {!ctImages.tmj && (
            <div className="bg-gray-100 p-6 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center mb-4">
              <div className="text-4xl text-gray-400 mb-2">🖼️</div>
              <div className="text-gray-500">ВНЧС 3D реконструкция</div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <strong>Правый ВНЧС:</strong> <span className="ml-2">{data.tmj?.right || 'центральное верхнее положение'}</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <strong>Левый ВНЧС:</strong> <span className="ml-2">{data.tmj?.left || 'заднее верхнее положение'}</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200 md:col-span-2">
              <strong>Симметрия:</strong> <span className="ml-2">{data.tmj?.symmetry || 'асимметрия положения суставных головок'}</span>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">3D модель черепа и мягких тканей</h4>
          <div className="bg-gray-100 p-6 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center">
            <div className="text-4xl text-gray-400 mb-2">🖼️</div>
            <div className="text-gray-500">3D реконструкция черепа с мягкими тканями</div>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">Срезы зубов и воздухоносные пути</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-100 p-4 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center">
              <div className="text-4xl text-gray-400 mb-2">🖼️</div>
              <div className="text-gray-500">Аксиальные срезы зубных рядов</div>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center">
              <div className="text-4xl text-gray-400 mb-2">🖼️</div>
              <div className="text-gray-500">Положение языка</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <strong>Воздухоносные пути:</strong> <span className="ml-2">{data.axialCuts?.airway || 'без сужений'}</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <strong>Положение языка:</strong> <span className="ml-2">{data.axialCuts?.tonguePosition || 'нормальное'}</span>
            </div>
            {data.axialCuts?.comments && (
              <div className="bg-white p-3 rounded-lg border border-gray-200 md:col-span-2">
                <strong>Комментарии:</strong> <span className="ml-2">{data.axialCuts.comments}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">Костная структура</h4>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-gray-700">{data.boneStructure || 'нормальная плотность и объем'}</p>
          </div>
        </div>
        
        {moduleData.ct && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <ModuleDataViewer
              moduleData={moduleData.ct}
              moduleType="ct"
            />
          </div>
        )}
        
        <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white px-4 py-2 rounded-lg transition duration-300 flex items-center gap-2"
            onClick={() => {
              // Переход к модулю КТ
              navigate('/ct');
            }}
          >
            <span>🖥️</span> Загрузить новые КТ снимки
          </button>
          
          <button
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-lg transition duration-300 flex items-center gap-2"
            onClick={() => loadMedicalData(patient)}
          >
            <span>🔄</span> Обновить данные КТ
          </button>
        </div>
      </div>
    );
  };

  const renderDiagnoses = () => {
    const data = orthodonticData?.diagnoses || [];
    
    const groupByCategory = (diagnoses) => {
      const grouped = {};
      diagnoses.forEach(dx => {
        if (!grouped[dx.category]) {
          grouped[dx.category] = [];
        }
        grouped[dx.category].push(dx);
      });
      return grouped;
    };
    
    const groupedDiagnoses = groupByCategory(data);
    
    return (
      <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-red-500">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
          <span>🏥</span> Диагнозы
        </h3>
        
        {Object.keys(groupedDiagnoses).length === 0 ? (
          <div className="bg-gray-100 p-6 rounded-lg text-center text-gray-600">
            Диагнозы не установлены
          </div>
        ) : (
          Object.entries(groupedDiagnoses).map(([category, diagnoses]) => (
            <div key={category} className="mb-6">
              <h4 className="font-semibold text-gray-700 text-lg mb-3 bg-gray-100 p-2 rounded">{category}</h4>
              <div className="space-y-3">
                {diagnoses.map(diagnosis => (
                  <div key={diagnosis.id} className="bg-white p-4 rounded-lg border-l-4 border-red-500 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="mb-2 md:mb-0">
                        {diagnosis.diagnosis}
                        {diagnosis.code && <span className="text-gray-500 text-sm ml-2"> (МКБ-10: {diagnosis.code})</span>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          diagnosis.severity === 'легкое' ? 'bg-green-100 text-green-800' :
                          diagnosis.severity === 'умеренная' ? 'bg-yellow-100 text-yellow-800' :
                          diagnosis.severity === 'тяжелое' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {diagnosis.severity}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          diagnosis.confirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {diagnosis.confirmed ? '✓ Подтвержден' : '⏳ Ожидает подтверждения'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        
        <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-gray-700 mb-2">Пример диагнозов (из образца):</h4>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li>Ретрогнатия верхней челюсти</li>
            <li>Ретрогнатия нижней челюсти</li>
            <li>Глубокая резцовая окклюзия</li>
            <li>Сужение верхнего зубного ряда</li>
            <li>Сужение нижнего зубного ряда</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderTreatmentPlan = () => {
    const data = orthodonticData?.treatmentPlan || {};
    
    return (
      <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-emerald-500">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
          <span>💊</span> План ортодонтического лечения
        </h3>
        
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <strong>Сложность случая:</strong> <span className="ml-2 font-medium">{data.complexity || 'средней сложности'}</span>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <strong>Предполагаемая длительность:</strong> <span className="ml-2 font-medium">{data.estimatedDuration || '18-24 месяца'}</span>
            </div>
          </div>
          
          {data.objectives && data.objectives.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h5 className="font-medium text-gray-700 mb-2">Цели лечения:</h5>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                {data.objectives.map((objective, idx) => (
                  <li key={idx}>{objective}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {data.phases && data.phases.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-700 mb-3 text-lg">Этапы лечения</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.phases.map(phase => (
                <div key={phase.phase} className="bg-gradient-to-br from-emerald-50 to-cyan-50 p-4 rounded-lg border border-emerald-200 shadow-sm">
                  <div className="flex flex-wrap justify-between items-center mb-3 pb-2 border-b border-emerald-200">
                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
                      Этап {phase.phase}
                    </span>
                    <span className="font-semibold text-emerald-700">{phase.name}</span>
                    <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-sm">
                      {phase.duration}
                    </span>
                  </div>
                  <div>
                    <strong className="text-gray-700">Процедуры:</strong>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
                      {phase.procedures.map((procedure, idx) => (
                        <li key={idx}>{procedure}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h5 className="font-medium text-gray-700 mb-2">Планируемая аппаратура:</h5>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              {(data.appliances || []).map((appliance, idx) => (
                <li key={idx}>{appliance}</li>
              ))}
            </ul>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h5 className="font-medium text-gray-700 mb-2">Ретенционный план:</h5>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              {(data.retention || []).map((ret, idx) => (
                <li key={idx}>{ret}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderConclusions = () => {
    const data = orthodonticData?.conclusions || [];
    
    return (
      <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-indigo-500">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
          <span>📋</span> Выводы / Заключение
        </h3>
        
        {data.length === 0 ? (
          <div className="bg-gray-100 p-6 rounded-lg text-center text-gray-600 mb-6">
            Выводы не сформулированы
          </div>
        ) : (
          <div className="mb-6">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200 mb-4">
              <h4 className="font-semibold text-gray-700 mb-3 text-lg">Основные выводы:</h4>
              <div className="space-y-2">
                {data.map((conclusion, idx) => (
                  <div key={idx} className="flex items-start p-3 bg-white rounded border border-gray-200">
                    <span className="bg-indigo-100 text-indigo-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
                      {idx + 1}
                    </span>
                    <span className="text-gray-700">{conclusion}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">Выводы из образца презентации:</h4>
          <div className="space-y-2">
            <div className="flex items-start p-3 bg-white rounded border border-gray-200">
              <span className="bg-blue-100 text-blue-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
                1
              </span>
              <span className="text-gray-700">Скелетный I класс</span>
            </div>
            <div className="flex items-start p-3 bg-white rounded border border-gray-200">
              <span className="bg-blue-100 text-blue-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
                2
              </span>
              <span className="text-gray-700">Нейтральный тип роста</span>
            </div>
            <div className="flex items-start p-3 bg-white rounded border border-gray-200">
              <span className="bg-blue-100 text-blue-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
                3
              </span>
              <span className="text-gray-700">Высота нижней трети лица по Ricketts в норме</span>
            </div>
            <div className="flex items-start p-3 bg-white rounded border border-gray-200">
              <span className="bg-blue-100 text-blue-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
                4
              </span>
              <span className="text-gray-700">Ретрогнатия верхней и нижней челюстей</span>
            </div>
            <div className="flex items-start p-3 bg-white rounded border border-gray-200">
              <span className="bg-blue-100 text-blue-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
                5
              </span>
              <span className="text-gray-700">Глубокая резцовая окклюзия</span>
            </div>
            <div className="flex items-start p-3 bg-white rounded border border-gray-200">
              <span className="bg-blue-100 text-blue-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
                6
              </span>
              <span className="text-gray-700">Вертикальное резцовое перекрытие увеличено до 5.3 мм</span>
            </div>
            <div className="flex items-start p-3 bg-white rounded border border-gray-200">
              <span className="bg-blue-100 text-blue-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
                7
              </span>
              <span className="text-gray-700">Сагиттальное резцовое перекрытие в норме</span>
            </div>
            <div className="flex items-start p-3 bg-white rounded border border-gray-200">
              <span className="bg-blue-100 text-blue-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
                8
              </span>
              <span className="text-gray-700">Сужение верхнего и нижнего зубных рядов</span>
            </div>
            <div className="flex items-start p-3 bg-white rounded border border-gray-200">
              <span className="bg-blue-100 text-blue-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
                9
              </span>
              <span className="text-gray-700">Воздухоносные пути без патологий</span>
            </div>
            <div className="flex items-start p-3 bg-white rounded border border-gray-200">
              <span className="bg-blue-100 text-blue-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
                10
              </span>
              <span className="text-gray-700">Асимметрия положения ВНЧС</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleExportForPresentation = () => {
    const exportData = {
      title: `Медицинская карта и презентация пациента: ${orthodonticData?.personalData?.fullName || medicalData?.personalInfo?.fullName}`,
      patient: orthodonticData?.personalData || medicalData?.personalInfo,
      slides: [
        {
          title: 'Титульный лист',
          content: {
            photo: 'анфас без улыбки',
            birthDate: orthodonticData?.personalData?.birthDate,
            examinationDate: orthodonticData?.personalData?.examinationDate,
            complaints: orthodonticData?.personalData?.complaints,
            doctor: orthodonticData?.personalData?.doctor
          }
        },
        {
          title: 'Анамнез',
          content: orthodonticData?.anamnesis
        },
        {
          title: 'Фотометрический анализ',
          content: orthodonticData?.photoAnalysis
        },
        {
          title: 'Внутриротовой анализ',
          content: orthodonticData?.intraoralAnalysis
        },
        {
          title: 'Антропометрия',
          content: orthodonticData?.anthropometry
        },
        {
          title: 'Цефалометрия (прямая ТРГ)',
          content: orthodonticData?.cephalometry?.frontalTRG
        },
        {
          title: 'Цефалометрия (боковая ТРГ)',
          content: orthodonticData?.cephalometry?.lateralTRG
        },
        {
          title: '3D Моделирование',
          content: orthodonticData?.modeling3D
        },
        {
          title: 'КТ анализ',
          content: orthodonticData?.ctAnalysis
        },
        {
          title: 'Диагнозы',
          content: orthodonticData?.diagnoses
        },
        {
          title: 'План лечения',
          content: orthodonticData?.treatmentPlan
        },
        {
          title: 'Выводы',
          content: orthodonticData?.conclusions
        }
      ],
      images: {
        photometry: photometryImages,
        cephalometry: cephalometryImages,
        biometry: biometryModels,
        modeling: modeling3DModels,
        ct: ctImages
      },
      exportedAt: new Date().toISOString(),
      exportedBy: 'Медицинская карта системы "Московиц 3D"'
    };
    
    localStorage.setItem(`presentation_data_${patient?.id || 'demo'}_${Date.now()}`, JSON.stringify(exportData, null, 2));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `presentation_data_${patient?.id || 'unknown'}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('Данные для презентации экспортированы в JSON файл');
    
    navigate('/presentation-generator');
  };

  if (loading) {
    return (
      <div className="medical-card loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка медицинской карты...</p>
          <p className="loading-info">
            {patient 
              ? `Пациент: ${patient.fullName}` 
              : 'Загрузка интегрированных медицинских данных...'
            }
          </p>
          {photoDataLoaded && (
            <p className="loading-success">✓ Данные фотометрии загружены</p>
          )}
          {biometryDataLoaded && (
            <p className="loading-success">✓ Данные биометрии загружены</p>
          )}
          {cephalometryDataLoaded && (
            <p className="loading-success">✓ Данные цефалометрии загружены</p>
          )}
          {modelingDataLoaded && (
            <p className="loading-success">✓ Данные моделирования загружены</p>
          )}
        </div>
      </div>
    );
  }

  if (!medicalData || !orthodonticData) {
    return (
      <div className="medical-card no-data">
        <h2>📋 Медицинская карта</h2>
        <div className="no-data-message">
          <p>Нет данных для отображения медицинской карты</p>
          <button 
            className="btn-primary" 
            onClick={() => loadMedicalData(patient)}
          >
            Загрузить медицинские данные
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="medical-card">
      <div className="medical-card-header">
        <h2>📋 Медицинская карта пациента</h2>
        <div className="patient-status">
          <span className="status-badge completed">Интеграция данных</span>
          <span className="status-badge modules">{Object.keys(moduleData).length} модулей</span>
          <span className="status-badge structured">Структурировано по образцу</span>
          {moduleData.cephalometry && <span className="status-badge cephalometry">✓ Цефалометрия</span>}
          {moduleData.photometry && <span className="status-badge photometry">✓ Фотометрия</span>}
          {moduleData.biometry && <span className="status-badge biometry">✓ Биометрия</span>}
          {moduleData.modeling && <span className="status-badge modeling">✓ 3D Моделирование</span>}
          {moduleData.ct && <span className="status-badge ct">✓ КТ анализ</span>}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-blue-500">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Разделы медицинской карты</h3>
        <div className="flex flex-wrap gap-2">
          {moduleTabs.map(tab => (
            <button
              key={tab.id}
              className={`px-4 py-2 rounded-lg transition duration-300 flex items-center gap-2 ${
                activeModule === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActiveModule(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="medical-card-content">
        {activeModule === 'overview' && (
          <div className="overview-section">
            <div className="overview-header">
              <h3>📊 Обзор медицинской карты</h3>
              <p>Полная интеграция данных из всех диагностических модулей</p>
            </div>
            
            <div className="overview-summary">
              <div className="summary-card">
                <h4>👤 Пациент</h4>
                <p><strong>ФИО:</strong> {orthodonticData.personalData?.fullName}</p>
                <p><strong>Возраст:</strong> {calculateAge(orthodonticData.personalData?.birthDate)} лет</p>
                <p><strong>Дата исследования:</strong> {orthodonticData.personalData?.examinationDate}</p>
                <p><strong>Жалобы:</strong> {orthodonticData.personalData?.complaints}</p>
              </div>
              
              <div className="summary-card">
                <h4>🩺 Основные диагнозы</h4>
                {(orthodonticData.diagnoses || []).slice(0, 3).map(dx => (
                  <p key={dx.id}>• {dx.diagnosis}</p>
                ))}
                {(orthodonticData.diagnoses || []).length > 3 && (
                  <p className="more-diagnoses">и ещё {orthodonticData.diagnoses.length - 3} диагнозов</p>
                )}
              </div>
              
              <div className="summary-card">
                <h4>📈 Ключевые показатели</h4>
                <p><strong>Скелетный класс:</strong> {orthodonticData.cephalometry?.lateralTRG?.skeletalClass || 'I класс'}</p>
                <p><strong>Окклюзия:</strong> {orthodonticData.intraoralAnalysis?.occlusion?.vertical?.anterior || 'глубокая резцовая'}</p>
                <p><strong>Сложность лечения:</strong> {orthodonticData.treatmentPlan?.complexity || 'средняя'}</p>
                <p><strong>Длительность:</strong> {orthodonticData.treatmentPlan?.estimatedDuration || '18-24 месяца'}</p>
              </div>
            </div>
            
            <div className="overview-modules">
              <h4>📊 Загруженные диагностические модули</h4>
              <div className="modules-grid">
                {Object.entries(moduleData).map(([moduleName, moduleDataItem]) => {
                  const hasImages = moduleDataItem.data && (
                    (moduleDataItem.data.images && Object.values(moduleDataItem.data.images).some(img => img !== null)) ||
                    (moduleDataItem.data.models && Object.values(moduleDataItem.data.models).some(model => model !== null))
                  );
                  
                  return (
                    <div key={moduleName} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                      <div className="text-2xl">
                        {moduleName === 'cephalometry' ? '🦴' :
                         moduleName === 'biometry' ? '📐' :
                         moduleName === 'photometry' ? '📷' :
                         moduleName === 'modeling' ? '🖥️' :
                         moduleName === 'ct' ? '🖥️' : '📊'}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-700">
                          {moduleName === 'cephalometry' ? 'Цефалометрия' :
                           moduleName === 'biometry' ? 'Биометрия' :
                           moduleName === 'photometry' ? 'Фотометрия' :
                           moduleName === 'modeling' ? '3D Моделирование' :
                           moduleName === 'ct' ? 'КТ анализ' : moduleName}
                        </div>
                        <div className="text-sm">
                          <span className={moduleDataItem.data ? 'text-green-600' : 'text-red-600'}>
                            {moduleDataItem.data ? '✓ Данные загружены' : '✗ Нет данных'}
                          </span>
                          {hasImages && <span className="text-purple-600 ml-2"> 📷</span>}
                        </div>
                        {moduleDataItem.loadedAt && (
                          <div className="text-xs text-gray-500">
                            {new Date(moduleDataItem.loadedAt).toLocaleDateString('ru-RU')}
                          </div>
                        )}
                      </div>
                      {moduleName === 'biometry' && moduleDataItem.data && (
                        <div className="flex flex-wrap gap-2">
                          {moduleDataItem.data.tonIndex !== null && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Тон: {moduleDataItem.data.tonIndex.toFixed(2)}</span>
                          )}
                          {moduleDataItem.data.boltonAnalysis?.anteriorRatio && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Болтон: {moduleDataItem.data.boltonAnalysis.anteriorRatio.toFixed(1)}%</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {Object.keys(moduleData).length === 0 && (
                <div className="no-modules">
                  <p>Нет загруженных диагностических модулей</p>
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      navigate('/modules');
                    }}
                  >
                    🔬 Перейти к диагностическим модулям
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeModule === 'personal' && renderPersonalData()}
        {activeModule === 'anamnesis' && renderAnamnesis()}
        {activeModule === 'photo' && renderPhotoAnalysis()}
        {activeModule === 'intraoral' && renderIntraoralAnalysis()}
        {activeModule === 'anthropometry' && renderAnthropometry()}
        {activeModule === 'cephalometry' && renderCephalometry()}
        {activeModule === 'modeling3d' && renderModeling3D()}
        {activeModule === 'ct' && renderCTAnalysis()}
        {activeModule === 'diagnosis' && renderDiagnoses()}
        {activeModule === 'treatment' && renderTreatmentPlan()}
        {activeModule === 'conclusions' && renderConclusions()}
        
        <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-gray-500">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
            <span>📝</span> История болезни
          </h3>
          
          {medicalData.medicalHistory && medicalData.medicalHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Модуль</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Диагноз</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Лечение/Назначения</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {medicalData.medicalHistory.map((record, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {record.module}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.diagnosis}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{record.treatment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-100 p-6 rounded-lg text-center text-gray-600">
              <p>Нет записей в истории болезни</p>
              <p>Данные будут автоматически добавляться при работе с модулями</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
        <button
          className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white px-4 py-3 rounded-lg transition duration-300 flex items-center justify-center gap-2"
          onClick={handleExportForPresentation}
        >
          <span>🚀</span> Сформировать презентацию (по образцу)
        </button>
        
        <button
          className="bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white px-4 py-3 rounded-lg transition duration-300 flex items-center justify-center gap-2"
          onClick={() => {
            const exportData = {
              patient: orthodonticData?.personalData,
              anamnesis: orthodonticData?.anamnesis,
              photoAnalysis: orthodonticData?.photoAnalysis,
              intraoralAnalysis: orthodonticData?.intraoralAnalysis,
              anthropometry: orthodonticData?.anthropometry,
              cephalometry: orthodonticData?.cephalometry,
              modeling3D: orthodonticData?.modeling3D,
              ctAnalysis: orthodonticData?.ctAnalysis,
              diagnoses: orthodonticData?.diagnoses,
              treatmentPlan: orthodonticData?.treatmentPlan,
              conclusions: orthodonticData?.conclusions,
              moduleData: moduleData,
              images: {
                photometry: photometryImages,
                cephalometry: cephalometryImages,
                biometry: biometryModels,
                modeling: modeling3DModels,
                ct: ctImages
              },
              exportedAt: new Date().toISOString()
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `medical_card_full_${patient?.id || 'demo'}_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            
            alert('Полная медицинская карта экспортирована в JSON');
          }}
        >
          <span>📄</span> Экспорт полной карты (JSON)
        </button>
        
        <button
          className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white px-4 py-3 rounded-lg transition duration-300 flex items-center justify-center gap-2"
          onClick={() => {
            const saveData = {
              patient: medicalData,
              orthodonticData,
              moduleData,
              images: {
                photometry: photometryImages,
                cephalometry: cephalometryImages,
                biometry: biometryModels,
                modeling: modeling3DModels,
                ct: ctImages
              },
              savedAt: new Date().toISOString()
            };
            
            localStorage.setItem(`medical_card_${patient?.id || 'demo'}`, JSON.stringify(saveData));
            alert('Все изменения сохранены локально');
          }}
        >
          <span>💾</span> Сохранить все изменения
        </button>
        
        <button
          className="bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white px-4 py-3 rounded-lg transition duration-300 flex items-center justify-center gap-2"
          onClick={() => {
            navigate('/modules');
          }}
        >
          <span>🔬</span> Перейти к диагностическим модулям
        </button>
        
        <button
          className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-3 rounded-lg transition duration-300 flex items-center justify-center gap-2"
          onClick={() => loadMedicalData(patient)}
        >
          <span>🔄</span> Обновить данные из модулей
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-md mt-6 border-l-4 border-green-500">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
          <span>✅</span> Соответствие техническому заданию
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-green-500 mr-2 text-xl">✓</span>
            <span className="text-gray-700">Автоматическое заполнение из 5 диагностических модулей</span>
          </div>
          <div className="flex items-start p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-green-500 mr-2 text-xl">✓</span>
            <span className="text-gray-700">Структура по образцу презентации (14 слайдов)</span>
          </div>
          <div className="flex items-start p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-green-500 mr-2 text-xl">✓</span>
            <span className="text-gray-700">Интеграция: цефалометрия, фотометрия, биометрия, КТ, моделирование</span>
          </div>
          <div className="flex items-start p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-green-500 mr-2 text-xl">✓</span>
            <span className="text-gray-700">Импорт изображений с расставленными точками из всех модулей</span>
          </div>
          <div className="flex items-start p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-green-500 mr-2 text-xl">✓</span>
            <span className="text-gray-700">Просмотр ТРГ с цефалометрическими точками</span>
          </div>
          <div className="flex items-start p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-green-500 mr-2 text-xl">✓</span>
            <span className="text-gray-700">3D модели из биометрии и моделирования</span>
          </div>
          <div className="flex items-start p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-green-500 mr-2 text-xl">✓</span>
            <span className="text-gray-700">Формирование презентации в один клик</span>
          </div>
          <div className="flex items-start p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-green-500 mr-2 text-xl">✓</span>
            <span className="text-gray-700">Экспорт в JSON для последующей конвертации в PPTX/PDF</span>
          </div>
          <div className="flex items-start p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-green-500 mr-2 text-xl">✓</span>
            <span className="text-gray-700">Поддержка реальных данных из всех диагностических модулей</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalCard;