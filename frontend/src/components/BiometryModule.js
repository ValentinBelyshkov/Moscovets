
import React from 'react';
import BiometryStateProvider from './biometry/BiometryStateProvider';
import BiometryPointsManager from './biometry/BiometryPointsManager';
import BiometryCalculationsEngine from './biometry/BiometryCalculationsEngine';
import { 
  VisualizationControls, 
  Toolbar, 
  PointsList, 
  ResultsDisplay, 
  ModelViewer, 
  PatientInfo, 
  ModelUpload 
} from './biometry/BiometryUIComponents';
import './BiometryModule.css';

const BiometryModule = () => {
  return (
    <BiometryStateProvider>
      {({
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
      }) => {
        // Wrap state management functions that need to be passed to child components
        const handleVisualizationSetting = (setting, value) => {
          setVisualizationSettings(prev => ({
            ...prev,
            [setting]: value
          }));
        };

        const handleTogglePlane = (planeName) => {
          setBiometryPlanes(prev => ({
            ...prev,
            [planeName]: !prev[planeName]
          }));
        };

        const handleToggleAllPlanes = (showAll) => {
          setBiometryPlanes({
            OcclusalPlane: showAll,
            CurveOfSpee: showAll,
            ApicalBasisPlane: showAll,
            ArchPlane: showAll,
            PontPremolarPlane: showAll,
            PontMolarPlane: showAll,
            MidlinePlane: showAll,
            TransversePlane: showAll,
          });
        };

        // Use the Points Manager to get point-related functionality
        const {
          allPoints,
          getNextPointToPlace,
          handleStartPointPlacement,
          handlePointSelect,
          updateNextPointToPlace
        } = BiometryPointsManager({
          biometryData,
          setNextPointToPlace,
          setActiveTool,
          setSelectedPoint,
          setShowPointPlacementGuide,
          selectedPoint,
          nextPointToPlace,
          activeTool,
          handle3DPointAdd,
          handleDeleteSelectedPoint,
          handleMovePoint
        });

        // Use the Calculations Engine to get calculation functionality
        const {
          calculateTonIndex,
          calculateBoltonAnalysis,
          calculatePontAnalysis,
          calculateKorkhausAnalysis,
          calculateSnaginaMethod,
          calculateSlabkovskayaMethod,
          calculateSpeeCurve,
          calculateAllMeasurements,
          checkRequiredPointsForCalculation
        } = BiometryCalculationsEngine({
          biometryData,
          setBiometryData,
          calculateDistance,
          setCalculationsPerformed
        });

        return (
          <div className="biometry-module p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3 border-gray-200">📏 Модуль биометрии зубных рядов</h2>
            
            <PatientInfo 
              biometryData={biometryData} 
              setBiometryData={setBiometryData} 
              activePatient={activePatient} 
            />
            
            <ModelUpload 
              model3DUploaded={model3DUploaded} 
              handleModelUpload={handleModelUpload} 
              fileInputRef={fileInputRef} 
              biometryData={biometryData}
              setModel3DUploaded={setModel3DUploaded}
              setBiometryData={setBiometryData}
              setCalculationsPerformed={setCalculationsPerformed}
            />
            
            {model3DUploaded && (
              <div className="biometry-main flex flex-col lg:flex-row gap-5 mt-5">
                {/* Main Content Area */}
                <div className="main-content-area flex-1 flex flex-col gap-5">
                  {/* 3D Model Viewer */}
                  <ModelViewer 
                    model3DUploaded={model3DUploaded} 
                    biometryData={biometryData} 
                    handle3DPointAdd={handle3DPointAdd} 
                    handlePointSelect={handlePointSelect}
                    biometryPlanes={biometryPlanes} 
                    activeTool={activeTool} 
                    nextPointToPlace={nextPointToPlace} 
                    visualizationSettings={visualizationSettings}
                    showPointPlacementGuide={showPointPlacementGuide}
                    setShowPointPlacementGuide={setShowPointPlacementGuide}
                    threeDViewerRef={threeDViewerRef}
                  />
                  
                  <VisualizationControls 
                    visualizationSettings={visualizationSettings} 
                    handleVisualizationSetting={handleVisualizationSetting} 
                    biometryPlanes={biometryPlanes} 
                    handleTogglePlane={handleTogglePlane} 
                    handleToggleAllPlanes={handleToggleAllPlanes} 
                  />
                  
                  <Toolbar 
                    activeTool={activeTool} 
                    setActiveTool={setActiveTool} 
                    selectedPoint={selectedPoint} 
                    handleMovePoint={handleMovePoint} 
                    handleDeleteSelectedPoint={handleDeleteSelectedPoint} 
                    handleStartPointPlacement={handleStartPointPlacement} 
                    model3DUploaded={model3DUploaded}
                    calculateAllMeasurements={calculateAllMeasurements}
                    calculateTonIndex={calculateTonIndex}
                    calculateBoltonAnalysis={calculateBoltonAnalysis}
                    calculatePontAnalysis={calculatePontAnalysis}
                    calculateKorkhausAnalysis={calculateKorkhausAnalysis}
                    calculateSnaginaMethod={calculateSnaginaMethod}
                    calculateSlabkovskayaMethod={calculateSlabkovskayaMethod}
                    calculateSpeeCurve={calculateSpeeCurve}
                    calculationsPerformed={calculationsPerformed}
                    nextPointToPlace={nextPointToPlace}
                  />
                </div>
                
                <PointsList 
                  allPoints={allPoints} 
                  biometryData={biometryData} 
                  selectedPoint={selectedPoint} 
                  nextPointToPlace={nextPointToPlace} 
                  handlePointSelect={handlePointSelect} 
                  pointsListRef={pointsListRef}
                  setBiometryData={setBiometryData}
                  setSelectedPoint={setSelectedPoint}
                  setNextPointToPlace={setNextPointToPlace}
                />
              </div>
            )}
            
            <ResultsDisplay 
              biometryData={biometryData} 
              calculationsPerformed={calculationsPerformed} 
              saveBiometryToMedicalCard={saveBiometryToMedicalCard} 
              activePatient={activePatient} 
            />
            
            {error && <div className="error-message p-3 bg-red-100 text-red-800 rounded mt-5">
              {error}
            </div>}
          </div>
        );
      }}
    </BiometryStateProvider>
  );
};

export default BiometryModule;