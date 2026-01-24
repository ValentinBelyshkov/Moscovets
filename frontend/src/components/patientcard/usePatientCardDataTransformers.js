import { useCallback } from 'react';

export const usePatientCardDataTransformers = () => {
  // Функция для извлечения изображений из данных модуля
  const extractImagesFromModuleData = useCallback((moduleName, moduleData) => {
    if (!moduleData) return null;

    const images = {};

    switch (moduleName) {
      case 'photometry':
        if (moduleData.images) {
          images.frontal = moduleData.images.frontal || null;
          images.profile = moduleData.images.profile || null;
          images.profile45 = moduleData.images.profile45 || null;
          images.intraoral = moduleData.images.intraoral || null;
        }
        break;

      case 'cephalometry':
        if (moduleData.images) {
          images.frontalTRG = moduleData.images.frontalTRG || null;
          images.lateralTRG = moduleData.images.lateralTRG || null;
        }
        break;

      case 'biometry':
        if (moduleData.models) {
          images.upperJaw = moduleData.models.upperJaw || null;
          images.lowerJaw = moduleData.models.lowerJaw || null;
          images.occlusion = moduleData.models.occlusion || null;
        }
        break;

      case 'modeling':
        if (moduleData.models) {
          images.skull = moduleData.models.skull || null;
          images.maxilla = moduleData.models.maxilla || null;
          images.mandible = moduleData.models.mandible || null;
          images.setup = moduleData.models.setup || null;
        }
        break;

      case 'ct':
        if (moduleData.images) {
          images.optg = moduleData.images.optg || null;
          images.tmj = moduleData.images.tmj || null;
          images.axialCuts = moduleData.images.axialCuts || null;
        }
        break;

      default:
        break;
    }

    return Object.keys(images).length > 0 ? images : null;
  }, []);

  // Функция для преобразования данных модуля в структуру для отображения
  const transformModuleDataForDisplay = useCallback((moduleName, moduleData) => {
    if (!moduleData) {
      return {
        id: moduleName,
        name: getModuleName(moduleName),
        icon: getModuleIcon(moduleName),
        color: getModuleColor(moduleName),
        hasData: false,
        lastResult: 'Нет данных',
        date: null,
        measurements: {}
      };
    }

    let measurements = {};

    switch (moduleName) {
      case 'photometry':
        if (moduleData.measurements) {
          const facialIndex = moduleData.measurements.FacialIndex?.value;
          const faceType = moduleData.measurements.FacialIndex?.interpretation;
          if (facialIndex) measurements['Лицевой индекс'] = `${facialIndex}%`;
          if (faceType) measurements['Тип лица'] = faceType;
          if (moduleData.points?.gn) measurements['Профиль'] = 'Прямой';
        }
        break;

      case 'cephalometry':
        if (moduleData.measurements) {
          const sna = moduleData.measurements.SNA?.value;
          const snb = moduleData.measurements.SNB?.value;
          const anb = moduleData.measurements.ANB?.value;
          if (sna) measurements['SNA'] = `${sna}°`;
          if (snb) measurements['SNB'] = `${snb}°`;
          if (anb) measurements['ANB'] = `${anb}°`;
        }
        break;

      case 'biometry':
        if (moduleData.measurements) {
          const tonIndex = moduleData.measurements.TonIndex?.value;
          const overall = moduleData.measurements.BoltonOverall?.value;
          if (tonIndex) measurements['Тон-индекс'] = tonIndex;
          if (overall) measurements['Болтон'] = `${overall}%`;
        }
        break;

      default:
        break;
    }

    return {
      id: moduleName,
      name: getModuleName(moduleName),
      icon: getModuleIcon(moduleName),
      color: getModuleColor(moduleName),
      hasData: true,
      lastResult: getModuleResult(moduleName, moduleData),
      date: moduleData.analysisDate || new Date().toISOString().split('T')[0],
      measurements
    };
  }, []);

  // Функция для получения названий модулей
  const getModuleName = useCallback((moduleId) => {
    const names = {
      photometry: 'Фотометрия',
      cephalometry: 'Цефалометрия',
      biometry: 'Биометрия',
      modeling: '3D Моделирование',
      ct: 'КТ Анализ'
    };
    return names[moduleId] || moduleId;
  }, []);

  // Функция для получения иконок модулей
  const getModuleIcon = useCallback((moduleId) => {
    const icons = {
      photometry: '📷',
      cephalometry: '🦴',
      biometry: '📐',
      modeling: '🖥️',
      ct: '🩻'
    };
    return icons[moduleId] || '📊';
  }, []);

  // Функция для получения цветов модулей
  const getModuleColor = useCallback((moduleId) => {
    const colors = {
      photometry: 'bg-blue-500',
      cephalometry: 'bg-emerald-500',
      biometry: 'bg-purple-500',
      modeling: 'bg-amber-500',
      ct: 'bg-rose-500'
    };
    return colors[moduleId] || 'bg-gray-500';
  }, []);

  // Функция для получения результата модуля
  const getModuleResult = useCallback((moduleId, moduleData) => {
    if (!moduleData) return 'Нет данных';

    switch (moduleId) {
      case 'photometry':
        return moduleData.report?.conclusion || 'Анализ выполнен';
      case 'cephalometry':
        return moduleData.report?.skeletalClass || 'Скелетный I класс';
      case 'biometry':
        return moduleData.report?.bolton || 'Болтон: 77.2%';
      case 'modeling':
        return moduleData.models ? 'Модели загружены' : 'Нет данных';
      case 'ct':
        return moduleData.images ? 'Снимки загружены' : 'Нет данных';
      default:
        return 'Нет данных';
    }
  }, []);

  // Функция для группировки истории по датам
  const groupHistoryByDate = useCallback((history) => {
    return history.reduce((acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = [];
      }
      acc[item.date].push(item);
      return acc;
    }, {});
  }, []);

  // Функция для сортировки дат
  const sortDates = useCallback((dates) => {
    return dates.sort((a, b) => new Date(b) - new Date(a));
  }, []);

  return {
    extractImagesFromModuleData,
    transformModuleDataForDisplay,
    getModuleName,
    getModuleIcon,
    getModuleColor,
    getModuleResult,
    groupHistoryByDate,
    sortDates
  };
};
