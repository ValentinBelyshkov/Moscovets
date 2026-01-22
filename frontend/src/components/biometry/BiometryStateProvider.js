import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useData } from '../../contexts/DataContext';
import localMedicalRecordService from '../../services/localMedicalRecordService';

const BiometryStateProvider = ({ children }) => {
  // Используем контекст для получения данных
  const { updateMedicalCardData, currentPatient, medicalCardData } = useData();
  
  // Используем текущего пациента из контекста
  const activePatient = currentPatient || medicalCardData?.patient;
  
  // State for biometry data
  const [biometryData, setBiometryData] = useState({
    patientName: activePatient?.fullName || 'Иванов Иван Иванович',
    patientId: activePatient?.id || null,
    analysisDate: new Date().toISOString().split('T')[0],
    model3D: null,
    modelType: null,
    modelFile: null,
    points: {},
    measurements: {},
    interpretation: {},
    
    // Мезиодистальные размеры зубов из таблицы ТЗ
    toothMeasurements: {
      // Верхняя челюсть (16-26)
      upperJaw: {
        '16': 10, '15': 10, '14': 7, '13': 7.1, '12': 7.9, '11': 7.2,
        '21': 9.9, '22': 9.5, '23': 7, '24': 7.8, '25': 7, '26': 7
      },
      // Нижняя челюсть (36-46)
      lowerJaw: {
        '36': 10.8, '35': 11.1, '34': 6.8, '33': 7, '32': 7, '31': 5.8,
        '41': 5.5, '42': 5.6, '43': 5.9, '44': 7.1, '45': 7.1, '46': 7
      }
    },
    
    tonIndex: null,
    tonInterpretation: '',
    
    boltonAnalysis: {
      upperSum6: 0,
      lowerSum6: 0,
      upperSum12: 0,
      lowerSum12: 0,
      anteriorRatio: 0,
      overallRatio: 0,
      difference: 0,
      interpretation: ''
    },
    
    pontAnalysis: {
      upperPremolar: {
        actualWidth: 0,
        normalWidth: 0,
        difference: 0,
        interpretation: ''
      },
      upperMolar: {
        actualWidth: 0,
        normalWidth: 0,
        difference: 0,
        interpretation: ''
      },
      lowerPremolar: {
        actualWidth: 0,
        normalWidth: 0,
        difference: 0,
        interpretation: ''
      },
      lowerMolar: {
        actualWidth: 0,
        normalWidth: 0,
        difference: 0,
        interpretation: ''
      }
    },
    
    korkhausAnalysis: {
      upperSegment: {
        actualLength: 0,
        normalLength: 0,
        difference: 0,
        interpretation: ''
      },
      lowerSegment: {
        actualLength: 0,
        normalLength: 0,
        difference: 0,
        interpretation: ''
      }
    },
    
    snaginaMethod: {
      upperApicalLength: 0,
      upperApicalWidth: 0,
      lowerApicalLength: 0,
      lowerApicalWidth: 0
    },
    
    slabkovskayaMethod: {
      upperCanineWidth: 0,
      lowerCanineWidth: 0
    },
    
    spaceAnalysis: {
      upperToothSum: 0,
      upperArchLength: 0,
      upperDeficit: 0,
      lowerToothSum: 0,
      lowerArchLength: 0,
      lowerDeficit: 0,
      interpretation: ''
    },
    
    symmetryAnalysis: {
      upperLeftWidth: 0,
      upperRightWidth: 0,
      upperDifference: 0,
      lowerLeftWidth: 0,
      lowerRightWidth: 0,
      lowerDifference: 0,
      interpretation: ''
    },
    
    speeCurve: {
      depth: 0,
      interpretation: ''
    }
  });
  
  // State to track if 3D model is uploaded
  const [model3DUploaded, setModel3DUploaded] = useState(false);
  
  const [activeTool, setActiveTool] = useState('select');
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [nextPointToPlace, setNextPointToPlace] = useState(null);
  const [error, setError] = useState(null);
  const [calculationsPerformed, setCalculationsPerformed] = useState(false);
  const [showPointPlacementGuide, setShowPointPlacementGuide] = useState(false);

  // ============ НАСТРОЙКИ ВИЗУАЛИЗАЦИИ ============
  const [visualizationSettings, setVisualizationSettings] = useState({
    showDistances: true,
    showAngles: false,
    showLabels: false,
    showPlanes: true,
    showPoints: true,
    pointType: 'sphere',
    pointSize: 1.0,
    lineWidth: 2,
    planeOpacity: 0.3
  });
  
  // ============ БИОМЕТРИЧЕСКИЕ ПЛОСКОСТИ ============
  const [biometryPlanes, setBiometryPlanes] = useState({
    OcclusalPlane: true,
    CurveOfSpee: true,
    ApicalBasisPlane: false,
    ArchPlane: false,
    PontPremolarPlane: false,
    PontMolarPlane: false,
    MidlinePlane: true,
    TransversePlane: false,
  });

  const threeDViewerRef = useRef(null);
  const pointsListRef = useRef(null);
  const fileInputRef = useRef(null);

  // Функция для расчета расстояния между двумя точками
  const calculateDistance = useCallback((point1, point2) => {
    if (!point1 || !point2) return 0;
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }, []);

  // Функция для перемещения выбранной точки
  const handleMovePoint = useCallback(() => {
    setActiveTool('move');
    if (selectedPoint) {
      alert(`🚚 Режим перемещения активирован для точки ${selectedPoint}.\nНажмите на точку в 3D виде для перемещения.`);
    } else {
      alert('Выберите точку для перемещения');
    }
  }, [selectedPoint]);

  // Функция удаления выбранной точки - ИСПРАВЛЕНА
  const handleDeleteSelectedPoint = useCallback(() => {
    if (!selectedPoint) {
      alert('Выберите точку для удаления');
      return;
    }
    
    if (window.confirm(`Удалить точку ${selectedPoint}?`)) {
      setBiometryData(prev => {
        const newPoints = { ...prev.points };
        delete newPoints[selectedPoint];
        
        return {
          ...prev,
          points: newPoints
        };
      });
      
      setSelectedPoint(null);
    }
  }, [selectedPoint]);

  // Обработчик добавления точки из 3DViewer
  const handle3DPointAdd = useCallback((pointId, position) => {
    console.log('✅ Добавление 3D точки:', { pointId, position });
    
    setBiometryData(prev => {
      const newPoints = {
        ...prev.points,
        [pointId]: position
      };
      
      return {
        ...prev,
        points: newPoints
      };
    });
  }, []);

  // Функция сохранения в медицинскую карту
  const saveBiometryToMedicalCard = useCallback(() => {
    if (!calculationsPerformed) {
      alert('Сначала выполните расчеты биометрии');
      return;
    }
    
    // Используем ID активного пациента
    const patientId = activePatient?.id || 1;
    const patientName = activePatient?.fullName || biometryData.patientName;
    
    // Формируем данные для сохранения
    const biometryDataToSave = {
      patientId: patientId,
      patientName: patientName,
      analysisDate: biometryData.analysisDate,
      modelType: biometryData.modelType,
      measurements: biometryData.measurements,
      tonIndex: biometryData.tonIndex,
      tonInterpretation: biometryData.tonInterpretation,
      boltonAnalysis: biometryData.boltonAnalysis,
      pontAnalysis: biometryData.pontAnalysis,
      korkhausAnalysis: biometryData.korkhausAnalysis,
      snaginaMethod: biometryData.snaginaMethod,
      slabkovskayaMethod: biometryData.slabkovskayaMethod,
      speeCurve: biometryData.speeCurve,
      toothMeasurements: biometryData.toothMeasurements,
      savedAt: new Date().toISOString(),
      source: 'biometry_module'
    };
    
    try {
      // Сохраняем в localStorage
      const storageKey = `biometry_data_${patientId}_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(biometryDataToSave));
      
      // Обновляем контекст данных
      if (updateMedicalCardData) {
        updateMedicalCardData({
          type: 'UPDATE_BIOMETRY',
          data: biometryDataToSave,
          patientId: patientId
        });
      }
      
      // Также обновляем имя пациента в локальном state
      setBiometryData(prev => ({
        ...prev,
        patientName: patientName,
        patientId: patientId
      }));
      
      alert('✅ Данные биометрии успешно сохранены в медицинскую карту!');
      return true;
    } catch (error) {
      console.error('Error saving biometry data:', error);
      alert('❌ Ошибка при сохранении данных в медицинскую карту');
      return false;
    }
  }, [biometryData, calculationsPerformed, activePatient, updateMedicalCardData]);

  // Обновляем функцию инициализации для использования актуального пациента
  useEffect(() => {
    if (activePatient) {
      setBiometryData(prev => ({
        ...prev,
        patientName: activePatient.fullName || prev.patientName,
        patientId: activePatient.id || prev.patientId
      }));
    }
  }, [activePatient]);

  // Handle 3D model upload
  const handleModelUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setError(null);
    
    const fileName = file.name.toLowerCase();
    let modelType = null;
    if (fileName.endsWith('.stl')) {
      modelType = 'stl';
    } else if (fileName.endsWith('.obj')) {
      modelType = 'obj';
    } else {
      setError('Неподдерживаемый формат файла. Пожалуйста, выберите STL или OBJ файл.');
      return;
    }
    
    const modelUrl = URL.createObjectURL(file);
    
    const newState = {
      model3D: modelUrl,
      modelType: modelType,
      modelFile: file,
      points: {},
      measurements: {},
      tonIndex: null,
      tonInterpretation: '',
      boltonAnalysis: {
        upperSum6: 0, lowerSum6: 0, upperSum12: 0, lowerSum12: 0,
        anteriorRatio: 0, overallRatio: 0, difference: 0, interpretation: ''
      },
      pontAnalysis: {
        upperPremolar: { actualWidth: 0, normalWidth: 0, difference: 0, interpretation: '' },
        upperMolar: { actualWidth: 0, normalWidth: 0, difference: 0, interpretation: '' },
        lowerPremolar: { actualWidth: 0, normalWidth: 0, difference: 0, interpretation: '' },
        lowerMolar: { actualWidth: 0, normalWidth: 0, difference: 0, interpretation: '' }
      },
      korkhausAnalysis: {
        upperSegment: { actualLength: 0, normalLength: 0, difference: 0, interpretation: '' },
        lowerSegment: { actualLength: 0, normalLength: 0, difference: 0, interpretation: '' }
      },
      snaginaMethod: {
        upperApicalLength: 0, upperApicalWidth: 0, lowerApicalLength: 0, lowerApicalWidth: 0
      },
      slabkovskayaMethod: { upperCanineWidth: 0, lowerCanineWidth: 0 },
      speeCurve: { depth: 0, interpretation: '' }
    };
    
    setBiometryData(prev => ({
      ...prev,
      ...newState
    }));
    
    setModel3DUploaded(true);
    setCalculationsPerformed(false);
    setActiveTool('select');
    setSelectedPoint(null);
    setNextPointToPlace(null);
    setShowPointPlacementGuide(false);
  };

  const value = {
    // State
    biometryData,
    setBiometryData,
    model3DUploaded,
    setModel3DUploaded,
    activeTool,
    setActiveTool,
    selectedPoint,
    setSelectedPoint,
    nextPointToPlace,
    setNextPointToPlace,
    error,
    setError,
    calculationsPerformed,
    setCalculationsPerformed,
    showPointPlacementGuide,
    setShowPointPlacementGuide,
    visualizationSettings,
    setVisualizationSettings,
    biometryPlanes,
    setBiometryPlanes,
    
    // Refs
    threeDViewerRef,
    pointsListRef,
    fileInputRef,
    
    // Functions
    calculateDistance,
    handleMovePoint,
    handleDeleteSelectedPoint,
    handle3DPointAdd,
    saveBiometryToMedicalCard,
    handleModelUpload,
    
    // Context
    activePatient,
  };

  return (
    <React.Fragment>
      {typeof children === 'function' ? children(value) : children}
    </React.Fragment>
  );
};

export default BiometryStateProvider;
