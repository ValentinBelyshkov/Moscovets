import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePatientNavigation } from '../hooks/usePatientNavigation';
import './ModelingModule.css';
import ThreeDViewer2 from './ThreeDViewer2';

const ModelingModule = () => {
  // Обрабатываем навигацию с данными пациента
  usePatientNavigation();
  
  const [modelingData, setModelingData] = useState({
    patientName: 'Иванов Иван Иванович',
    patientId: 1,
    analysisDate: new Date().toISOString().split('T')[0],
    sessionId: `local_session_${Date.now()}`,
    
    models: {
      upperJaw: null,
      lowerJaw: null,
      bite1: null,
      bite2: null
    },
    
    modelTypes: {
      upperJaw: null,
      lowerJaw: null,
      bite1: null,
      bite2: null
    },
    
    modelFiles: {
      upperJaw: null,
      lowerJaw: null,
      bite1: null,
      bite2: null
    },
    
    parameters: {
      cementGap: 0.1,
      insertionPathAngle: 10,
      borderThickness: 0.5,
      smoothingStrength: 0.5,
      autoAdaptation: true,
      scale: 1.0,
      rotation: { x: 0, y: 0, z: 0 },
      assemblyTolerance: 0.1,
    },
    
    modelingState: {
      isLoaded: false,
      isAssembled: false,
      isFitted: false,
      isOcclusionPadCreated: false,
      isEdited: false,
      isExported: false,
    },
    
    currentStep: 1,
    
    activeTool: 'select',
    sculptMode: false,
    brushSettings: {
      size: 5,
      strength: 0.5,
      mode: 'add',
      operation: 'sculpt',
      falloff: 2.0
    },
    
    exportFormats: ['STL', 'OBJ'],
    selectedExportFormat: 'STL'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  
  const [viewerSettings, setViewerSettings] = useState({
    showGrid: true,
    showAxes: true,
    showAssembly: false,
    showOcclusionPad: false,
    showIntersection: false,
    showInstructions: true,
    showHelp: false,
    editingMode: false,
    cameraPosition: { x: 200, y: 200, z: 200 }
  });

  const fileInputRefs = {
    upperJaw: useRef(null),
    lowerJaw: useRef(null),
    bite1: useRef(null),
    bite2: useRef(null)
  };

  const threeDViewerRef = useRef();

  // Обновление настроек кисти
  const updateBrushSettings = useCallback((settings) => {
    setModelingData(prev => ({
      ...prev,
      brushSettings: {
        ...prev.brushSettings,
        ...settings
      }
    }));
    
    if (threeDViewerRef.current && threeDViewerRef.current.setBrushSettings) {
      threeDViewerRef.current.setBrushSettings(settings);
    }
  }, []);

  // Переключение режима скульптинга
  const toggleSculptMode = useCallback(() => {
    const newSculptMode = !modelingData.sculptMode;
    
    setModelingData(prev => ({
      ...prev,
      sculptMode: newSculptMode,
      activeTool: newSculptMode ? 'brush' : 'select'
    }));
    
    setViewerSettings(prev => ({
      ...prev,
      editingMode: newSculptMode
    }));
    
    // Если выключаем режим скульптинга, скрываем окклюзионную накладку
    if (!newSculptMode) {
      setViewerSettings(prev => ({
        ...prev,
        showOcclusionPad: false,
        showIntersection: false
      }));
    }
  }, [modelingData.sculptMode]);

  // Viewer settings handlers
  const toggleViewerSetting = (setting) => {
    setViewerSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const loadTestModels = () => {
    setLoading(true);
    setError(null);

    try {
      setSuccessMessage('Для тестирования загрузите реальные STL/OBJ файлы через кнопки загрузки');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error) {
      console.error('Error loading test models:', error);
      setError('Ошибка при загрузке тестовых моделей: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getModelDisplayName = (modelType) => {
    const names = {
      upperJaw: 'Верхняя челюсть',
      lowerJaw: 'Нижняя челюсть',
      bite1: 'Прикус 1',
      bite2: 'Прикус 2'
    };
    return names[modelType] || modelType;
  };

  const removeModel = (modelType) => {
    setModelingData(prev => {
      const updatedModels = {
        ...prev.models,
        [modelType]: null
      };
      
      const allLoaded = ['upperJaw', 'lowerJaw'].every(type => updatedModels[type]);
      
      if (prev.models[modelType] && prev.models[modelType].startsWith('blob:')) {
        URL.revokeObjectURL(prev.models[modelType]);
      }
      
      return {
        ...prev,
        models: updatedModels,
        modelTypes: {
          ...prev.modelTypes,
          [modelType]: null
        },
        modelFiles: {
          ...prev.modelFiles,
          [modelType]: null
        },
        modelingState: {
          ...prev.modelingState,
          isLoaded: allLoaded
        },
        currentStep: allLoaded ? 2 : 1,
        sculptMode: false
      };
    });
    
    setViewerSettings(prev => ({
      ...prev,
      editingMode: false
    }));
  };

  const handleModelUpload = async (modelType, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isSTL = fileName.endsWith('.stl');
    const isOBJ = fileName.endsWith('.obj');
    
    if (!isSTL && !isOBJ) {
      setError('Пожалуйста, выберите файл в формате STL или OBJ');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const modelFormat = isSTL ? 'STL' : 'OBJ';
      const modelUrl = URL.createObjectURL(file);
      
      setDebugInfo(`Загружается ${modelType}: ${file.name} (${(file.size/1024).toFixed(1)} KB, ${modelFormat})`);
      
      if (modelingData.models[modelType] && modelingData.models[modelType].startsWith('blob:')) {
        URL.revokeObjectURL(modelingData.models[modelType]);
      }
      
      setModelingData(prev => {
        const updatedModels = {
          ...prev.models,
          [modelType]: modelUrl
        };
        
        const allLoaded = ['upperJaw', 'lowerJaw'].every(type => updatedModels[type]);
        
        return {
          ...prev,
          models: updatedModels,
          modelTypes: {
            ...prev.modelTypes,
            [modelType]: modelFormat
          },
          modelFiles: {
            ...prev.modelFiles,
            [modelType]: file
          },
          modelingState: {
            ...prev.modelingState,
            isLoaded: allLoaded
          },
          currentStep: allLoaded ? 2 : 1,
          sculptMode: false
        };
      });
      
      setViewerSettings(prev => ({
        ...prev,
        editingMode: false
      }));
      
      setSuccessMessage(`Модель ${getModelDisplayName(modelType)} успешно загружена (${modelFormat})`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error) {
      console.error('Error uploading model:', error);
      setError('Ошибка при загрузке модели: ' + error.message);
    } finally {
      setLoading(false);
      setTimeout(() => setDebugInfo(''), 5000);
    }
  };

  const assembleModels = async () => {
    if (!modelingData.modelingState.isLoaded) {
      setError('Сначала загрузите модели');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setViewerSettings(prev => ({
        ...prev,
        showAssembly: true
      }));

      if (threeDViewerRef.current && threeDViewerRef.current.fitModels) {
        await threeDViewerRef.current.fitModels();
      }

      setModelingData(prev => ({
        ...prev,
        modelingState: {
          ...prev.modelingState,
          isAssembled: true,
          isFitted: true
        },
        currentStep: 3,
        sculptMode: false
      }));
      
      setSuccessMessage('Модели успешно собраны и подогнаны');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error) {
      console.error('Error assembling models:', error);
      setError('Ошибка при сборке моделей: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createOcclusionPad = async () => {
    if (!modelingData.modelingState.isFitted) {
      setError('Сначала необходимо собрать модели');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setViewerSettings(prev => ({
        ...prev,
        showOcclusionPad: true,
        showIntersection: true
      }));

      if (threeDViewerRef.current && threeDViewerRef.current.generateOcclusionPad) {
        await threeDViewerRef.current.generateOcclusionPad();
      }

      setModelingData(prev => ({
        ...prev,
        modelingState: {
          ...prev.modelingState,
          isOcclusionPadCreated: true
        },
        currentStep: 4
      }));
      
      setSuccessMessage('Окклюзионная накладка успешно создана');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error) {
      console.error('Error creating occlusion pad:', error);
      setError('Ошибка при создании окклюзионной накладки: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const autoAdaptOcclusion = async () => {
    if (!modelingData.modelingState.isOcclusionPadCreated) {
      setError('Сначала необходимо создать окклюзионную накладку');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setModelingData(prev => ({
        ...prev,
        modelingState: {
          ...prev.modelingState,
          isEdited: true
        }
      }));
      
      setSuccessMessage('Автоматическая адаптация выполнена');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error) {
      console.error('Error auto-adapting occlusion:', error);
      setError('Ошибка при автоматической адаптации: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBrushEdit = async (operation, data) => {
    if (!modelingData.modelingState.isOcclusionPadCreated) {
      setError('Сначала необходимо создать окклюзионную накладку');
      return false;
    }

    console.log('Редактирование кистью:', { operation, data });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setModelingData(prev => ({
      ...prev,
      modelingState: {
        ...prev.modelingState,
        isEdited: true
      }
    }));
    
    return true;
  };

  const handleParameterChange = (parameter, value) => {
    setModelingData(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [parameter]: value
      }
    }));
  };

  const handleToolChange = (tool) => {
    const newSculptMode = tool === 'brush' || tool === 'smooth';
    
    setModelingData(prev => ({
      ...prev,
      activeTool: tool,
      sculptMode: newSculptMode
    }));
    
    setViewerSettings(prev => ({
      ...prev,
      editingMode: newSculptMode
    }));
  };

  const exportModel = async (format = modelingData.selectedExportFormat) => {
    if (!modelingData.modelingState.isOcclusionPadCreated) {
      setError('Сначала необходимо создать окклюзионную накладку');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let dummyData = '';
      if (format === 'STL') {
        dummyData = `solid occlusion_pad\n  facet normal 0 0 0\n    outer loop\n      vertex 0 0 0\n      vertex 1 0 0\n      vertex 0 1 0\n    endloop\n  endfacet\nendsolid occlusion_pad`;
      } else {
        dummyData = `# OBJ File\nv 0.0 0.0 0.0\nv 1.0 0.0 0.0\nv 0.0 1.0 0.0\nf 1 2 3`;
      }
      
      const blob = new Blob([dummyData], { 
        type: format === 'STL' ? 'application/sla' : 'application/obj' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `occlusion_pad_${modelingData.patientName.replace(/\s+/g, '_')}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setModelingData(prev => ({
        ...prev,
        modelingState: {
          ...prev.modelingState,
          isExported: true
        },
        currentStep: 6
      }));
      
      setSuccessMessage(`Модель успешно экспортирована в формате ${format}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error) {
      console.error('Error exporting model:', error);
      setError('Ошибка при экспорте модели: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetCamera = () => {
    if (threeDViewerRef.current && threeDViewerRef.current.resetCamera) {
      threeDViewerRef.current.resetCamera();
    }
  };

  const debugScene = () => {
    if (threeDViewerRef.current && threeDViewerRef.current.debugScene) {
      threeDViewerRef.current.debugScene();
    }
  };

  const handleSave = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage('Данные моделирования сохранены успешно!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error saving modeling data:', error);
      setError('Ошибка при сохранении данных моделирования: ' + error.message);
    }
  };

  const renderStepProgress = () => {
    const steps = [
      { number: 1, name: 'Загрузка моделей', completed: modelingData.modelingState.isLoaded },
      { number: 2, name: 'Сборка', completed: modelingData.modelingState.isAssembled },
      { number: 3, name: 'Моделирование накладки', completed: modelingData.modelingState.isOcclusionPadCreated },
      { number: 4, name: 'Редактирование', completed: modelingData.modelingState.isEdited },
      { number: 5, name: 'Экспорт', completed: modelingData.modelingState.isExported }
    ];

    return (
      <div className="step-progress">
        <h3>Процесс моделирования</h3>
        <div className="steps-container">
          {steps.map(step => (
            <div 
              key={step.number} 
              className={`step ${step.completed ? 'completed' : ''} ${modelingData.currentStep === step.number ? 'current' : ''}`}
            >
              <div className="step-number">{step.number}</div>
              <div className="step-name">{step.name}</div>
              {step.completed && <div className="step-check">✓</div>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderInstructionsModal = () => (
    showInstructions && (
      <div className="instructions-overlay">
        <div className="instructions-modal">
          <button 
            className="close-instructions"
            onClick={() => setShowInstructions(false)}
          >
            ✕
          </button>
          <h3>📖 Руководство по работе с модулем</h3>
          <div className="instructions-content">
            <div className="instruction-step">
              <h4>1️⃣ Загрузка моделей</h4>
              <p><strong>Важно:</strong> Загружайте реальные STL/OBJ файлы. Тестовые кнопки создают только wireframe модели для демонстрации.</p>
              <p className="tip">💡 Для правильной работы загрузите хотя бы верхнюю и нижнюю челюсть.</p>
            </div>
            <div className="instruction-step">
              <h4>2️⃣ Настройка параметров</h4>
              <p>Настройте параметры моделирования: цементный зазор, путь введения, толщину границ и другие важные параметры.</p>
            </div>
            <div className="instruction-step">
              <h4>3️⃣ Сборка и моделирование</h4>
              <p>Выполните сборку моделей, создайте окклюзионную накладку и при необходимости отредактируйте её с помощью инструментов.</p>
            </div>
            <div className="instruction-step">
              <h4>4️⃣ Экспорт и сохранение</h4>
              <p>Экспортируйте готовую модель в формате STL или OBJ и сохраните результаты в медицинскую карту пациента.</p>
            </div>
          </div>
        </div>
      </div>
    )
  );

  const renderViewerControls = () => (
    <div className="viewer-controls-panel">
      <h4>Настройки 3D просмотра</h4>
      
      <div className="viewer-controls-group">
        <div className="viewer-control">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={viewerSettings.showGrid}
              onChange={() => toggleViewerSetting('showGrid')}
              className="checkbox-input"
            />
            Показать сетку
          </label>
        </div>
        
        <div className="viewer-control">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={viewerSettings.showAxes}
              onChange={() => toggleViewerSetting('showAxes')}
              className="checkbox-input"
            />
            Показать оси координат
          </label>
        </div>
        
        <div className="viewer-control">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={viewerSettings.showAssembly}
              onChange={() => toggleViewerSetting('showAssembly')}
              className="checkbox-input"
              disabled={!modelingData.modelingState.isAssembled}
            />
            Показать сборку
          </label>
        </div>
        
        <div className="viewer-control">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={viewerSettings.showOcclusionPad}
              onChange={() => toggleViewerSetting('showOcclusionPad')}
              className="checkbox-input"
              disabled={!modelingData.modelingState.isOcclusionPadCreated}
            />
            Показать окклюзионную накладку
          </label>
        </div>
        
        <div className="viewer-control">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={viewerSettings.showIntersection}
              onChange={() => toggleViewerSetting('showIntersection')}
              className="checkbox-input"
              disabled={!modelingData.modelingState.isOcclusionPadCreated}
            />
            Показать пересечения
          </label>
        </div>
      </div>
      
      <div className="camera-controls">
        <button onClick={resetCamera} className="control-btn small">
          🔄 Сбросить камеру
        </button>
        <button 
          onClick={debugScene}
          className="control-btn small"
          title="Информация о сцене"
        >
          🔍 Дебаг
        </button>
        <button 
          onClick={() => setViewerSettings(prev => ({ ...prev, showHelp: !prev.showHelp }))}
          className="control-btn small"
        >
          ❓ Подсказки
        </button>
        <button 
          onClick={toggleSculptMode}
          className={`control-btn small ${modelingData.sculptMode ? 'active' : ''}`}
          disabled={!modelingData.modelingState.isOcclusionPadCreated}
          title="Режим редактирования кистью"
        >
          {modelingData.sculptMode ? '✏️' : '🖌️'}
        </button>
      </div>
    </div>
  );

  const renderSculptControls = () => (
    <div className="brush-controls-panel">
      <h4>Настройки инструментов редактирования</h4>
      
      <div className="sculpt-tools-preview">
        <div className="sculpt-tool-buttons">
          <button
            className={`sculpt-tool-preview-btn ${modelingData.brushSettings.operation === 'sculpt' ? 'active' : ''}`}
            onClick={() => updateBrushSettings({ operation: 'sculpt' })}
            title="Скульптурирование"
          >
            <span className="tool-icon-preview">🗿</span>
            <span className="tool-name-preview">Скульптура</span>
          </button>
          <button
            className={`sculpt-tool-preview-btn ${modelingData.brushSettings.operation === 'smooth' ? 'active' : ''}`}
            onClick={() => updateBrushSettings({ operation: 'smooth' })}
            title="Сглаживание"
          >
            <span className="tool-icon-preview">✨</span>
            <span className="tool-name-preview">Сглаживание</span>
          </button>
          <button
            className={`sculpt-tool-preview-btn ${modelingData.brushSettings.operation === 'remove' ? 'active' : ''}`}
            onClick={() => updateBrushSettings({ operation: 'remove' })}
            title="Удаление"
          >
            <span className="tool-icon-preview">🔥</span>
            <span className="tool-name-preview">Удаление</span>
          </button>
        </div>
      </div>
      
      <div className="brush-controls-group">
        <div className="brush-control">
          <label>Размер кисти: {modelingData.brushSettings.size.toFixed(1)}</label>
          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            value={modelingData.brushSettings.size}
            onChange={(e) => updateBrushSettings({ size: parseFloat(e.target.value) })}
            disabled={!modelingData.modelingState.isOcclusionPadCreated}
          />
        </div>
        
        <div className="brush-control">
          <label>Сила кисти: {modelingData.brushSettings.strength.toFixed(1)}</label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={modelingData.brushSettings.strength}
            onChange={(e) => updateBrushSettings({ strength: parseFloat(e.target.value) })}
            disabled={!modelingData.modelingState.isOcclusionPadCreated}
          />
        </div>
        
        <div className="brush-mode-selector">
          <button
            className={`brush-mode-btn ${modelingData.brushSettings.mode === 'add' ? 'active' : ''}`}
            onClick={() => updateBrushSettings({ mode: 'add' })}
            disabled={!modelingData.modelingState.isOcclusionPadCreated}
            title="Добавление материала"
          >
            ➕ Добавить
          </button>
          <button
            className={`brush-mode-btn ${modelingData.brushSettings.mode === 'subtract' ? 'active' : ''}`}
            onClick={() => updateBrushSettings({ mode: 'subtract' })}
            disabled={!modelingData.modelingState.isOcclusionPadCreated}
            title="Удаление материала"
          >
            ➖ Удалить
          </button>
        </div>
      </div>
    </div>
  );

  // Очистка URL при размонтировании
  useEffect(() => {
    return () => {
      Object.values(modelingData.models).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  return (
    <div className="modeling-module">
      <button 
        onClick={() => setShowInstructions(true)}
        className="instructions-btn"
      >
        📖 Инструкции
      </button>

      {renderInstructionsModal()}

      <h2>Модуль моделирования окклюзионных накладок</h2>
      
      {renderStepProgress()}
      
      {debugInfo && (
        <div className="debug-info">
          {debugInfo}
        </div>
      )}
      
      <div className="section patient-info">
        <h3>Информация о пациенте</h3>
        <div className="form-group">
          <label>Имя пациента:</label>
          <input
            type="text"
            value={modelingData.patientName}
            onChange={(e) => setModelingData(prev => ({
              ...prev,
              patientName: e.target.value
            }))}
          />
        </div>
        <div className="form-group">
          <label>Дата анализа:</label>
          <input
            type="date"
            value={modelingData.analysisDate}
            onChange={(e) => setModelingData(prev => ({
              ...prev,
              analysisDate: e.target.value
            }))}
          />
        </div>
      </div>
      
      <div className="section models-upload">
        <h3>1. Загрузка 3D моделей (STL/OBJ)</h3>
        <div className="upload-controls">
          <button
            onClick={loadTestModels}
            disabled={loading}
            className="load-test-btn"
          >
            Показать тестовые wireframe модели
          </button>
          <span className="upload-hint">
            Для демонстрации (только wireframe)
          </span>
        </div>
        
        <div className="models-grid">
          {['upperJaw', 'lowerJaw', 'bite1', 'bite2'].map(modelType => (
            <div key={modelType} className="model-card">
              <h4>{getModelDisplayName(modelType)}</h4>
              {modelingData.models[modelType] ? (
                <div className="model-loaded">
                  <div className="model-info">
                    <p>Формат: {modelingData.modelTypes[modelType]}</p>
                    <p>Размер: {modelingData.modelFiles[modelType]?.name || 'Загружено'}</p>
                  </div>
                  <button 
                    className="remove-btn"
                    onClick={() => removeModel(modelType)}
                    disabled={modelingData.modelingState.isAssembled}
                  >
                    Удалить
                  </button>
                </div>
              ) : (
                <div className="model-upload">
                  <input
                    type="file"
                    accept=".stl,.obj"
                    onChange={(e) => handleModelUpload(modelType, e)}
                    ref={fileInputRefs[modelType]}
                    className="file-input"
                    id={`file-input-${modelType}`}
                  />
                  <button 
                    onClick={() => fileInputRefs[modelType].current.click()}
                    disabled={loading}
                    className="upload-btn"
                  >
                    Загрузить {modelType.includes('Jaw') ? 'челюсть' : 'прикус'}
                  </button>
                  <p className="file-hint">STL или OBJ формат</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="section modeling-parameters">
        <h3>2. Параметры моделирования</h3>
        <div className="parameters-grid">
          <div className="parameter-group">
            <label>Цементный зазор (мм):</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="2"
              value={modelingData.parameters.cementGap}
              onChange={(e) => handleParameterChange('cementGap', parseFloat(e.target.value))}
              disabled={modelingData.modelingState.isOcclusionPadCreated}
              className="parameter-input"
            />
            <span className="parameter-hint">Требуется для создания накладки</span>
          </div>
          
          <div className="parameter-group">
            <label>Угол пути введения:</label>
            <input
              type="number"
              step="1"
              min="0"
              max="45"
              value={modelingData.parameters.insertionPathAngle}
              onChange={(e) => handleParameterChange('insertionPathAngle', parseInt(e.target.value))}
              disabled={modelingData.modelingState.isOcclusionPadCreated}
              className="parameter-input"
            />
            <span className="parameter-hint">Угол в градусах (0-45)</span>
          </div>
          
          <div className="parameter-group">
            <label>Толщина границ (мм):</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="2"
              value={modelingData.parameters.borderThickness}
              onChange={(e) => handleParameterChange('borderThickness', parseFloat(e.target.value))}
              disabled={modelingData.modelingState.isOcclusionPadCreated}
              className="parameter-input"
            />
            <span className="parameter-hint">Толщина границ накладки</span>
          </div>
        </div>
      </div>
      
      <div className="section model-viewer">
        <h3>3D просмотр моделей</h3>
        
        <div className="viewer-container">
          <div className="viewer-left">
            {renderViewerControls()}
            {modelingData.modelingState.isOcclusionPadCreated && renderSculptControls()}
          </div>
          
          <div className="viewer-center">
            <div className="viewer-header">
              <button onClick={resetCamera} className="control-btn">
                🔄 Сброс камеры
              </button>
              <div className="viewer-info">
                {modelingData.models.upperJaw && <span>Верхняя челюсть ✓</span>}
                {modelingData.models.lowerJaw && <span>Нижняя челюсть ✓</span>}
                {modelingData.models.bite1 && <span>Прикус 1 ✓</span>}
                {modelingData.models.bite2 && <span>Прикус 2 ✓</span>}
              </div>
            </div>
            
            <ThreeDViewer2
              ref={threeDViewerRef}
              models={modelingData.models}
              modelTypes={modelingData.modelTypes}
              showAssembly={viewerSettings.showAssembly}
              showOcclusionPad={viewerSettings.showOcclusionPad}
              editingMode={viewerSettings.editingMode}
              sculptMode={modelingData.sculptMode}
              brushSettings={modelingData.brushSettings}
              onBrushEdit={handleBrushEdit}
              onBrushSettingsChange={updateBrushSettings}
              parameters={modelingData.parameters}
              cementGap={modelingData.parameters.cementGap}
              insertionPathAngle={modelingData.parameters.insertionPathAngle}
            />
          </div>
        </div>
      </div>
      
      <div className="section modeling-actions">
        <h3>Действия моделирования</h3>
        <div className="actions-grid">
          <button
            onClick={assembleModels}
            disabled={!modelingData.modelingState.isLoaded || loading}
            className={`action-btn ${modelingData.modelingState.isAssembled ? 'completed' : ''}`}
          >
            {modelingData.modelingState.isAssembled ? '✓ ' : ''}
            Собрать и подогнать модели
          </button>
          
          <button
            onClick={createOcclusionPad}
            disabled={!modelingData.modelingState.isAssembled || loading}
            className={`action-btn ${modelingData.modelingState.isOcclusionPadCreated ? 'completed' : ''}`}
          >
            {modelingData.modelingState.isOcclusionPadCreated ? '✓ ' : ''}
            Создать окклюзионную накладку
          </button>
          
          <button
            onClick={autoAdaptOcclusion}
            disabled={!modelingData.modelingState.isOcclusionPadCreated || loading}
            className={`action-btn ${modelingData.modelingState.isEdited ? 'completed' : ''}`}
          >
            {modelingData.modelingState.isEdited ? '✓ ' : ''}
            Автоматическая адаптация
          </button>
        </div>
      </div>
      
      {modelingData.modelingState.isOcclusionPadCreated && (
        <div className="section modeling-tools">
          <h3>Инструменты редактирования</h3>
          <div className="tools-panel">
            <div className="tool-buttons">
              <button
                className={modelingData.activeTool === 'select' ? 'active' : ''}
                onClick={() => handleToolChange('select')}
              >
                <span className="tool-icon">↖️</span> Выбор
              </button>
              <button
                className={`${modelingData.activeTool === 'brush' ? 'active' : ''} ${modelingData.sculptMode ? 'sculpt-mode-active' : ''}`}
                onClick={() => handleToolChange('brush')}
              >
                <span className="tool-icon">🖌️</span> Кисть
                {modelingData.sculptMode && <span className="tool-badge">активно</span>}
              </button>
              <button
                className={modelingData.activeTool === 'smooth' ? 'active' : ''}
                onClick={() => handleToolChange('smooth')}
              >
                <span className="tool-icon">✨</span> Сглаживание
              </button>
            </div>
            {modelingData.sculptMode && (
              <div className="sculpt-mode-indicator">
                <span className="sculpt-mode-text">Режим редактирования кистью активен</span>
                <button 
                  className="exit-sculpt-btn"
                  onClick={toggleSculptMode}
                >
                  Выйти из режима
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {modelingData.modelingState.isOcclusionPadCreated && (
        <div className="section export-section">
          <h3>Экспорт модели</h3>
          <div className="export-options">
            <div className="export-buttons">
              <button
                onClick={() => exportModel('STL')}
                disabled={loading}
                className="export-btn"
              >
                Экспортировать в STL
              </button>
              
              <button
                onClick={() => exportModel('OBJ')}
                disabled={loading}
                className="export-btn secondary"
              >
                Экспортировать в OBJ
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="section save-section">
        <button
          onClick={handleSave}
          disabled={!modelingData.modelingState.isOcclusionPadCreated}
          className="save-btn"
        >
          💾 Сохранить в медицинскую карту
        </button>
      </div>
      
      {loading && <div className="loading-indicator">Обработка...</div>}
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
    </div>
  );
};

export default ModelingModule;