import React, { useState, useRef } from 'react';
// Используем локальный сервис вместо серверного
import localMedicalRecordService from '../services/localMedicalRecordService';
import VTKViewer from './VTKViewer';
import ArchiveUpload from './ArchiveUpload';
import './ArchiveUpload.css';
const CTModule = () => {
  // State for CT data and UI controls
  const [ctData, setCtData] = useState({
    patientName: 'Иванов Иван Иванович',
    analysisDate: new Date().toISOString().split('T')[0],
    ctScan: null,
    selectedFile: null,
    uploadedFiles: [], // Store all uploaded files
    availablePlanes: {}, // Store available planes from uploaded files
    selectedPlane: null, // Track which plane is currently selected for viewing
    filePlaneAssignments: {}, // Store user-defined plane assignments for each file
    showPlaneAssignment: false, // Show plane assignment interface
    measurements: {
      // TMJ measurements (ВНЧС)
      rightClosedPositionX: 0,
      rightClosedPositionY: 0,
      rightOpenPositionX: 0,
      rightOpenPositionY: 0,
      leftClosedPositionX: 0,
      leftClosedPositionY: 0,
      leftOpenPositionX: 0,
      leftOpenPositionY: 0,
      
      // Tooth measurements (Срезы зубов)
      toothWidthUpper: 0,
      toothWidthLower: 0,
      boneThicknessUpper: 0,
      boneThicknessLower: 0,
      
      // Pen analysis (Pen-анализ)
      molarInclinationUpper: 0,
      molarInclinationLower: 0,
      
      // Basal width measurements (Ширина апикального базиса)
      basalWidthUpper: 0,
      basalWidthLower: 0,
      basalWidthDeficit: 0,
      
      // Airway measurements (Воздухоносные пути)
      tonguePosition: 0,
      airwayVolume: 0,
      
      // Additional measurements
      maxillaryWidth: 45.0,
      mandibularWidth: 42.0,
      anteriorMaxillaryHeight: 25.0,
      posteriorMaxillaryHeight: 30.0,
      anteriorMandibularHeight: 22.0,
      posteriorMandibularHeight: 28.0,
      maxillarySinusVolume: 15.0,
      nasalCavityVolume: 20.0,
      airwayVolumeTotal: 25.0,
      condyleHeight: 18.0,
      condyleWidth: 15.0,
      ramusWidth: 22.0,
      coronoidHeight: 35.0,
      gonialAngle: 125.0,
      mandibularLength: 100.0,
      bigonialWidth: 95.0,
      bicondylarWidth: 110.0,
      upperFacialHeight: 70.0,
      middleFacialHeight: 60.0,
      lowerFacialHeight: 50.0,
      facialIndex: 150.0,
      mandibularPlaneAngle: 32.0,
      yaxis: 60.0,
      sellaNasion: 88.0,
      nasionA: 85.0,
      nasionB: 78.5,
      aPointBPoint: 88.0,
    }
  });
  // Viewer states
  const [windowLevel, setWindowLevel] = useState({ window: 400, level: 40 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState('ruler'); // ruler, protractor, annotate
  
  // Analysis tools state
  const [measurements, setMeasurements] = useState([]); // eslint-disable-line no-unused-vars
  const [annotations, setAnnotations] = useState({
    sagittal: [],
    coronal: [],
    axial: []
  }); // Store annotations per plane
  
  // Loading states
  const [error, setError] = useState(null);
  
  // Refs for image manipulation
  const containerRef = useRef(null);
  // Handle archive upload success
  const handleArchiveUploadSuccess = (result) => {
    console.log('Archive upload successful:', result);
    
    // Process uploaded files from archive
    const uploadedFiles = result.uploadedFiles;
    
    if (uploadedFiles.length === 0) {
      setError('Из архива не было загружено ни одного файла');
      return;
    }
    
    // Initialize empty plane assignments - user will assign planes manually
    const filePlaneAssignments = {};
    uploadedFiles.forEach(file => {
      filePlaneAssignments[file.id] = null; // No plane assigned initially
    });
    
    setCtData(prev => ({
      ...prev,
      ctScan: `${result.totalExtracted} DICOM файлов извлечено из архива "${result.archiveName}"`,
      selectedFile: uploadedFiles[0], // Select first file by default
      uploadedFiles: uploadedFiles,
      availablePlanes: {}, // Start with empty available planes
      selectedPlane: null,
      filePlaneAssignments: filePlaneAssignments,
      showPlaneAssignment: true // Show plane assignment interface
    }));
    
    alert(`Успешно загружено ${result.totalExtracted} DICOM файлов из архива! Теперь вы можете назначить плоскости для каждого файла.`);
  };
  // Handle archive upload error
  const handleArchiveUploadError = (errorMessage) => {
    setError(errorMessage);
    console.error('Archive upload error:', errorMessage);
  };
  // Handle measurement change
  const handleMeasurementChange = (measurement, value) => {
    setCtData(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [measurement]: parseFloat(value) || 0
      }
    }));
  };
  // Handle plane assignment for a file
  const handlePlaneAssignment = (fileId, plane) => {
    setCtData(prev => {
      const newFilePlaneAssignments = { ...prev.filePlaneAssignments };
      const newAvailablePlanes = { ...prev.availablePlanes };
      
      // Remove file from previous plane assignment if exists
      const previousPlane = newFilePlaneAssignments[fileId];
      if (previousPlane && newAvailablePlanes[previousPlane]) {
        delete newAvailablePlanes[previousPlane];
      }
      
      // Assign file to new plane
      if (plane) {
        newFilePlaneAssignments[fileId] = plane;
        const file = prev.uploadedFiles.find(f => f.id === fileId);
        if (file) {
          newAvailablePlanes[plane] = file;
        }
      } else {
        newFilePlaneAssignments[fileId] = null;
      }
      
      return {
        ...prev,
        filePlaneAssignments: newFilePlaneAssignments,
        availablePlanes: newAvailablePlanes
      };
    });
  };
  // Toggle plane assignment interface
  const togglePlaneAssignment = () => {
    setCtData(prev => ({
      ...prev,
      showPlaneAssignment: !prev.showPlaneAssignment
    }));
  };
  // Get file preview URL
  const getFilePreviewUrl = (file) => {
    return file.data_url || '';
  };
  // Handle save
  const handleSave = async () => {
    try {
      // Prepare data for saving to medical record
      const ctDataToSave = {
        patient_id: 1, // This would come from the current patient context in a real app
        record_type: 'ct',
        data: JSON.stringify({
          patientName: ctData.patientName,
          analysisDate: ctData.analysisDate,
          measurements: ctData.measurements,
          fileCount: ctData.uploadedFiles.length
        }),
        notes: `CT analysis with ${ctData.uploadedFiles.length} files`
      };
      
      // Save to medical records database using local service
      const savedRecord = await localMedicalRecordService.createMedicalRecord(ctDataToSave); // eslint-disable-line no-unused-vars
      
      alert('Данные КТ успешно сохранены!');
    } catch (error) {
      console.error('Error saving CT data:', error);
      alert('Ошибка при сохранении данных КТ: ' + error.message);
    }
  };
  // Handle tool selection
  const handleToolSelect = (tool) => {
    setActiveTool(tool);
  };
  
  // Handle plane selection
  const handlePlaneSelect = (plane) => {
    console.log('Switching to plane:', plane);
    console.log('Available planes:', ctData.availablePlanes);
    if (ctData.availablePlanes && ctData.availablePlanes[plane]) {
      const selectedFile = ctData.availablePlanes[plane];
      console.log('Selected file for plane:', plane, selectedFile);
      console.log('Selected file data_url:', selectedFile?.data_url);
      console.log('Is selected file data_url valid?', !!selectedFile?.data_url);
      
      // Validate that the selected file has a valid data_url
      if (!selectedFile?.data_url) {
        setError(`Не удалось загрузить данные для плоскости ${plane}: отсутствует URL файла`);
        return;
      }
      
      setCtData(prev => ({
        ...prev,
        selectedFile: selectedFile,
        selectedPlane: plane
      }));
    } else {
      console.log('Plane not available:', plane);
      console.log('Available planes:', ctData.availablePlanes);
      setError(`Плоскость ${plane} недоступна`);
    }
  };
  // Handle measurement completion from VTKViewer
  const handleMeasurementComplete = (measurement) => {
    setMeasurements(prev => [...prev, measurement]);
    
    // Convert pixel distance to centimeters if pixel spacing is available
    if (measurement.tool === 'ruler') {
      if (measurement.pixelSpacing && measurement.pixelSpacing.row && measurement.pixelSpacing.column) {
        // Use average of row and column spacing for isotropic approximation
        const avgPixelSpacing = (measurement.pixelSpacing.row + measurement.pixelSpacing.column) / 2;
        const distanceInMm = measurement.distance * avgPixelSpacing;
        const distanceInCm = distanceInMm / 10;
        
        alert(`Расстояние: ${distanceInCm.toFixed(2)} см`);
      } else {
        alert(`Расстояние: ${measurement.distance.toFixed(2)} пикселей`);
      }
    } else if (measurement.tool === 'protractor') {
      // For protractor, show angle
      alert(`Угол: ${measurement.angle.toFixed(2)} градусов`);
    }
  };
  // Handle annotation addition from VTKViewer
  const handleAnnotationAdd = (annotation) => {
    setAnnotations(prev => ({
      ...prev,
      [ctData.selectedPlane]: [...prev[ctData.selectedPlane], annotation]
    }));
    alert(`Добавлена аннотация в точке (${annotation.x.toFixed(2)}, ${annotation.y.toFixed(2)}) на плоскости ${ctData.selectedPlane}`);
  };
  // Handle window/level adjustment
  const handleWindowLevelChange = (type, value) => {
    setWindowLevel(prev => ({
      ...prev,
      [type]: parseInt(value)
    }));
  };
  // Handle zoom
  const handleZoom = (direction) => {
    if (direction === 'in') {
      setZoomLevel(prev => Math.min(prev * 1.2, 5));
    } else {
      setZoomLevel(prev => Math.max(prev / 1.2, 0.2));
    }
  };
  // Handle pan
  const handlePan = (direction) => {
    const step = 10;
    switch (direction) {
      case 'up':
        setPanOffset(prev => ({ ...prev, y: prev.y - step }));
        break;
      case 'down':
        setPanOffset(prev => ({ ...prev, y: prev.y + step }));
        break;
      case 'left':
        setPanOffset(prev => ({ ...prev, x: prev.x - step }));
        break;
      case 'right':
        setPanOffset(prev => ({ ...prev, x: prev.x + step }));
        break;
      default:
        break;
    }
  };
  // Reset view
  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };
  // Render viewer with image display
  const renderViewer = () => {
    // Use the data_url property from the file object
    const imageUrl = ctData.selectedFile && ctData.selectedFile.data_url ? ctData.selectedFile.data_url : null;
    console.log('Rendering viewer with imageUrl:', imageUrl);
    console.log('Selected file:', ctData.selectedFile);
    console.log('Selected plane:', ctData.selectedPlane);
    console.log('Is imageUrl valid?', !!imageUrl);
    if (ctData.selectedFile) {
      console.log('Selected file data_url:', ctData.selectedFile.data_url);
      console.log('Selected file data_url type:', typeof ctData.selectedFile.data_url);
      console.log('Selected file data_url length:', ctData.selectedFile.data_url ? ctData.selectedFile.data_url.length : 'N/A');
    }
    
    // If we have an error, show it instead of the viewer
    if (error) {
      return (
        <div className="ct-viewer-container">
          <div className="viewer-controls">
            {/* Controls remain the same */}
            <div className="tool-selector">
              <h4>Инструменты анализа</h4>
              <button
                className={activeTool === 'ruler' ? 'active' : ''}
                onClick={() => handleToolSelect('ruler')}
              >
                Линейка (измерение расстояний)
              </button>
              <button
                className={activeTool === 'protractor' ? 'active' : ''}
                onClick={() => handleToolSelect('protractor')}
              >
                Транспортир (измерение углов)
              </button>
              <button
                className={activeTool === 'annotate' ? 'active' : ''}
                onClick={() => handleToolSelect('annotate')}
              >
                Аннотации (визуальные метки)
              </button>
            </div>
            
            {/* Plane selection */}
            {ctData.availablePlanes && Object.keys(ctData.availablePlanes).length > 0 && (
              <div className="plane-selector">
                <h4>Выбор плоскости</h4>
                <div className="plane-buttons">
                  {ctData.availablePlanes.sagittal && (
                    <button
                      className={ctData.selectedPlane === 'sagittal' ? 'active' : ''}
                      onClick={() => handlePlaneSelect('sagittal')}
                    >
                      Сагиттальная
                    </button>
                  )}
                  {ctData.availablePlanes.coronal && (
                    <button
                      className={ctData.selectedPlane === 'coronal' ? 'active' : ''}
                      onClick={() => handlePlaneSelect('coronal')}
                    >
                      Корональная
                    </button>
                  )}
                  {ctData.availablePlanes.axial && (
                    <button
                      className={ctData.selectedPlane === 'axial' ? 'active' : ''}
                      onClick={() => handlePlaneSelect('axial')}
                    >
                      Аксиальная
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="viewer-display">
            <div className="error-message" style={{ margin: '20px', padding: '15px' }}>
              Ошибка: {error}
              <button
                onClick={() => setError(null)}
                style={{ marginLeft: '10px', padding: '5px 10px' }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="ct-viewer-container">
        <div className="viewer-controls">
          <div className="tool-selector">
            <h4>Инструменты анализа</h4>
            <button
              className={activeTool === 'ruler' ? 'active' : ''}
              onClick={() => handleToolSelect('ruler')}
            >
              Линейка (измерение расстояний)
            </button>
            <button
              className={activeTool === 'protractor' ? 'active' : ''}
              onClick={() => handleToolSelect('protractor')}
            >
              Транспортир (измерение углов)
            </button>
            <button
              className={activeTool === 'annotate' ? 'active' : ''}
              onClick={() => handleToolSelect('annotate')}
            >
              Аннотации (визуальные метки)
            </button>
          </div>
          
          {/* Plane selection */}
          {ctData.availablePlanes && Object.keys(ctData.availablePlanes).length > 0 && (
            <div className="plane-selector">
              <h4>Выбор плоскости</h4>
              <div className="plane-buttons">
                {ctData.availablePlanes.sagittal && (
                  <button
                    className={ctData.selectedPlane === 'sagittal' ? 'active' : ''}
                    onClick={() => handlePlaneSelect('sagittal')}
                  >
                    Сагиттальная
                  </button>
                )}
                {ctData.availablePlanes.coronal && (
                  <button
                    className={ctData.selectedPlane === 'coronal' ? 'active' : ''}
                    onClick={() => handlePlaneSelect('coronal')}
                  >
                    Корональная
                  </button>
                )}
                {ctData.availablePlanes.axial && (
                  <button
                    className={ctData.selectedPlane === 'axial' ? 'active' : ''}
                    onClick={() => handlePlaneSelect('axial')}
                  >
                    Аксиальная
                  </button>
                )}
              </div>
            </div>
          )}
          
          
          <div className="window-level-controls">
            <h4>Настройки окна/уровня (Window/Level)</h4>
            <div>
              <label>Окно (ширина): {windowLevel.window}</label>
              <input
                type="range"
                min="1"
                max="2000"
                value={windowLevel.window}
                onChange={(e) => handleWindowLevelChange('window', e.target.value)}
              />
            </div>
            <div>
              <label>Уровень (центр): {windowLevel.level}</label>
              <input
                type="range"
                min="-1000"
                max="1000"
                value={windowLevel.level}
                onChange={(e) => handleWindowLevelChange('level', e.target.value)}
              />
            </div>
          </div>
          
          <div className="zoom-controls">
            <h4>Масштаб</h4>
            <button onClick={() => handleZoom('in')}>+</button>
            <span>{Math.round(zoomLevel * 100)}%</span>
            <button onClick={() => handleZoom('out')}>-</button>
            <button onClick={resetView}>Сброс</button>
          </div>
          
          <div className="pan-controls">
            <h4>Перемещение</h4>
            <button onClick={() => handlePan('up')}>↑</button>
            <div>
              <button onClick={() => handlePan('left')}>←</button>
              <button onClick={() => handlePan('right')}>→</button>
            </div>
            <button onClick={() => handlePan('down')}>↓</button>
          </div>
        </div>
        
        <div className="viewer-display">
          {ctData.ctScan ? (
            <VTKViewer
              key={ctData.selectedPlane || 'default'}
              dataUrl={imageUrl}
              viewerMode={ctData.selectedPlane || 'axial'}
              activeTool={activeTool}
              windowLevel={windowLevel}
              zoomLevel={zoomLevel}
              panOffset={panOffset}
              onMeasurementComplete={handleMeasurementComplete}
              onAnnotationAdd={handleAnnotationAdd}
              annotations={annotations[ctData.selectedPlane] || []}
            />
          ) : (
            <div
              className="viewer-canvas"
              ref={containerRef}
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                cursor: activeTool === 'ruler' ? 'crosshair' :
                        activeTool === 'protractor' ? 'crosshair' :
                        activeTool === 'annotate' ? 'pointer' : 'default',
                width: '100%',
                height: '500px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#000'
              }}
            >
              {/* Placeholder for CT image */}
              <div className="image-placeholder">
                <div style={{
                  color: 'white',
                  textAlign: 'center',
                  width: '100%'
                }}>
                  <p>Выберите папку с DICOM-файлами для просмотра компьютерной томограммы</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  // Render plane assignment interface
  const renderPlaneAssignment = () => {
    if (!ctData.showPlaneAssignment || ctData.uploadedFiles.length === 0) {
      return null;
    }
    const planes = [
      { value: 'sagittal', label: 'Сагиттальная' },
      { value: 'coronal', label: 'Корональная' },
      { value: 'axial', label: 'Аксиальная' }
    ];
    return (
      <div className="plane-assignment-container" style={{
        border: '2px solid #007bff',
        borderRadius: '8px',
        padding: '20px',
        margin: '20px 0',
        backgroundColor: '#f8f9fa'
      }}>
        <h3>Назначение плоскостей для файлов</h3>
        <p>Пожалуйста, назначьте соответствующую плоскость для каждого загруженного файла:</p>
        
        <div className="files-assignment-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '15px',
          margin: '20px 0'
        }}>
          {ctData.uploadedFiles.map(file => (
            <div key={file.id} className="file-assignment-item" style={{
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '15px',
              backgroundColor: 'white'
            }}>
              <div className="file-info" style={{ marginBottom: '10px' }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>{file.name}</h4>
                <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                  Размер: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              
              <div className="plane-selector" style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                  Плоскость:
                </label>
                <select
                  value={ctData.filePlaneAssignments[file.id] || ''}
                  onChange={(e) => handlePlaneAssignment(file.id, e.target.value || null)}
                  style={{
                    width: '100%',
                    padding: '5px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                >
                  <option value="">Не назначена</option>
                  {planes.map(plane => (
                    <option key={plane.value} value={plane.value}>
                      {plane.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {file.data_url && (
                <div className="file-preview" style={{ marginTop: '10px' }}>
                  <img
                    src={getFilePreviewUrl(file)}
                    alt={`Preview of ${file.name}`}
                    style={{
                      width: '100%',
                      maxHeight: '150px',
                      objectFit: 'contain',
                      border: '1px solid #eee',
                      borderRadius: '4px'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{
                    display: 'none',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    Предпросмотр недоступен
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="assignment-actions" style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={togglePlaneAssignment}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              marginRight: '10px'
            }}
          >
            Завершить назначение
          </button>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Назначено плоскостей: {Object.values(ctData.filePlaneAssignments).filter(p => p !== null).length} из {ctData.uploadedFiles.length}
          </div>
        </div>
      </div>
    );
  };
  // Render measurements table
  const renderMeasurementsTable = () => {
    const measurementGroups = {
      "ВНЧС (височно-нижнечелюстной сустав) - положение суставной головки в суставной ямке": [
        "rightClosedPositionX", "rightClosedPositionY",
        "rightOpenPositionX", "rightOpenPositionY",
        "leftClosedPositionX", "leftClosedPositionY",
        "leftOpenPositionX", "leftOpenPositionY"
      ],
      "Срезы зубов верхней и нижней челюстей в сагиттальной проекции": [
        "toothWidthUpper", "toothWidthLower",
        "boneThicknessUpper", "boneThicknessLower"
      ],
      "Pen-анализ - наклоны первых моляров": [
        "molarInclinationUpper", "molarInclinationLower"
      ],
      "Ширина апикального базиса верхней и нижней челюстей": [
        "basalWidthUpper", "basalWidthLower", "basalWidthDeficit"
      ],
      "Воздухоносные пути - аксиальные срезы, положение языка, измерение объема": [
        "tonguePosition", "airwayVolume"
      ]
    };
    return (
      <div className="measurements-section">
        <h3>Измерения</h3>
        
        {Object.entries(measurementGroups || {}).map(([groupName, groupMeasurements]) => (
          <div key={groupName} className="measurement-group">
            <h4>{groupName}</h4>
            <table>
              <thead>
                <tr>
                  <th>Измерение</th>
                  <th>Значение</th>
                  <th>Единицы</th>
                  <th>Нормальный диапазон</th>
                </tr>
              </thead>
              <tbody>
                {groupMeasurements.map(key => {
                  const displayName = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase());
                  
                  return (
                    <tr key={key}>
                      <td>{displayName}</td>
                      <td>
                        <input
                          type="number"
                          step="0.1"
                          value={ctData.measurements[key]}
                          onChange={(e) => handleMeasurementChange(key, e.target.value)}
                        />
                      </td>
                      <td>мм</td>
                      <td>TODO</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="measurement-description">
              Используйте инструменты анализа (линейка, транспортир) для выполнения измерений на изображении
            </p>
          </div>
        ))}
        
        <div className="measurement-group">
          <h4>Дополнительные измерения</h4>
          <table>
            <thead>
              <tr>
                <th>Измерение</th>
                <th>Значение</th>
                <th>Единицы</th>
                <th>Нормальный диапазон</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(ctData.measurements || {})
                .filter(([key]) => !Object.values(measurementGroups || {}).flat().includes(key))
                .map(([key, value]) => {
                  const displayName = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase());
                  
                  return (
                    <tr key={key}>
                      <td>{displayName}</td>
                      <td>
                        <input
                          type="number"
                          step="0.1"
                          value={value}
                          onChange={(e) => handleMeasurementChange(key, e.target.value)}
                        />
                      </td>
                      <td>мм</td>
                      <td>TODO</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          <p className="measurement-description">
            Используйте инструменты анализа (линейка, транспортир) для выполнения измерений на изображении
          </p>
        </div>
      </div>
    );
  };
  return (
    <div className="ct-module">
      <h2>Модуль КТ</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="patient-info">
        <h3>Информация о пациенте</h3>
        <p><strong>Имя:</strong> {ctData.patientName}</p>
        <p><strong>Дата анализа:</strong> {ctData.analysisDate}</p>
      </div>
      
      <div className="ct-upload">
        <h3>КТ скан</h3>
        {ctData.ctScan ? (
          <div>
            <p>Загруженный КТ скан: {ctData.ctScan}</p>
            <div style={{ marginTop: '10px' }}>
              <button
                onClick={() => setCtData(prev => ({ ...prev, ctScan: null, selectedFile: null, uploadedFiles: [] }))}
                style={{ marginRight: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}
              >
                Удалить КТ скан
              </button>
              {ctData.uploadedFiles.length > 0 && (
                <button
                  onClick={togglePlaneAssignment}
                  style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}
                >
                  {ctData.showPlaneAssignment ? 'Скрыть' : 'Показать'} назначение плоскостей
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <ArchiveUpload
              onUploadSuccess={handleArchiveUploadSuccess}
              onUploadError={handleArchiveUploadError}
            />
          </div>
        )}
      </div>
      
      {ctData.ctScan && (
        <>
          {renderPlaneAssignment()}
          
          {renderViewer()}
          
          {renderMeasurementsTable()}
          
          <div className="report-section">
            <h3>Отчет</h3>
            <div className="report-content">
              <p>Здесь будет сгенерирован отчет по результатам анализа КТ.</p>
              <button onClick={() => alert('Отчет будет сгенерирован и сохранен в системе.')}>
                Сгенерировать отчет
              </button>
            </div>
          </div>
        </>
      )}
      
      <div className="actions">
        <button onClick={handleSave} disabled={!ctData.ctScan}>
          Сохранить измерения
        </button>
      </div>
    </div>
  );
};
export default CTModule;