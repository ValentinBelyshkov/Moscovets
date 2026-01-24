import React, { useEffect } from 'react';
import { usePatientNavigation } from '../../hooks/usePatientNavigation';
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
import '../CephalometryModule.css';

const CephalometryModuleRefactored = () => {
  // Обрабатываем навигацию с данными пациента
  usePatientNavigation();
  
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
    pointsListRef
  } = state;

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
    </div>
  );
};

export default CephalometryModuleRefactored;
