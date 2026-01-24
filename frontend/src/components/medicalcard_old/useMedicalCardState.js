import { useState, useRef } from 'react';

export const useMedicalCardState = () => {
  // Основные состояния данных
  const [medicalData, setMedicalData] = useState(null);
  const [orthodonticData, setOrthodonticData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [moduleData, setModuleData] = useState({});
  const [activeModule, setActiveModule] = useState('overview');
  const [selectedSection, setSelectedSection] = useState('frontal');

  // Состояния загрузки данных модулей
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

  // UI состояния для вкладок
  const [activePhotoTab, setActivePhotoTab] = useState('frontal');
  const [activeCephTab, setActiveCephTab] = useState('frontalTRG');
  const [activeModelTab, setActiveModelTab] = useState('upperJaw');
  const [active3DTab, setActive3DTab] = useState('skull');

  // UI состояния для отображения секций
  const [showPhotometryImages, setShowPhotometryImages] = useState(false);
  const [showCephalometryImages, setShowCephalometryImages] = useState(false);
  const [showBiometryModels, setShowBiometryModels] = useState(false);
  const [showModeling3D, setShowModeling3D] = useState(false);
  const [showCTImages, setShowCTImages] = useState(false);

  // Рефы
  const hasLoadedRef = useRef(false);

  return {
    // Основные состояния
    medicalData,
    setMedicalData,
    orthodonticData,
    setOrthodonticData,
    loading,
    setLoading,
    moduleData,
    setModuleData,
    activeModule,
    setActiveModule,
    selectedSection,
    setSelectedSection,

    // Состояния загрузки
    photoDataLoaded,
    setPhotoDataLoaded,
    biometryDataLoaded,
    setBiometryDataLoaded,
    cephalometryDataLoaded,
    setCephalometryDataLoaded,
    modelingDataLoaded,
    setModelingDataLoaded,

    // Изображения
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

    // UI состояния вкладок
    activePhotoTab,
    setActivePhotoTab,
    activeCephTab,
    setActiveCephTab,
    activeModelTab,
    setActiveModelTab,
    active3DTab,
    setActive3DTab,

    // UI состояния секций
    showPhotometryImages,
    setShowPhotometryImages,
    showCephalometryImages,
    setShowCephalometryImages,
    showBiometryModels,
    setShowBiometryModels,
    showModeling3D,
    setShowModeling3D,
    showCTImages,
    setShowCTImages,

    // Рефы
    hasLoadedRef
  };
};
