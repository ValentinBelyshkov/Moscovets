import { useCallback } from 'react';

export const useMedicalCardDataTransformers = (patient) => {
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

  return {
    transformPhotometryData,
    transformBiometryData,
    transformCephalometryData,
    transformModelingData,
    transformCTData,
    extractImagesFromModuleData
  };
};
