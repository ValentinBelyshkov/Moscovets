import React, { useEffect, useCallback } from 'react';
import { usePatientNavigation } from '../../hooks/usePatientNavigation';
import { useData } from '../../contexts/DataContext';
import FileLibrary from '../FileLibrary';
import { usePhotometryState } from './usePhotometryState';
import { usePhotometryHandlers } from './usePhotometryHandlers';
import { usePointDefinitions } from './pointDefinitions';
import PatientInfoPanel from './PatientInfoPanel';
import PhotometryToolbar from './PhotometryToolbar';
import PhotometryVisualizationControls from './PhotometryVisualizationControls';
import PhotometryPointsList from './PhotometryPointsList';
import PhotometryMeasurementsPanel from './PhotometryMeasurementsPanel';
import PhotometryReport from './PhotometryReport';
import './PhotometryModule.css';

const PhotometryModuleRefactored = () => {
  // Обрабатываем навигацию с данными пациента
  usePatientNavigation();
  
  // State and handlers
  const state = usePhotometryState();
  const handlers = usePhotometryHandlers(state);
  const pointDefinitions = usePointDefinitions();
  
  const { addMeasurements, currentPatient } = useData();
  const {
    photometryData, setPhotometryData, showPlanes, setShowPlanes, showAngles, setShowAngles,
    activeTool, setActiveTool, selectedPoint, setSelectedPoint, selectedPointImage, setSelectedPointImage,
    nextPointToPlace, loading, error, showFileLibrary, setShowFileLibrary, isMagnifierActive,
    magnifierPosition, magnifierZoom, saveStatus, setSaveStatus, canvasRef, containerRef,
    pointsListRef, imageInfoRef
  } = state;
  
  const {
    handleLoadImageFromDatabase, initializeImageInfo, calculateMeasurements, handleCanvasClick,
    handleCanvasContextMenu, handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseWheelClick,
    handleCanvasMouseUp, handleCanvasMouseLeave, deleteSelectedPoint
  } = handlers;

  // Canvas drawing function
  const drawAllElements = useCallback((ctx, img, canvasWidth, canvasHeight, imageX, imageY, scaledImgWidth, scaledImgHeight, scale) => {
    ctx.drawImage(img, imageX, imageY, scaledImgWidth, scaledImgHeight);
    
    const drawLine = (point1Id, point2Id, color = '#00ff00', lineWidth = 2) => {
      if (photometryData.points[point1Id] && photometryData.points[point2Id]) {
        const point1 = photometryData.points[point1Id];
        const point2 = photometryData.points[point2Id];
        const x1 = imageX + point1.x * scale;
        const y1 = imageY + point1.y * scale;
        const x2 = imageX + point2.x * scale;
        const y2 = imageY + point2.y * scale;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    };

    // Draw projection-specific lines
    if (photometryData.projectionType === 'frontal') {
      if (showPlanes.midline && photometryData.points['n'] && photometryData.points['gn']) {
        drawLine('n', 'gn', '#0000ff', 2);
      }
      if (showPlanes.pupilLine && photometryData.points['n'] && photometryData.points['sn']) {
        drawLine('n', 'sn', '#0000ff', 2);
      }
      if (showPlanes.occlusalLine && photometryData.points['sn'] && photometryData.points['pg']) {
        drawLine('sn', 'pg', '#0000ff', 2);
      }
    } else if (photometryData.projectionType === 'profile') {
      if (showPlanes.eLine && photometryData.points['pro'] && photometryData.points['pog']) {
        drawLine('pro', 'pog', '#0000ff', 2);
      }
    }
    
    // Draw points
    Object.entries(photometryData.points || {}).forEach(([id, point]) => {
      const adjustedX = imageX + point.x * scale;
      const adjustedY = imageY + point.y * scale;
      
      ctx.beginPath();
      ctx.arc(adjustedX, adjustedY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = selectedPoint === id ? '#ff0000' : '#0000ff';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(id, adjustedX + 12, adjustedY - 12);
    });
    
    // Draw scale points
    const drawScalePoints = (points, labels) => {
      Object.entries(points || {}).forEach(([key, point], index) => {
        if (point) {
          const adjustedX = imageX + point.x * scale;
          const adjustedY = imageY + point.y * scale;
          
          ctx.beginPath();
          ctx.arc(adjustedX, adjustedY, 5, 0, 2 * Math.PI);
          ctx.fillStyle = index === 0 ? '#00ff00' : '#ff9900';
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 16px Arial';
          ctx.fillText(labels[index], adjustedX + 15, adjustedY - 15);
        }
      });
    };
    
    if (activeTool === 'scale') {
      if (photometryData.projectionType === 'profile' || photometryData.projectionType === 'profile45') {
        if (photometryData.scaleMode === '10mm') {
          drawScalePoints(photometryData.scalePoints, ['0', '10']);
          if (photometryData.scalePoints.point0 && photometryData.scalePoints.point10) {
            const p0 = photometryData.scalePoints.point0;
            const p10 = photometryData.scalePoints.point10;
            ctx.beginPath();
            ctx.moveTo(imageX + p0.x * scale, imageY + p0.y * scale);
            ctx.lineTo(imageX + p10.x * scale, imageY + p10.y * scale);
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.stroke();
          }
        } else {
          drawScalePoints(photometryData.scalePoints30, ['0', '30']);
          if (photometryData.scalePoints30.point0 && photometryData.scalePoints30.point30) {
            const p0 = photometryData.scalePoints30.point0;
            const p30 = photometryData.scalePoints30.point30;
            ctx.beginPath();
            ctx.moveTo(imageX + p0.x * scale, imageY + p0.y * scale);
            ctx.lineTo(imageX + p30.x * scale, imageY + p30.y * scale);
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.stroke();
          }
        }
      } else {
        drawScalePoints(photometryData.calibrationPoints, ['1', '2']);
        if (photometryData.calibrationPoints.point1 && photometryData.calibrationPoints.point2) {
          const p1 = photometryData.calibrationPoints.point1;
          const p2 = photometryData.calibrationPoints.point2;
          ctx.beginPath();
          ctx.moveTo(imageX + p1.x * scale, imageY + p1.y * scale);
          ctx.lineTo(imageX + p2.x * scale, imageY + p2.y * scale);
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }
    }
  }, [photometryData, selectedPoint, showPlanes, showAngles, activeTool]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !photometryData.images[photometryData.projectionType]) return;
    
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      if (imageInfoRef.current.scale === 1 && imageInfoRef.current.width === 0) {
        initializeImageInfo(img);
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x, y, width, height, scale } = imageInfoRef.current;
      drawAllElements(ctx, img, canvas.width, canvas.height, x, y, width, height, scale);
    };
    
    img.src = photometryData.images[photometryData.projectionType];
  }, [photometryData, drawAllElements, initializeImageInfo]);

  const generateReport = () => {
    const measurements = calculateMeasurements();
    let allNormal = true;
    
    Object.values(measurements).forEach(m => {
      if (m.interpretation && !['нормальный профиль', 'норма', 'среднее лицо'].includes(m.interpretation)) {
        allNormal = false;
      }
    });
    
    const report = {
      patientName: photometryData.patientName,
      analysisDate: photometryData.analysisDate,
      projectionType: photometryData.projectionType,
      measurements,
      allNormal,
      conclusion: allNormal ? 'Попадает в норму' : 'Не попадает в норму',
      timestamp: new Date().toISOString()
    };
    
    setPhotometryData(prev => ({ ...prev, report }));
    return report;
  };

  const exportReportAsPDF = () => {
    alert('Export to PDF not yet implemented');
  };

  const exportReportAsPPTX = () => {
    alert('Export to PPTX not yet implemented');
  };

  const handleSave = async () => {
    try {
      const report = generateReport();
      
      if (Object.keys(photometryData.measurements).length === 0) {
        alert('Сначала выполните измерения!');
        return;
      }

      const photometryDataToSave = {
        patientId: currentPatient?.id || 1,
        patientName: photometryData.patientName,
        analysisDate: photometryData.analysisDate,
        projectionType: photometryData.projectionType,
        measurements: photometryData.measurements,
        points: photometryData.points,
        scale: photometryData.scale,
        images: { uploaded: Object.keys(photometryData.images).filter(key => photometryData.images[key] !== null) },
        report,
        structuredData: createStructuredData(report)
      };

      addMeasurements('photometry', photometryData.measurements, {
        patientName: photometryData.patientName,
        analysisDate: photometryData.analysisDate,
        projectionType: photometryData.projectionType,
        structuredData: photometryDataToSave.structuredData,
        fullReport: report,
        points: photometryData.points,
        scale: photometryData.scale
      });

      localStorage.setItem(`photometry_complete_${currentPatient?.id || 1}_${Date.now()}`, JSON.stringify(photometryDataToSave));
      
      setSaveStatus({ isSaving: false, success: true, message: '✅ Данные сохранены!' });
      setTimeout(() => setSaveStatus({ isSaving: false, success: false, message: '' }), 2000);
      
    } catch (error) {
      setSaveStatus({ isSaving: false, success: false, message: `❌ Ошибка: ${error.message}` });
    }
  };

  const createStructuredData = (report) => {
    const projection = photometryData.projectionType;
    const data = { [projection]: {} };
    
    if (projection === 'frontal') {
      data.frontal = {
        faceWidth: photometryData.measurements.FaceWidth?.value || 0,
        faceHeight: photometryData.measurements.FullHeight?.value || 0,
        facialIndex: photometryData.measurements.FacialIndex?.value || 0,
        headShapeIndex: photometryData.measurements.HeadShapeIndex?.value || 0,
        chinPosition: photometryData.points?.gn ? 'определено' : 'правильное',
        chinFold: 'нормальная',
        lipClosure: 'сомкнуты',
        gumSmile: 'нет симптома',
        pupilLine: 'горизонтальная',
        midline: 'совпадает',
        occlusalLine: 'параллельна зрачковой линии',
        comments: report.conclusion || 'Фотометрический анализ выполнен'
      };
    } else if (projection === 'profile') {
      data.profile = {
        profileType: photometryData.measurements.ProfileAngle?.interpretation || 'прямой',
        nasolabialAngle: photometryData.measurements.NasolabialAngle?.value || 100,
        mentolabialAngle: 130,
        facialConvexity: photometryData.measurements.ProfileAngle?.value || 165,
        chinPosition: photometryData.points?.pg ? 'определено' : 'правильное',
        upperLipPosition: photometryData.points?.ls ? 'определено' : 'правильное',
        lowerLipPosition: 'правильное',
        eLine: { upperLip: -2, lowerLip: 0 },
        comments: report.conclusion || 'Анализ профиля выполнен'
      };
    } else if (projection === 'profile45') {
      data.profile45 = {
        symmetry: 'удовлетворительная',
        headShape: photometryData.measurements?.HeadShapeIndex?.interpretation || 'мезоцефалическая',
        faceShape: photometryData.measurements?.FacialIndex?.interpretation || 'среднее лицо',
        zygomaticProminence: 'нормальная',
        gonialAngle: 'нормальный',
        comments: 'Анализ профиля 45° выполнен'
      };
    }
    
    Object.values(data).forEach(proj => {
      if (proj) proj.photos = ['анализ выполнен'];
    });
    
    return data;
  };

  // Effects
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPoint) {
        e.preventDefault();
        deleteSelectedPoint();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPoint, deleteSelectedPoint]);

  useEffect(() => {
    const handleResize = () => {
      if (photometryData.images[photometryData.projectionType]) {
        const img = new Image();
        img.onload = () => {
          initializeImageInfo(img);
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        };
        img.src = photometryData.images[photometryData.projectionType];
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [photometryData.images, photometryData.projectionType]);

  // Render
  const isScaleSet = photometryData.scale > 1;
  
  return (
    <div className="photometry-module">
      <h2>Модуль фотометрии</h2>
      
      <div className="photometry-main">
        <PatientInfoPanel
          photometryData={photometryData}
          setPhotometryData={setPhotometryData}
          setShowFileLibrary={setShowFileLibrary}
        />
        
        <div className="image-upload">
          <h3>Фотографии</h3>
          <div className="image-container">
            <div className="canvas-container" ref={containerRef}>
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseLeave}
                onContextMenu={handleCanvasContextMenu}
              />
              {/* Magnifier and delete button would go here */}
            </div>
            
            <PhotometryToolbar
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              photometryData={photometryData}
              setPhotometryData={setPhotometryData}
              isScaleSet={isScaleSet}
              magnifierZoom={magnifierZoom}
            />
            
            <PhotometryVisualizationControls
              photometryData={photometryData}
              showPlanes={showPlanes}
              setShowPlanes={setShowPlanes}
              showAngles={showAngles}
              setShowAngles={setShowAngles}
            />
          </div>
        </div>
        
        <PhotometryPointsList
          pointDefinitions={pointDefinitions}
          photometryData={photometryData}
          nextPointToPlace={nextPointToPlace}
          selectedPoint={selectedPoint}
          setSelectedPoint={setSelectedPoint}
          setSelectedPointImage={setSelectedPointImage}
          setActiveTool={setActiveTool}
          selectedPointImage={selectedPointImage}
        />
        
        <PhotometryMeasurementsPanel
          photometryData={photometryData}
          calculateMeasurements={calculateMeasurements}
        />
        
        <PhotometryReport
          reportData={state.reportData}
          generateReport={generateReport}
          exportReportAsPDF={exportReportAsPDF}
          exportReportAsPPTX={exportReportAsPPTX}
          hasMeasurements={Object.keys(photometryData.measurements).length > 0}
        />
        
        <div className="actions">
          <button onClick={handleSave}>
            Сохранить измерения
            {saveStatus.isSaving && <span className="loading-indicator">...</span>}
          </button>
          {saveStatus.success && <span className="save-success">✅ Данные сохранены!</span>}
        </div>
        
        {loading && <div className="loading">Обработка...</div>}
        {error && <div className="error">{error}</div>}
        
        {showFileLibrary && (
          <div className="modal-overlay">
            <div className="modal-content">
              <FileLibrary onSelectFile={handleLoadImageFromDatabase} onClose={() => setShowFileLibrary(false)} />
              <button onClick={() => setShowFileLibrary(false)} style={{ marginTop: '10px' }}>
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotometryModuleRefactored;