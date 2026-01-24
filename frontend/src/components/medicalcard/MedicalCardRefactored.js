import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';

// Хуки
import { useMedicalCardState } from './useMedicalCardState';
import { useMedicalCardHandlers } from './useMedicalCardHandlers';
import { useMedicalCardDataTransformers } from './useMedicalCardDataTransformers';
import { useMedicalCardDataIntegration } from './useMedicalCardDataIntegration';
import { useMedicalCardExports } from './useMedicalCardExports';

// Константы
import { MODULE_TABS } from './MedicalCardConstants';

// UI компоненты
import MedicalCardLoading from './MedicalCardLoading';
import MedicalCardNoData from './MedicalCardNoData';
import MedicalCardOverview from './MedicalCardOverview';
import MedicalCardPersonalData from './MedicalCardPersonalData';
import MedicalCardAnamnesis from './MedicalCardAnamnesis';
import MedicalCardPhotoAnalysis from './MedicalCardPhotoAnalysis';
import MedicalCardIntraoralAnalysis from './MedicalCardIntraoralAnalysis';
import MedicalCardAnthropometry from './MedicalCardAnthropometry';
import MedicalCardCephalometry from './MedicalCardCephalometry';
import MedicalCardModeling3D from './MedicalCardModeling3D';
import MedicalCardCTAnalysis from './MedicalCardCTAnalysis';
import MedicalCardDiagnoses from './MedicalCardDiagnoses';
import MedicalCardTreatmentPlan from './MedicalCardTreatmentPlan';
import MedicalCardConclusions from './MedicalCardConclusions';

const MedicalCardRefactored = ({ patient, onBack }) => {
  const navigate = useNavigate();

  // Состояние
  const {
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
    photoDataLoaded,
    setPhotoDataLoaded,
    biometryDataLoaded,
    setBiometryDataLoaded,
    cephalometryDataLoaded,
    setCephalometryDataLoaded,
    modelingDataLoaded,
    setModelingDataLoaded,
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
    hasLoadedRef
  } = useMedicalCardState();

  // Обработчики загрузки данных
  const { medicalCardData } = useData();

  const handlers = useMedicalCardHandlers(patient, medicalCardData);
  const transformers = useMedicalCardDataTransformers(patient);
  const { getIntegratedMedicalData } = useMedicalCardDataIntegration(patient);
  const { exportForPresentation, exportFullCard } = useMedicalCardExports(
    orthodonticData,
    medicalData,
    photometryImages,
    cephalometryImages,
    biometryModels,
    modeling3DModels,
    ctImages,
    patient,
    navigate
  );

  const {
    loadPhotometryDataForMedicalCard,
    loadBiometryDataForMedicalCard,
    loadCephalometryDataForMedicalCard,
    loadModelingDataForMedicalCard,
    loadCTDataForMedicalCard
  } = handlers;

  const {
    extractImagesFromModuleData
  } = transformers;

  // Загрузка медицинских данных
  const loadMedicalData = useCallback(async (patientToLoad) => {
    const patientId = patientToLoad?.id || patient?.id || 'demo';
    console.log('Loading medical data for patient:', patientId);

    setLoading(true);

    try {
      // Загружаем данные из всех модулей
      const [photoData, bioData, cephData, modelData, ctData] = await Promise.all([
        loadPhotometryDataForMedicalCard(patientId),
        loadBiometryDataForMedicalCard(patientId),
        loadCephalometryDataForMedicalCard(patientId),
        loadModelingDataForMedicalCard(patientId),
        loadCTDataForMedicalCard(patientId)
      ]);

      // Создаем объект модулей
      const modules = {};
      if (photoData) {
        modules.photometry = { data: photoData, loadedAt: new Date().toISOString() };
      }
      if (bioData) {
        modules.biometry = { data: bioData, loadedAt: new Date().toISOString() };
      }
      if (cephData) {
        modules.cephalometry = { data: cephData, loadedAt: new Date().toISOString() };
      }
      if (modelData) {
        modules.modeling = { data: modelData, loadedAt: new Date().toISOString() };
      }
      if (ctData) {
        modules.ct = { data: ctData, loadedAt: new Date().toISOString() };
      }

      setModuleData(modules);

      // Получаем интегрированные данные
      const integratedData = getIntegratedMedicalData(patientId, modules, {
        photometry: photoData,
        biometry: bioData,
        cepalometry: cephData,
        modeling: modelData,
        ct: ctData
      });

      // Обновляем изображения
      if (photoData) {
        const loadedImages = extractImagesFromModuleData('photometry', photoData);
        setPhotometryImages(loadedImages);
        setPhotoDataLoaded(true);
      }

      if (bioData) {
        const loadedModels = extractImagesFromModuleData('biometry', bioData);
        setBiometryModels(loadedModels);
        setBiometryDataLoaded(true);
      }

      if (cephData) {
        const loadedCephImages = extractImagesFromModuleData('cephalometry', cephData);
        setCephalometryImages(loadedCephImages);
        setCephalometryDataLoaded(true);
      }

      if (modelData) {
        const loaded3DModels = extractImagesFromModuleData('modeling', modelData);
        setModeling3DModels(loaded3DModels);
        setModelingDataLoaded(true);
      }

      if (ctData) {
        const loadedCTImages = extractImagesFromModuleData('ct', ctData);
        setCTImages(loadedCTImages);
      }

      setOrthodonticData(integratedData);
      setMedicalData(integratedData);
    } catch (error) {
      console.error('Error loading medical data:', error);
    } finally {
      setLoading(false);
    }
  }, [
    patient,
    setLoading,
    setModuleData,
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
    loadPhotometryDataForMedicalCard,
    loadBiometryDataForMedicalCard,
    loadCephalometryDataForMedicalCard,
    loadModelingDataForMedicalCard,
    loadCTDataForMedicalCard,
    getIntegratedMedicalData,
    extractImagesFromModuleData
  ]);

  // Загрузка данных при монтировании
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadMedicalData(patient);
    }
  }, [patient, loadMedicalData]);

  // Рендеринг
  if (loading) {
    return (
      <MedicalCardLoading
        patient={patient}
        photoDataLoaded={photoDataLoaded}
        biometryDataLoaded={biometryDataLoaded}
        cephalometryDataLoaded={cephalometryDataLoaded}
        modelingDataLoaded={modelingDataLoaded}
      />
    );
  }

  if (!medicalData || !orthodonticData) {
    return (
      <MedicalCardNoData patient={patient} onLoadData={loadMedicalData} />
    );
  }

  return (
    <div className="medical-card">
      {/* Заголовок */}
      <MedicalCardHeader orthodonticData={orthodonticData} moduleData={moduleData} />

      {/* Вкладки разделов */}
      <MedicalCardTabs
        tabs={MODULE_TABS}
        activeTab={activeModule}
        onTabChange={setActiveModule}
      />

      {/* Контент */}
      <div className="medical-card-content">
        {activeModule === 'overview' && <MedicalCardOverview orthodonticData={orthodonticData} moduleData={moduleData} patient={patient} />}
        {activeModule === 'personal' && <MedicalCardPersonalData orthodonticData={orthodonticData} />}
        {activeModule === 'anamnesis' && <MedicalCardAnamnesis orthodonticData={orthodonticData} />}
        {activeModule === 'photo' && <MedicalCardPhotoAnalysis orthodonticData={orthodonticData} />}
        {activeModule === 'intraoral' && <MedicalCardIntraoralAnalysis orthodonticData={orthodonticData} />}
        {activeModule === 'anthropometry' && <MedicalCardAnthropometry orthodonticData={orthodonticData} />}
        {activeModule === 'cephalometry' && <MedicalCardCephalometry orthodonticData={orthodonticData} />}
        {activeModule === 'modeling3d' && <MedicalCardModeling3D orthodonticData={orthodonticData} modeling3DModels={modeling3DModels} />}
        {activeModule === 'ct' && <MedicalCardCTAnalysis orthodonticData={orthodonticData} ctImages={ctImages} />}
        {activeModule === 'diagnosis' && <MedicalCardDiagnoses orthodonticData={orthodonticData} />}
        {activeModule === 'treatment' && <MedicalCardTreatmentPlan orthodonticData={orthodonticData} />}
        {activeModule === 'conclusions' && <MedicalCardConclusions orthodonticData={orthodonticData} />}

        {/* История болезни */}
        {medicalData.medicalHistory && medicalData.medicalHistory.length > 0 && (
          <MedicalHistory medicalHistory={medicalData.medicalHistory} />
        )}
      </div>

      {/* Кнопки действий */}
      <MedicalCardActions
        onExportPresentation={exportForPresentation}
        onExportFull={() => exportFullCard({ moduleData })}
        onBack={onBack}
      />
    </div>
  );
};

// Вспомогательные компоненты
const MedicalCardHeader = ({ orthodonticData, moduleData }) => (
  <div className="medical-card-header mb-6">
    <h2 className="text-2xl font-bold text-gray-800">📋 Медицинская карта пациента</h2>
    <div className="patient-status flex flex-wrap gap-2 mt-2">
      <span className="status-badge completed bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Интеграция данных</span>
      <span className="status-badge modules bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">{Object.keys(moduleData).length} модулей</span>
      <span className="status-badge structured bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">Структурировано по образцу</span>
      {moduleData.cephalometry && <span className="status-badge cephalometry bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-sm">✓ Цефалометрия</span>}
      {moduleData.photometry && <span className="status-badge photometry bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm">✓ Фотометрия</span>}
      {moduleData.biometry && <span className="status-badge biometry bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">✓ Биометрия</span>}
      {moduleData.modeling && <span className="status-badge modeling bg-violet-100 text-violet-800 px-3 py-1 rounded-full text-sm">✓ 3D Моделирование</span>}
      {moduleData.ct && <span className="status-badge ct bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm">✓ КТ анализ</span>}
    </div>
  </div>
);

const MedicalCardTabs = ({ tabs, activeTab, onTabChange }) => (
  <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-blue-500">
    <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Разделы медицинской карты</h3>
    <div className="flex flex-wrap gap-2">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`px-4 py-2 rounded-lg transition duration-300 flex items-center gap-2 ${
            activeTab === tab.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  </div>
);

const MedicalHistory = ({ medicalHistory }) => (
  <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-gray-500">
    <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
      <span>📝</span> История болезни
    </h3>

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
          {medicalHistory.map((record, index) => (
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
  </div>
);

const MedicalCardActions = ({ onExportPresentation, onExportFull, onBack }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
    <button
      className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white px-4 py-3 rounded-lg transition duration-300 flex items-center justify-center gap-2"
      onClick={onExportPresentation}
    >
      <span>🚀</span> Сформировать презентацию (по образцу)
    </button>

    <button
      className="bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white px-4 py-3 rounded-lg transition duration-300 flex items-center justify-center gap-2"
      onClick={onExportFull}
    >
      <span>💾</span> Экспорт полной карты (JSON)
    </button>

    {onBack && (
      <button
        className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-3 rounded-lg transition duration-300 flex items-center justify-center gap-2"
        onClick={onBack}
      >
        <span>←</span> Вернуться
      </button>
    )}
  </div>
);

export default MedicalCardRefactored;
