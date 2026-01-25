import React from 'react';
import VTKViewer from '../VTKViewer';
import ArchiveUpload from '../ArchiveUpload';
import CTViewerControls from './CTViewerControls';
import CTMeasurementsPanel from './CTMeasurementsPanel';
import CTScanDateSelector from './CTScanDateSelector';
import { useCTState } from './useCTState';
import { useCTHandlers } from './useCTHandlers';
import '../ArchiveUpload.css';

const CTModuleRefactored = () => {
  const state = useCTState();
  const handlers = useCTHandlers(state);

  const {
    ctData,
    setCtData,
    windowLevel,
    setWindowLevel,
    zoomLevel,
    setZoomLevel,
    panOffset,
    setPanOffset,
    activeTool,
    error,
    containerRef
  } = state;

  const {
    handleArchiveUploadSuccess,
    handleArchiveUploadError,
    handleMeasurementChange,
    handlePlaneAssignment,
    togglePlaneAssignment,
    getFilePreviewUrl,
    handleSave,
    handleToolSelect,
    handlePlaneSelect,
    handleMeasurementComplete,
    handleAnnotationAdd,
    handleScanDateSelect
  } = handlers;

  const handleWindowLevelChange = (type, value) => {
    setWindowLevel(prev => ({
      ...prev,
      [type]: parseInt(value)
    }));
  };

  const handleZoom = (direction) => {
    if (direction === 'in') {
      setZoomLevel(prev => Math.min(prev * 1.2, 5));
    } else {
      setZoomLevel(prev => Math.max(prev / 1.2, 0.2));
    }
  };

  const handlePan = (direction) => {
    const step = 10;
    const movements = {
      up: { x: 0, y: -step },
      down: { x: 0, y: step },
      left: { x: -step, y: 0 },
      right: { x: step, y: 0 }
    };
    if (movements[direction]) {
      setPanOffset(prev => ({
        x: prev.x + movements[direction].x,
        y: prev.y + movements[direction].y
      }));
    }
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const renderViewer = () => {
    const imageUrl = ctData.selectedFile?.data_url || null;
    
    if (error) {
      return (
        <div className="ct-viewer-container">
          <CTViewerControls
            activeTool={activeTool}
            onToolSelect={handleToolSelect}
            availablePlanes={ctData.availablePlanes}
            selectedPlane={ctData.selectedPlane}
            onPlaneSelect={handlePlaneSelect}
          />
          <div className="viewer-display">
            <div className="error-message" style={{ margin: '20px', padding: '15px' }}>
              Ошибка: {error}
              <button
                onClick={() => state.setError(null)}
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
        <CTViewerControls
          activeTool={activeTool}
          onToolSelect={handleToolSelect}
          availablePlanes={ctData.availablePlanes}
          selectedPlane={ctData.selectedPlane}
          onPlaneSelect={handlePlaneSelect}
        />
        
        <div ref={containerRef} className="viewer-display">
          {imageUrl ? (
            <VTKViewer
              imageUrl={imageUrl}
              plane={ctData.selectedPlane || 'sagittal'}
              activeTool={activeTool}
              windowLevel={windowLevel}
              zoomLevel={zoomLevel}
              panOffset={panOffset}
              onMeasurementComplete={handleMeasurementComplete}
              onAnnotationAdd={handleAnnotationAdd}
            />
          ) : (
            <div className="no-image-message">
              Изображение не выбрано. Пожалуйста, загрузите файлы и назначьте плоскости.
            </div>
          )}
        </div>
        
        <div className="viewer-tools">
          <div className="window-level-controls">
            <h4>Настройки окна/уровня</h4>
            <label>
              Окно: {windowLevel.window}
              <input
                type="range"
                min="0"
                max="2000"
                value={windowLevel.window}
                onChange={(e) => handleWindowLevelChange('window', e.target.value)}
              />
            </label>
            <label>
              Уровень: {windowLevel.level}
              <input
                type="range"
                min="-1000"
                max="1000"
                value={windowLevel.level}
                onChange={(e) => handleWindowLevelChange('level', e.target.value)}
              />
            </label>
          </div>
          
          <div className="zoom-controls">
            <h4>Масштаб и панорамирование</h4>
            <div className="control-buttons">
              <button onClick={() => handleZoom('in')}>Увеличить</button>
              <button onClick={() => handleZoom('out')}>Уменьшить</button>
              <button onClick={resetView}>Сбросить вид</button>
            </div>
            <div className="pan-controls">
              <button onClick={() => handlePan('up')}>↑</button>
              <button onClick={() => handlePan('down')}>↓</button>
              <button onClick={() => handlePan('left')}>←</button>
              <button onClick={() => handlePan('right')}>→</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

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

  return (
    <div className="ct-module">
      <h2>КТ Модуль</h2>
      
      <div className="patient-info">
        <h3>Информация о пациенте</h3>
        <div className="form-group">
          <label>Имя пациента:</label>
          <input
            type="text"
            value={ctData.patientName}
            onChange={(e) => setCtData(prev => ({
              ...prev,
              patientName: e.target.value
            }))}
          />
        </div>
        <div className="form-group">
          <label>Дата сканирования:</label>
          <input
            type="date"
            value={ctData.scanDate}
            onChange={(e) => setCtData(prev => ({
              ...prev,
              scanDate: e.target.value
            }))}
            style={{ padding: '8px', marginLeft: '10px' }}
          />
          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
            Файлы будут сохранены в папку: storage/patients/patient_1/dicom/{ctData.scanDate ? new Date(ctData.scanDate).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'дата_не_выбрана'}
          </span>
        </div>
        <div className="form-group">
          <label>Дата анализа:</label>
          <input
            type="date"
            value={ctData.analysisDate}
            onChange={(e) => setCtData(prev => ({
              ...prev,
              analysisDate: e.target.value
            }))}
          />
        </div>
      </div>
      
      <div className="ct-upload">
        <h3>Загрузка КТ файлов</h3>

        <CTScanDateSelector
          patientId={ctData.patientId}
          onDateSelect={handleScanDateSelect}
          selectedDate={ctData.scanDate}
        />

        <ArchiveUpload
          onUploadSuccess={handleArchiveUploadSuccess}
          onUploadError={handleArchiveUploadError}
          patientId={ctData.patientId}
          scanDate={ctData.scanDate}
          enableBackendUpload={true}
        />

        {ctData.ctScan && (
          <div className="upload-status">
            <p>{ctData.ctScan}</p>
            {ctData.storagePath && (
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Путь сохранения: {ctData.storagePath}
              </p>
            )}
            {ctData.uploadedFiles.length > 0 && (
              <button
                onClick={togglePlaneAssignment}
                style={{ marginTop: '10px', padding: '8px 16px' }}
              >
                {ctData.showPlaneAssignment ? 'Скрыть назначение плоскостей' : 'Показать назначение плоскостей'}
              </button>
            )}
          </div>
        )}
      </div>
      
      {renderPlaneAssignment()}
      
      {renderViewer()}
      
      <CTMeasurementsPanel
        measurements={ctData.measurements}
        onMeasurementChange={handleMeasurementChange}
      />
      
      <div className="actions">
        <button onClick={handleSave}>
          Сохранить данные КТ
        </button>
      </div>
    </div>
  );
};

export default CTModuleRefactored;
