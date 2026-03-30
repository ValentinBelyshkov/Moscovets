import React, { useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import patientService from '../../services/patientService';
import { useData } from '../../contexts/DataContext';
import PhotoUpload from '../PhotoUpload';

// Хуки
import { usePatientCardState } from './usePatientCardState';
import { usePatientCardHandlers } from './usePatientCardHandlers';
import { usePatientCardDataTransformers } from './usePatientCardDataTransformers';
import { usePatientCardDataIntegration } from './usePatientCardDataIntegration';

// Компоненты
import PatientMedicalForm from './PatientMedicalForm';

// Константы
import { MODULE_TABS } from './PatientCardConstants';

const PatientCardRefactored = ({ patient: patientProp, onBack }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Состояние
  const {
    patient,
    setPatient,
    loading,
    setLoading,
    error,
    setError,
    activeTab,
    setActiveTab,
    selectedHistoryDate,
    setSelectedHistoryDate,
    moduleData,
    setModuleData,
    modules,
    setModules,
    medicalHistory,
    setMedicalHistory,
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
    photoDataLoaded,
    setPhotoDataLoaded,
    biometryDataLoaded,
    setBiometryDataLoaded,
    cephalometryDataLoaded,
    setCephalometryDataLoaded,
    modelingDataLoaded,
    setModelingDataLoaded,
    medicalData,
    setMedicalData,
    orthodonticData,
    setOrthodonticData,
    isEditingMedicalCard,
    setIsEditingMedicalCard,
    medicalCardForm,
    setMedicalCardForm,
    showPhotoUpload,
    setShowPhotoUpload,
    hasLoadedRef
  } = usePatientCardState(patientProp);
  
  // Ref для хранения URL изображений для очистки
  const imageUrlsRef = useRef(new Set());

  // Обработчики и трансформеры
  const { medicalCardData } = useData();
  const handlers = usePatientCardHandlers(patient, medicalCardData);
  const transformers = usePatientCardDataTransformers();
  const { getIntegratedMedicalData } = usePatientCardDataIntegration(patient);

  const {
    loadPhotometryData,
    loadBiometryData,
    loadCephalometryData,
    loadModelingData,
    loadCTData,
    loadMedicalHistory
  } = handlers;

  const {
    extractImagesFromModuleData,
    transformModuleDataForDisplay,
    groupHistoryByDate,
    sortDates
  } = transformers;

  // Обработка изменений в форме медицинской карты
  const handleMedicalCardChange = useCallback((e, fieldPath) => {
    if (fieldPath) {
      // Обработка вложенных полей через fieldPath (например, 'registration.city')
      const keys = fieldPath.split('.');
      const { value } = e.target;
      
      if (keys.length === 2) {
        setMedicalCardForm(prev => ({
          ...prev,
          [keys[0]]: {
            ...prev[keys[0]],
            [keys[1]]: value
          }
        }));
      }
    } else {
      // Обработка обычных полей через name
      const { name, value } = e.target;
      const keys = name.split('.');
      
      if (keys.length === 2) {
        setMedicalCardForm(prev => ({
          ...prev,
          [keys[0]]: {
            ...prev[keys[0]],
            [keys[1]]: value
          }
        }));
      } else {
        setMedicalCardForm(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  }, [setMedicalCardForm]);

  // Сохранение медицинской карты
  const handleMedicalCardSubmit = useCallback(async (formData) => {
    console.log('Saving medical card data:', formData);

    try {
      // Формируем дату рождения из полей формы
      let birthDate = patient?.birth_date;
      if (formData.birthDay && formData.birthMonth && formData.birthYear) {
        const day = formData.birthDay.padStart(2, '0');
        const month = formData.birthMonth.padStart(2, '0');
        birthDate = `${formData.birthYear}-${month}-${day}`;
      }

      // Маппинг значений формы в значения API
      const maritalStatusMap = {
        'married': 'registered_marriage',
        'unregistered': 'unregistered_marriage',
        'single': 'not_married',
        'unknown': 'unknown'
      };

      const educationMap = {
        'higher': 'higher',
        'incomplete_higher': 'incomplete_higher',
        'secondary': 'secondary',
        'basic': 'primary',
        'none': 'none',
        'unknown': 'unknown'
      };

      const chinShiftMap = {
        'Вправо': 'right',
        'Влево': 'left',
        '': 'none'
      };

      const lipPositionMap = {
        'protruding': 'protrudes',
        'retracted': 'recedes',
        'normal': 'correct'
      };

      // Преобразуем данные формы в формат API
      const patientData = {
        full_name: formData.fullName || patient?.full_name,
        birth_date: birthDate,
        gender: formData.gender || patient?.gender,
        contact_info: formData.registration?.phone || patient?.contact_info,
        complaints: patient?.complaints,

        // Регистрационные данные
        registration_republic: formData.registration?.republic || undefined,
        registration_district: formData.registration?.region || undefined,
        registration_city: formData.registration?.city || undefined,
        registration_settlement: formData.registration?.settlement || undefined,
        registration_street: formData.registration?.street || undefined,
        registration_house: formData.registration?.house || undefined,
        registration_apartment: formData.registration?.apartment || undefined,
        registration_phone: formData.registration?.phone || undefined,

        // Социально-демографические данные
        locality_type: formData.locality || undefined,
        marital_status: formData.maritalStatus ? maritalStatusMap[formData.maritalStatus] || undefined : undefined,
        education_level: formData.education ? educationMap[formData.education] || undefined : undefined,

        // Кефалометрические данные
        cephalometry_zy_zy: formData.faceFront?.width ? parseFloat(formData.faceFront.width) : undefined,
        cephalometry_n_me: formData.faceFront?.heightNasal ? parseFloat(formData.faceFront.heightNasal) : undefined,
        cephalometry_n_sn: formData.faceFront?.heightSubnasal ? parseFloat(formData.faceFront.heightSubnasal) : undefined,
        face_symmetric: formData.faceFront?.symmetry === 'Да',
        chin_shift: formData.faceFront?.chinPosition ? chinShiftMap[formData.faceFront.chinPosition] || undefined : undefined,
        mental_fold_pronounced: formData.faceFront?.nasolabialFold === 'Да',
        lips_closed: formData.faceFront?.lipClosure === 'Да',
        gummy_smile: formData.faceFront?.gumSmile === 'Да',
        profile_type: formData.faceProfile?.type || undefined,
        upper_lip_position: formData.faceProfile?.upperLip ? lipPositionMap[formData.faceProfile.upperLip] || undefined : undefined,
      };

      // Убираем undefined значения
      Object.keys(patientData).forEach(key => {
        if (patientData[key] === undefined) {
          delete patientData[key];
        }
      });

      console.log('Sending patient data to API:', patientData);

      // Отправляем данные на сервер
      const updatedPatient = await patientService.updatePatient(patient.id, patientData);
      console.log('Patient updated successfully:', updatedPatient);

      // Обновляем состояние пациента
      setPatient(updatedPatient);

      // Обновляем orthodonticData для немедленного отображения
      setOrthodonticData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          photoAnalysis: {
            ...prev.photoAnalysis,
            profile: {
              ...prev.photoAnalysis?.profile,
              upperLipPosition: formData.faceProfile?.upperLip === 'normal' ? 'правильное' :
                                formData.faceProfile?.upperLip === 'protruding' ? 'выступает' : 'западает',
              lowerLipPosition: formData.faceProfile?.lowerLip === 'normal' ? 'правильное' :
                                formData.faceProfile?.lowerLip === 'protruding' ? 'выступает' : 'западает',
              chinPosition: formData.faceProfile?.chin === 'normal' ? 'правильное' :
                            formData.faceProfile?.chin === 'protruding' ? 'выступает' : 'западает',
            }
          }
        };
      });

      setIsEditingMedicalCard(false);
      alert('Данные медицинской карты успешно сохранены!');
    } catch (error) {
      console.error('Error saving medical card:', error);
      alert('Ошибка при сохранении данных: ' + (error.message || 'Неизвестная ошибка'));
    }
  }, [medicalCardForm, patient, setPatient, setOrthodonticData, setIsEditingMedicalCard]);

  // Обновляем форму при загрузке данных
  useEffect(() => {
    if (patient) {
      // Populate form with patient data
      const birthDate = patient?.birth_date || patient?.birthDate;
      let birthDay = '', birthMonth = '', birthYear = '';

      if (birthDate) {
        const date = new Date(birthDate);
        birthDay = date.getDate().toString();
        birthMonth = (date.getMonth() + 1).toString();
        birthYear = date.getFullYear().toString();
      }

      // Маппинг значений из API в значения формы
      const maritalStatusReverseMap = {
        'registered_marriage': 'married',
        'unregistered_marriage': 'unregistered',
        'not_married': 'single',
        'unknown': 'unknown'
      };

      const educationReverseMap = {
        'higher': 'higher',
        'incomplete_higher': 'incomplete_higher',
        'secondary': 'secondary',
        'primary': 'basic',
        'none': 'none',
        'unknown': 'unknown'
      };

      const chinShiftReverseMap = {
        'right': 'Вправо',
        'left': 'Влево',
        'none': ''
      };

      const lipPositionReverseMap = {
        'protrudes': 'protruding',
        'recedes': 'retracted',
        'correct': 'normal'
      };

      setMedicalCardForm(prev => ({
        ...prev,
        fullName: patient?.full_name || patient?.fullName || '',
        gender: patient?.gender || 'female',
        birthDay,
        birthMonth,
        birthYear,
        registration: {
          republic: patient?.registration_republic || '',
          region: patient?.registration_district || '',
          city: patient?.registration_city || '',
          settlement: patient?.registration_settlement || '',
          street: patient?.registration_street || '',
          house: patient?.registration_house || '',
          apartment: patient?.registration_apartment || '',
          phone: patient?.registration_phone || patient?.contact_info || patient?.contactInfo || ''
        },
        locality: patient?.locality_type || 'urban',
        maritalStatus: patient?.marital_status ? maritalStatusReverseMap[patient.marital_status] || '' : '',
        education: patient?.education_level ? educationReverseMap[patient.education_level] || '' : '',
        faceFront: {
          width: patient?.cephalometry_zy_zy ? patient.cephalometry_zy_zy.toString() : '',
          heightNasal: patient?.cephalometry_n_me ? patient.cephalometry_n_me.toString() : '',
          heightSubnasal: patient?.cephalometry_n_sn ? patient.cephalometry_n_sn.toString() : '',
          symmetry: patient?.face_symmetric ? 'Да' : 'Нет',
          chinPosition: patient?.chin_shift ? chinShiftReverseMap[patient.chin_shift] || '' : '',
          nasolabialFold: patient?.mental_fold_pronounced ? 'Да' : 'Нет',
          lipClosure: patient?.lips_closed ? 'Да' : 'Нет',
          gumSmile: patient?.gummy_smile ? 'Да' : 'Нет'
        },
        faceProfile: {
          type: patient?.profile_type || 'straight',
          upperLip: patient?.upper_lip_position ? lipPositionReverseMap[patient.upper_lip_position] || 'normal' : 'normal',
          lowerLip: 'normal',
          chin: 'normal'
        }
      }));
    }
  }, [patient, setMedicalCardForm]);

  // Загрузка данных пациента
  useEffect(() => {
    const fetchPatient = async () => {
      if (id && !patientProp) {
        try {
          setLoading(true);
          setError(null);
          const patientData = await patientService.getPatientById(id);
          setPatient(patientData);
        } catch (error) {
          console.error('Error fetching patient:', error);
          setError('Не удалось загрузить данные пациента');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPatient();
  }, [id, patientProp, setLoading, setPatient, setError]);

  // Загрузка медицинских данных
  const loadMedicalData = useCallback(async (patientToLoad) => {
    const patientId = patientToLoad?.id || patient?.id || 'demo';
    console.log('Loading medical data for patient:', patientId);

    setLoading(true);

    try {
      // Загружаем данные из всех модулей
      const [photoData, bioData, cephData, modelData, ctData] = await Promise.all([
        loadPhotometryData(patientId),
        loadBiometryData(patientId),
        loadCephalometryData(patientId),
        loadModelingData(patientId),
        loadCTData(patientId)
      ]);

      // Создаем объект модулей
      const modulesMap = {};
      if (photoData) {
        modulesMap.photometry = { data: photoData, loadedAt: new Date().toISOString() };
      }
      if (bioData) {
        modulesMap.biometry = { data: bioData, loadedAt: new Date().toISOString() };
      }
      if (cephData) {
        modulesMap.cephalometry = { data: cephData, loadedAt: new Date().toISOString() };
      }
      if (modelData) {
        modulesMap.modeling = { data: modelData, loadedAt: new Date().toISOString() };
      }
      if (ctData) {
        modulesMap.ct = { data: ctData, loadedAt: new Date().toISOString() };
      }

      setModuleData(modulesMap);

      // Преобразуем данные модулей для отображения
      const modulesForDisplay = MODULE_TABS
        .filter(tab => tab.id !== 'overview' && tab.id !== 'history')
        .map(tab => transformModuleDataForDisplay(tab.id, modulesMap[tab.id]?.data));

      setModules(modulesForDisplay);

      // Получаем интегрированные данные
      const integratedData = getIntegratedMedicalData(patientId, modulesMap, {
        photometry: photoData,
        biometry: bioData,
        cephalometry: cephData,
        modeling: modelData,
        ct: ctData
      });

      // Обновляем изображения
      if (photoData) {
        const loadedImages = extractImagesFromModuleData('photometry', photoData);
        if (loadedImages) {
          setPhotometryImages(prev => ({ ...prev, ...loadedImages }));
        }
        setPhotoDataLoaded(true);
      }

      if (bioData) {
        const loadedModels = extractImagesFromModuleData('biometry', bioData);
        if (loadedModels) {
          setBiometryModels(prev => ({ ...prev, ...loadedModels }));
        }
        setBiometryDataLoaded(true);
      }

      if (cephData) {
        const loadedCephImages = extractImagesFromModuleData('cephalometry', cephData);
        if (loadedCephImages) {
          setCephalometryImages(prev => ({ ...prev, ...loadedCephImages }));
        }
        setCephalometryDataLoaded(true);
      }

      if (modelData) {
        const loaded3DModels = extractImagesFromModuleData('modeling', modelData);
        if (loaded3DModels) {
          setModeling3DModels(prev => ({ ...prev, ...loaded3DModels }));
        }
        setModelingDataLoaded(true);
      }

      if (ctData) {
        const loadedCTImages = extractImagesFromModuleData('ct', ctData);
        if (loadedCTImages) {
          setCTImages(prev => ({ ...prev, ...loadedCTImages }));
        }
      }

      setOrthodonticData(integratedData);
      setMedicalData(integratedData);

      // Загружаем историю болезни
      const history = await loadMedicalHistory(patientId);
      setMedicalHistory(history);
    } catch (error) {
      console.error('Error loading medical data:', error);
      setError('Не удалось загрузить медицинские данные');
    } finally {
      setLoading(false);
    }
  }, [
    patient,
    setLoading,
    setModuleData,
    setModules,
    setOrthodonticData,
    setMedicalData,
    setPhotometryImages,
    setBiometryModels,
    setCephalometryImages,
    setModeling3DModels,
    setCTImages,
    setPhotoDataLoaded,
    setBiometryDataLoaded,
    setCephalometryDataLoaded,
    setModelingDataLoaded,
    setMedicalHistory,
    loadPhotometryData,
    loadBiometryData,
    loadCephalometryData,
    loadModelingData,
    loadCTData,
    loadMedicalHistory,
    getIntegratedMedicalData,
    extractImagesFromModuleData,
    transformModuleDataForDisplay,
    setError
  ]);

  // Функция для очистки URL изображений
  const cleanupImageUrls = useCallback(() => {
    imageUrlsRef.current.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn('Error revoking object URL:', e);
      }
    });
    imageUrlsRef.current.clear();
  }, []);

  // Загрузка данных при монтировании
  useEffect(() => {
    if (!hasLoadedRef.current && patient) {
      hasLoadedRef.current = true;
      loadMedicalData(patient);
    }
    
    // Cleanup function
    return () => {
      cleanupImageUrls();
    };
  }, [patient, loadMedicalData, hasLoadedRef, cleanupImageUrls]);

  // Очистка URL изображений при изменении фотометрических изображений
  useEffect(() => {
    // Сохраняем предыдущие URL для очистки
    const prevUrls = [...imageUrlsRef.current];
    
    // Добавляем новые URL в ref
    imageUrlsRef.current.clear();
    if (photometryImages.frontal && typeof photometryImages.frontal === 'string' && photometryImages.frontal.startsWith('blob:')) {
      imageUrlsRef.current.add(photometryImages.frontal);
    }
    if (photometryImages.profile && typeof photometryImages.profile === 'string' && photometryImages.profile.startsWith('blob:')) {
      imageUrlsRef.current.add(photometryImages.profile);
    }
    if (photometryImages.profile45 && typeof photometryImages.profile45 === 'string' && photometryImages.profile45.startsWith('blob:')) {
      imageUrlsRef.current.add(photometryImages.profile45);
    }
    if (photometryImages.intraoral && typeof photometryImages.intraoral === 'string' && photometryImages.intraoral.startsWith('blob:')) {
      imageUrlsRef.current.add(photometryImages.intraoral);
    }

    // Очищаем старые URL
    prevUrls.forEach(url => {
      if (!imageUrlsRef.current.has(url)) {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.warn('Error revoking object URL:', e);
        }
      }
    });
  }, [photometryImages]);

  // Функции для отображения
  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Не указано';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Группируем историю по датам
  const historyByDate = groupHistoryByDate(medicalHistory);

  // Сортируем даты в обратном порядке
  const sortedDates = sortDates(Object.keys(historyByDate));

  // Получаем данные для конкретной даты
  const getHistoryForDate = (date) => {
    return historyByDate[date] || [];
  };

  // Переход к модулю
  const navigateToModule = (moduleId) => {
    const routeMap = {
      photometry: '/photometry',
      cephalometry: '/cephalometry',
      biometry: '/biometry',
      modeling: '/modeling',
      ct: '/ct'
    };
    
    if (routeMap[moduleId]) {
      const route = routeMap[moduleId];
      const patientId = patient?.id;
      
      // Include patient ID in the route if available
      const finalRoute = patientId ? `${route}/${patientId}` : route;
      
      navigate(finalRoute, { 
        state: { 
          patient: patient, 
          fromPatientCard: true 
        } 
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-700">Загрузка данных пациента...</div>
      </div>
    );
  }

  // If no patient data after loading, show error
  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-700">{error || 'Пациент не найден'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Верхняя панель */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Медицинская карта пациента</h1>
                <p className="text-sm text-gray-500">Полная история диагностики и лечения</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Активный пациент
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Основная карточка пациента */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="flex flex-col lg:flex-row">
            {/* Левая часть - информация о пациенте */}
            <div className="flex-1 p-6 lg:p-8">
              <div className="flex items-start gap-6">
                {/* Аватар/фото по умолчанию */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>

                {/* Информация о пациенте */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {patient?.full_name || patient?.fullName || 'Иванова Мария Петровна'}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Дата рождения</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(patient?.birth_date || patient?.birthDate)} ({calculateAge(patient?.birth_date || patient?.birthDate || '1995-03-15')} лет)
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Пол</p>
                      <p className="font-medium text-gray-900">
                        {(() => {
                          const gender = patient?.gender;
                          if (!gender) return 'Женский';
                          if (gender === 'male' || gender === 'Male') return 'Мужской';
                          if (gender === 'female' || gender === 'Female') return 'Женский';
                          return gender;
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Телефон</p>
                      <p className="font-medium text-gray-900">{patient?.contact_info || patient?.contactInfo || '+7 (999) 123-45-67'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Дата обращения</p>
                      <p className="font-medium text-gray-900">{formatDate(patient?.created_at || patient?.lastVisit || new Date().toISOString())}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Лечащий врач</p>
                      <p className="font-medium text-gray-900">Иванов А.С.</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ID пациента</p>
                      <p className="font-medium text-gray-900">#{patient?.id || 1}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Жалобы и примечания */}
              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <h3 className="text-sm font-semibold text-amber-800 mb-2">📝 Жалобы пациента</h3>
                <p className="text-gray-700">{patient?.complaints || 'Неровные зубы, неправильный прикус, эстетический дефект'}</p>
              </div>

              {/* Статистика */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-blue-600">{modules.filter(m => m.hasData).length}</p>
                  <p className="text-sm text-blue-700">Исследований</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-green-600">{medicalHistory.length}</p>
                  <p className="text-sm text-green-700">Записей</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-purple-600">{sortedDates.length}</p>
                  <p className="text-sm text-purple-700">Визитов</p>
                </div>
              </div>
            </div>

            {/* Правая часть - фото пациента */}
            <div className="lg:w-80 p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 border-l border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Фотографии
              </h3>
              
              {/* Основное фото */}
              <div className="mb-4">
                {photometryImages.frontal ? (
                  <div className="aspect-square rounded-xl bg-gray-200 overflow-hidden shadow-inner flex items-center justify-center">
                    {typeof photometryImages.frontal === 'string' && (
                      <img
                        src={photometryImages.frontal}
                        alt="Фото анфас"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24"><rect width="24" height="24" fill="%23d1d5db"/><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="%239ca3af" stroke-width="1"/></svg>`;
                        }}
                        onLoad={(e) => {
                          // Ensure the image is loaded properly
                          e.target.style.display = 'block';
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="aspect-square rounded-xl bg-gray-200 overflow-hidden shadow-inner flex items-center justify-center">
                    <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2 text-center">Фото анфас</p>
              </div>
              
              <button
                onClick={() => setShowPhotoUpload(true)}
                className="w-full mt-4 py-2 px-4 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Добавить фото
              </button>
              
              {/* Форма загрузки фото */}
              {showPhotoUpload && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">Загрузка фотографий пациента</h3>
                        <button
                          onClick={() => setShowPhotoUpload(false)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      <PhotoUpload
                        patientId={patient?.id}
                        onUploadSuccess={() => {
                          // Optionally reload patient data after successful upload
                          console.log('Photo upload successful');
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

{/* Кнопки действий */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <button
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            onClick={() => navigateToModule('photometry')}
          >
            <span>📷</span> Фотометрия
          </button>
          <button
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            onClick={() => navigateToModule('cephalometry')}
          >
            <span>🦴</span> Цефалометрия
          </button>
          <button
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            onClick={() => navigateToModule('ct')}
          >
            <span>📐</span> Просмотр КТ
          </button>
          <button
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            onClick={() => navigateToModule('biometry')}
          >
            <span>📐</span> Биометрия
          </button>
          <button
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            onClick={() => navigateToModule('modeling')}
          >
            <span>🖥️</span> 3D Модели
          </button>
          <button
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            onClick={() => navigate('/presentation', { state: { patient, fromPatientCard: true } })}
          >
            <span>📊</span> Создать презентацию
          </button>
        </div>
        <br></br>


        {/* Вкладки модулей */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Навигация по вкладкам */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex min-w-max px-4">
              {MODULE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.id === 'history' && (
                    <span className="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                      {medicalHistory.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Содержимое вкладок */}
          <div className="p-6">
            {/* Медицинская карта */}
            {activeTab === 'overview' && (
              <div>
                {/* Медицинская форма пациента */}
                <PatientMedicalForm
                  formData={medicalCardForm}
                  onChange={handleMedicalCardChange}
                  onSubmit={handleMedicalCardSubmit}
                />
              </div>
            )}

            {/* Модули с детальными результатами */}
            {['photometry', 'cephalometry', 'biometry'].includes(activeTab) && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {modules.find(m => m.id === activeTab)?.name}
                  </h3>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    Последнее: {modules.find(m => m.id === activeTab)?.date}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Изображение */}
                  <div className="bg-gray-100 rounded-xl overflow-hidden">
                    {activeTab === 'photometry' && photometryImages.frontal ? (
                      typeof photometryImages.frontal === 'string' && (
                        <img
                          src={photometryImages.frontal}
                          alt="Фотометрия"
                          className="w-full h-full aspect-video object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 24 24"><rect width="24" height="24" fill="%23d1d5db"/><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="%239ca3af" stroke-width="1"/></svg>`;
                          }}
                        />
                      )
                    ) : (
                      <div className="aspect-video flex items-center justify-center">
                        <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Результаты */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h4 className="font-semibold text-gray-900 mb-4">Результаты анализа</h4>
                    <div className="space-y-3">
                      {Object.entries(
                        modules.find(m => m.id === activeTab)?.measurements || {}
                      ).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                          <span className="text-gray-600">{key}</span>
                          <span className="font-semibold text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Заключение:</strong> {modules.find(m => m.id === activeTab)?.lastResult}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3D Модели */}
            {activeTab === 'modeling' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">3D Моделирование</h3>
                <div className="bg-gray-100 rounded-xl overflow-hidden">
                  <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="text-center">
                      <svg className="w-24 h-24 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                      </svg>
                      <p className="text-gray-400">3D модель будет отображаться здесь</p>
                      <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Загрузить модель
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* КТ */}
            {activeTab === 'ct' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">КТ Анализ</h3>
                <div className="bg-gray-100 rounded-xl overflow-hidden">
                  <div className="aspect-video flex items-center justify-center bg-gray-800">
                    <div className="text-center">
                      <svg className="w-24 h-24 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                      <p className="text-gray-400">Снимки КТ будут отображаться здесь</p>
                      <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Загрузить снимки
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* История болезни */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">История болезни</h3>
                
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Список дат */}
                  <div className="lg:w-1/3">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      По датам
                    </h4>
                    <div className="space-y-2">
                      {sortedDates.map((date) => (
                        <button
                          key={date}
                          onClick={() => setSelectedHistoryDate(date)}
                          className={`w-full p-4 rounded-xl text-left transition-all ${
                            selectedHistoryDate === date
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <p className="font-semibold">{formatDate(date)}</p>
                          <p className={`text-sm ${selectedHistoryDate === date ? 'text-blue-200' : 'text-gray-500'}`}>
                            {getHistoryForDate(date).length} записей
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Записи за выбранную дату */}
                  <div className="lg:w-2/3">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      {selectedHistoryDate ? formatDate(selectedHistoryDate) : 'Выберите дату'}
                    </h4>
                    
                    {selectedHistoryDate ? (
                      <div className="space-y-4">
                        {getHistoryForDate(selectedHistoryDate).map((record, index) => (
                          <div
                            key={record.id}
                            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  record.type === 'Фотометрия' ? 'bg-blue-100 text-blue-700' :
                                  record.type === 'Цефалометрия' ? 'bg-emerald-100 text-emerald-700' :
                                  record.type === 'Биометрия' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {record.type}
                                </span>
                                <span className="text-sm text-gray-500">{record.doctor}</span>
                              </div>
                              <span className="text-sm text-gray-400">#{index + 1}</span>
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs text-gray-500 uppercase">Диагноз</p>
                                <p className="text-gray-900">{record.diagnosis}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase">Лечение/назначения</p>
                                <p className="text-gray-900">{record.treatment}</p>
                              </div>
                              {record.notes && (
                                <div>
                                  <p className="text-xs text-gray-500 uppercase">Примечания</p>
                                  <p className="text-gray-600 text-sm">{record.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-8 text-center">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500">Выберите дату для просмотра записей</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        

        
        {/* Кнопка скачать в самом конце */}
        <div className="mt-8 flex justify-start">
          <button
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            onClick={() => {
              const formData = medicalCardForm;
              const maritalStatusText = {
                'married': 'зарегистрированный брак',
                'unregistered': 'незарегистрированный брак',
                'single': 'не состоит',
                'unknown': 'неизвестно'
              };
              const educationText = {
                'higher': 'высшее',
                'incomplete_higher': 'неполное высшее',
                'secondary': 'среднее (полное)',
                'basic': 'начальное',
                'none': 'не имеет',
                'unknown': 'неизвестно'
              };
              const localityText = {
                'urban': 'городская',
                'rural': 'сельская'
              };
              const profileTypeText = {
                'convex': 'Выпуклый',
                'concave': 'Вогнутый',
                'straight': 'Прямой'
              };
              const lipPositionText = {
                'protruding': 'Выступает',
                'retracted': 'Западает',
                'normal': 'Правильное'
              };

              const cardContent = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Медицинская карта - ${patient?.full_name || patient?.fullName || 'Пациент'}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
    h1 { color: #1e3a5f; border-bottom: 3px solid #1e3a5f; padding-bottom: 10px; }
    h2 { color: #2c5282; margin-top: 30px; margin-bottom: 15px; font-size: 18px; }
    h3 { color: #4a5568; margin-top: 20px; margin-bottom: 10px; font-size: 16px; }
    .section { margin-bottom: 25px; padding: 20px; background: #f7fafc; border-radius: 8px; border-left: 4px solid #3182ce; }
    .subsection { margin-bottom: 15px; padding: 15px; background: #ffffff; border-radius: 6px; border: 1px solid #e2e8f0; }
    .label { color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
    .value { font-weight: bold; color: #2d3748; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf2f7; }
    .row:last-child { border-bottom: none; }
    .field { flex: 1; }
    .field + .field { margin-left: 20px; }
    .checkbox-item { display: flex; align-items: center; padding: 5px 0; }
    .checkbox-marker { margin-right: 10px; font-weight: bold; }
    .yes { color: #38a169; }
    .no { color: #e53e3e; }
  </style>
</head>
<body>
  <h1>Медицинская карта пациента</h1>

  <div class="section">
    <h2>1. Личные данные</h2>
    <div class="row"><span class="label">ФИО:</span><span class="value">${patient?.full_name || patient?.fullName || formData.fullName || 'Не указано'}</span></div>
    <div class="row"><span class="label">Пол:</span><span class="value">${formData.gender === 'male' ? 'Мужской' : 'Женский'}</span></div>
    <div class="row"><span class="label">Дата рождения:</span><span class="value">${formData.birthDay ? `${formData.birthDay}.${formData.birthMonth}.${formData.birthYear}` : formatDate(patient?.birth_date || patient?.birthDate)}</span></div>
  </div>

  <div class="section">
    <h2>2. Место регистрации</h2>
    <div class="row"><span class="label">Республика, край, область:</span><span class="value">${formData.registration?.republic || 'Не указано'}</span></div>
    <div class="row"><span class="label">Район:</span><span class="value">${formData.registration?.region || 'Не указано'}</span></div>
    <div class="row"><span class="label">Город:</span><span class="value">${formData.registration?.city || 'Не указано'}</span></div>
    <div class="row"><span class="label">Населенный пункт:</span><span class="value">${formData.registration?.settlement || 'Не указано'}</span></div>
    <div class="row"><span class="label">Улица:</span><span class="value">${formData.registration?.street || 'Не указано'}</span></div>
    <div class="row">
      <span class="label">Дом:</span><span class="value">${formData.registration?.house || 'Не указано'}</span>
      <span class="label">Квартира:</span><span class="value">${formData.registration?.apartment || 'Не указано'}</span>
    </div>
    <div class="row"><span class="label">Телефон:</span><span class="value">${formData.registration?.phone || patient?.contact_info || patient?.contactInfo || 'Не указано'}</span></div>
  </div>

  <div class="section">
    <h2>3. Социальная информация</h2>
    <div class="row"><span class="label">Местность:</span><span class="value">${localityText[formData.locality] || 'Не указано'}</span></div>
    <div class="row"><span class="label">Семейное положение:</span><span class="value">${maritalStatusText[formData.maritalStatus] || 'Не указано'}</span></div>
    <div class="row"><span class="label">Образование:</span><span class="value">${educationText[formData.education] || 'Не указано'}</span></div>
  </div>

  <div class="section">
    <h2>4. Осмотр лица. Кефалометрия</h2>
    <h3>19.1. Лицо анфас</h3>
    <div class="subsection">
      <div class="row"><span class="label">Ширина лица (zy-zy):</span><span class="value">${formData.faceFront?.width || 'Не указано'} мм</span></div>
      <div class="row"><span class="label">Высота лица (n-me):</span><span class="value">${formData.faceFront?.heightNasal || 'Не указано'} мм</span></div>
      <div class="row"><span class="label">Высота нижней трети (n-sn):</span><span class="value">${formData.faceFront?.heightSubnasal || 'Не указано'} мм</span></div>
      <div class="checkbox-item"><span class="checkbox-marker">${formData.faceFront?.symmetry === 'Да' ? '✓' : '✗'}</span><span>Симметричное лицо</span></div>
      <div class="checkbox-item"><span class="checkbox-marker">${formData.faceFront?.chinPosition === 'Вправо' ? '✓' : '✗'}</span><span>Подбородок смещен вправо</span></div>
      <div class="checkbox-item"><span class="checkbox-marker">${formData.faceFront?.nasolabialFold === 'Да' ? '✓' : '✗'}</span><span>Выраженность надподбородочной складки</span></div>
      <div class="checkbox-item"><span class="checkbox-marker">${formData.faceFront?.lipClosure === 'Да' ? '✓' : '✗'}</span><span>Губы сомкнуты</span></div>
      <div class="checkbox-item"><span class="checkbox-marker">${formData.faceFront?.gumSmile === 'Да' ? '✓' : '✗'}</span><span>Симптом «десневой улыбки»</span></div>
    </div>

    <h3>19.2. Лицо в профиль</h3>
    <div class="subsection">
      <div class="row"><span class="label">Тип профиля:</span><span class="value">${profileTypeText[formData.faceProfile?.type] || 'Не указано'}</span></div>
      <div class="row"><span class="label">Верхняя губа:</span><span class="value">${lipPositionText[formData.faceProfile?.upperLip] || 'Не указано'}</span></div>
      <div class="row"><span class="label">Нижняя губа:</span><span class="value">${lipPositionText[formData.faceProfile?.lowerLip] || 'Не указано'}</span></div>
      <div class="row"><span class="label">Подбородок:</span><span class="value">${lipPositionText[formData.faceProfile?.chin] || 'Не указано'}</span></div>
    </div>
  </div>

  <div class="section">
    <h2>5. Жалобы пациента</h2>
    <p class="value">${patient?.complaints || 'Не указаны'}</p>
  </div>

  <div class="section">
    <h2>6. Дополнительная информация</h2>
    <div class="row"><span class="label">ID пациента:</span><span class="value">#${patient?.id || 'Не указано'}</span></div>
    <div class="row"><span class="label">Дата обращения:</span><span class="value">${formatDate(patient?.created_at || patient?.lastVisit)}</span></div>
    <div class="row"><span class="label">Лечащий врач:</span><span class="value">Иванов А.С.</span></div>
  </div>

  <p style="margin-top: 40px; color: #718096; font-size: 12px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
    Дата формирования: ${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU')}
  </p>
</body>
</html>`;
              const blob = new Blob([cardContent], { type: 'text/html;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `Медицинская_карта_${(patient?.full_name || patient?.fullName || 'Пациент').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Скачать
          </button>
        </div>

      </div>
    </div>
  );
};

export default PatientCardRefactored;
