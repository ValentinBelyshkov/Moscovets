import { useState, useRef } from 'react';

export const usePatientCardState = (patientProp) => {
  // Пациент
  const [patient, setPatient] = useState(patientProp || null);
  const [loading, setLoading] = useState(!patientProp);
  const [error, setError] = useState(null);

  // Вкладки
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);

  // Данные модулей
  const [moduleData, setModuleData] = useState({});
  const [modules, setModules] = useState([]);

  // История болезни
  const [medicalHistory, setMedicalHistory] = useState([]);

  // Изображения и модели
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

  // Статусы загрузки модулей
  const [photoDataLoaded, setPhotoDataLoaded] = useState(false);
  const [biometryDataLoaded, setBiometryDataLoaded] = useState(false);
  const [cephalometryDataLoaded, setCephalometryDataLoaded] = useState(false);
  const [modelingDataLoaded, setModelingDataLoaded] = useState(false);

  // Интегрированные данные (как в MedicalCard)
  const [medicalData, setMedicalData] = useState(null);
  const [orthodonticData, setOrthodonticData] = useState(null);

  // Состояние медицинской карты
  const [isEditingMedicalCard, setIsEditingMedicalCard] = useState(false);
  const [medicalCardForm, setMedicalCardForm] = useState({
    faceProfile: {
      upperLip: 'normal',
      lowerLip: 'normal',
      chin: 'normal'
    }
  });

  // Состояние для управления формой загрузки фото
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  // Реф для предотвращения повторной загрузки
  const hasLoadedRef = useRef(false);

  return {
    // Пациент
    patient,
    setPatient,
    loading,
    setLoading,
    error,
    setError,

    // Вкладки
    activeTab,
    setActiveTab,
    selectedHistoryDate,
    setSelectedHistoryDate,

    // Данные модулей
    moduleData,
    setModuleData,
    modules,
    setModules,

    // История болезни
    medicalHistory,
    setMedicalHistory,

    // Изображения и модели
    photometryImages,
    setPhotometryImages,
    cephalometryImages,
    setCephalometryImages,
    biometryModels,
    setBiometryModels,
    modeling3DModels,
    setModeling3DModels,
    ctImages,
    setCTImages,

    // Статусы загрузки
    photoDataLoaded,
    setPhotoDataLoaded,
    biometryDataLoaded,
    setBiometryDataLoaded,
    cephalometryDataLoaded,
    setCephalometryDataLoaded,
    modelingDataLoaded,
    setModelingDataLoaded,

    // Интегрированные данные
    medicalData,
    setMedicalData,
    orthodonticData,
    setOrthodonticData,

    // Состояние медицинской карты
    isEditingMedicalCard,
    setIsEditingMedicalCard,
    medicalCardForm,
    setMedicalCardForm,

    // Состояние для управления формой загрузки фото
    showPhotoUpload,
    setShowPhotoUpload,

    // Реф
    hasLoadedRef
  };
};
