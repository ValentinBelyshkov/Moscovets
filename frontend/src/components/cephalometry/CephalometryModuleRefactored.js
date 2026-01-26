import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePatientNavigation } from '../../hooks/usePatientNavigation';
import { useData } from '../../contexts/DataContext';
import { useCephalometryState } from './useCephalometryState';
import { useCephalometryImageHandlers } from './useCephalometryImageHandlers';
import { useCephalometryCanvasHandlers } from './useCephalometryCanvasHandlers';
import { useCephalometryCalculationHandlers } from './useCephalometryCalculationHandlers';
import { useCephalometryExportHandlers } from './useCephalometryExportHandlers';
import { POINT_DEFINITIONS } from './constants';
import CephalometryToolbar from './CephalometryToolbar';
import CephalometrySidebar from './CephalometrySidebar';
import CephalometryCanvas from './CephalometryCanvas';
import CephalometryMeasurements from './CephalometryMeasurements';
import CephalometryPhotoSelection from '../CephalometryPhotoSelection';
import FileLibrary from '../FileLibrary';
import '../CephalometryModule.css';

// Use runtime configuration with fallback to build-time environment variable
const getApiBaseUrl = () => {
  // First try runtime config (from env-config.js)
  if (typeof window !== 'undefined' && window._env_ && window._env_.REACT_APP_URL_API) {
    return window._env_.REACT_APP_URL_API;
  }
  // Fallback to build-time environment variable
  return process.env.REACT_APP_URL_API || 'http://109.196.102.193:5001';
};

const API_BASE_URL = 'http://109.196.102.193:5001/api/v1';

const CephalometryModuleRefactored = () => {
  const { id } = useParams();
  
  // Обрабатываем навигацию с данными пациента
  usePatientNavigation(id);
  
  const { currentPatient } = useData();
  
  const state = useCephalometryState();
  const imageHandlers = useCephalometryImageHandlers(state);
  const canvasHandlers = useCephalometryCanvasHandlers(state);
  const calculationHandlers = useCephalometryCalculationHandlers(state);
  const exportHandlers = useCephalometryExportHandlers(state, calculationHandlers);

  const {
    cephalometryData, setCephalometryData,
    imagesUploaded, setImagesUploaded,
    activeTool, setActiveTool,
    selectedPoint, setSelectedPoint,
    setSelectedPointImage,
    nextPointToPlace,
    canvasRef,
    imageInfoRef,
    loading,
    error,
    selectedPointImage,
    pointsListRef,
    showFileLibrary,
    setShowFileLibrary
  } = state;

  // Update patient name when currentPatient changes
  useEffect(() => {
    if (currentPatient && currentPatient.full_name) {
      setCephalometryData(prev => ({
        ...prev,
        patientName: currentPatient.full_name
      }));
    } else if (currentPatient && currentPatient.name) {
      setCephalometryData(prev => ({
        ...prev,
        patientName: currentPatient.name
      }));
    }
  }, [currentPatient, setCephalometryData]);

  // Auto-load panoramic photos when navigating with patient ID
  useEffect(() => {
    const loadPanoramicPhotos = async () => {
      if (!id || !currentPatient) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/files/patient/${id}/files?file_type=panoramic`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const files = await response.json();
          
          if (files && files.length > 0) {
            // Load first panoramic photo for lateral projection
            const firstFile = files[0];
            const downloadResponse = await fetch(`${API_BASE_URL}/files/download/${firstFile.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (downloadResponse.ok) {
              const blob = await downloadResponse.blob();
              const imageUrl = URL.createObjectURL(blob);
              
              setCephalometryData(prev => ({
                ...prev,
                images: {
                  ...prev.images,
                  lateral: imageUrl
                },
                projectionType: 'lateral'
              }));
              setImagesUploaded(true);
              console.log('Auto-loaded panoramic photo for patient:', id);
            }
          }
        }
      } catch (error) {
        console.error('Error auto-loading panoramic photos:', error);
      }
    };

    loadPanoramicPhotos();
  }, [id, currentPatient, setCephalometryData, setImagesUploaded]);

  // Initialize image info when image changes
  useEffect(() => {
    const currentImage = cephalometryData.images[cephalometryData.projectionType];
    if (currentImage && imagesUploaded) {
      const img = new Image();
      img.onload = () => imageHandlers.initializeImageInfo(img);
      img.src = currentImage;
    }
  }, [cephalometryData.images, cephalometryData.projectionType, imagesUploaded, imageHandlers]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPoint) {
        e.preventDefault();
        canvasHandlers.deleteSelectedPoint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPoint, canvasHandlers]);

  if (loading) return <div className="p-10 text-center">Загрузка...</div>;
  if (error) return <div className="p-10 text-center text-red-600">Ошибка: {error}</div>;

  return (
    <div className="cephalometry-container p-4 max-w-[1600px] mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Модуль цефалометрии</h2>
      
      {!imagesUploaded ? (
        <div>
          <CephalometryPhotoSelection onPhotosSelected={(photos) => {
              // Mapping logic from original
              const newImages = { ...cephalometryData.images };
              Object.entries(photos).forEach(([type, val]) => {
                  if (val instanceof Blob || val instanceof File) {
                      newImages[type] = URL.createObjectURL(val);
                  } else if (typeof val === 'string') {
                      newImages[type] = val;
                  }
              });
              setCephalometryData(prev => ({ ...prev, images: newImages }));
              setImagesUploaded(true);
              setActiveTool('scale');
          }} />
          
          {currentPatient && (
            <div className="mt-4">
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                onClick={() => setShowFileLibrary(true)}
              >
                Выбрать фото из файла пациента
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col">
          <CephalometryToolbar 
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            cephalometryData={cephalometryData}
            setCephalometryData={setCephalometryData}
            imagesUploaded={imagesUploaded}
            onSave={exportHandlers.handleSaveToMedicalCard}
            onExportPDF={exportHandlers.exportReportAsPDF}
            onExportPPTX={exportHandlers.exportReportAsPPTX}
          />
          
          <div className="flex gap-4 items-start h-[700px]">
            <CephalometrySidebar 
              pointDefinitions={POINT_DEFINITIONS}
              cephalometryData={cephalometryData}
              nextPointToPlace={nextPointToPlace}
              selectedPoint={selectedPoint}
              setSelectedPoint={setSelectedPoint}
              setSelectedPointImage={setSelectedPointImage}
              setActiveTool={setActiveTool}
              selectedPointImage={selectedPointImage}
              pointsListRef={pointsListRef}
            />
            
            <CephalometryCanvas 
              state={state}
              handlers={canvasHandlers}
              imageInfoRef={imageInfoRef}
            />
          </div>

          <CephalometryMeasurements 
            measurements={cephalometryData.measurements}
            onCalculate={calculationHandlers.calculateMeasurements}
          />

          {state.reportData && (
            <div className="report-content mt-8 p-6 bg-white border rounded shadow-sm">
              <h4 className="text-xl font-bold mb-4">Результаты цефалометрического анализа</h4>
              <p><strong>Пациент:</strong> {state.reportData.patientName}</p>
              <p><strong>Дата анализа:</strong> {state.reportData.analysisDate}</p>
              <p><strong>Тип проекции:</strong> {state.reportData.projectionType === 'lateral' ? 'Боковая' : 'Прямая'}</p>
              <p className="mt-2 text-lg font-semibold">Заключение: {state.reportData.conclusion}</p>
              <button 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={exportHandlers.exportReportAsPDF}
              >
                Сформировать отчет
              </button>
            </div>
          )}
        </div>
      )}
      
      {showFileLibrary && (
        <FileLibrary
          patientId={id}
          onSelectFile={(file) => {
            const projectionType = file.file_type === 'panoramic' ? 'lateral' : 'frontal';
            imageHandlers.handleLoadImageFromDatabase(file.id, projectionType);
          }}
          onClose={() => setShowFileLibrary(false)}
          fileType="panoramic"
        />
      )}
    </div>
  );
};

export default CephalometryModuleRefactored;
