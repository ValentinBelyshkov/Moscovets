import React, { useState, useRef, useEffect } from 'react';
import localMedicalRecordService from '../services/localMedicalRecordService';
import modelingService from '../services/modelingService';
import ThreeDViewerEnhanced from './ThreeDViewerEnhanced';
import './ModelingModule.css';

const ModelingModuleEnhanced = () => {
  // State for modeling data
  const [modelingData, setModelingData] = useState({
    patientName: 'Иванов Иван Иванович',
    patientId: 1, // В реальном приложении будет из контекста
    analysisDate: new Date().toISOString().split('T')[0],
    sessionId: null,
    models: {
      upperJaw: null,
      lowerJaw: null,
      bite1: null,
      bite2: null,
      occlusionPad: null
    },
    modelTypes: {
      upperJaw: null, // 'STL' or 'OBJ'
      lowerJaw: null,
      bite1: null,
      bite2: null,
      occlusionPad: null
    },
    modelFiles: {
      upperJaw: null,
      lowerJaw: null,
      bite1: null,
      bite2: null,
      occlusionPad: null
    },
    // Параметры моделирования
    parameters: {
      cementGap: 0.1, // Цементный зазор в мм
      insertionPath: 'vertical', // Путь введения: 'vertical', 'horizontal', 'custom'
      borderThickness: 0.5, // Толщина границ в мм
      smoothingStrength: 0.5, // Сила сглаживания
      autoAdaptation: true // Автоматическая адаптация
    },
    // Состояние моделирования
    modelingState: {
      isAssembled: false,
      isOcclusionPadCreated: false,
      isEdited: false
    },
    // Инструменты редактирования
    activeTool: 'select', // 'select', 'brush', 'smooth', 'erase'
    brushSize: 5,
    brushStrength: 0.5
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Refs
  const fileInputRefs = {
    upperJaw: useRef(null),
    lowerJaw: useRef(null),
    bite1: useRef(null),
    bite2: useRef(null)
  };

  // Инициализация сессии моделирования
  useEffect(() => {
    const initializeSession = async () => {
      if (!modelingData.sessionId) {
        try {
          const sessionData = {
            patient_id: modelingData.patientId,
            cement_gap: modelingData.parameters.cementGap,
            insertion_path: modelingData.parameters.insertionPath,
            border_thickness: modelingData.parameters.borderThickness,
            smoothing_strength: modelingData.parameters.smoothingStrength,
            auto_adaptation: modelingData.parameters.autoAdaptation
          };
          
          const session = await modelingService.createModelingSession(sessionData);
          
          setModelingData(prev => ({
            ...prev,
            sessionId: session.id
          }));
          
        } catch (error) {
          console.error('Error creating modeling session:', error);
          setError('Ошибка при создании сессии моделирования: ' + error.message);
        }
      }
    };
    
    initializeSession();
  }, []);

  // Обработка загрузки 3D моделей
  const handleModelUpload = async (modelType, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверка формата файла
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
      // Загружаем модель на бэкенд
      const modelFormat = isSTL ? modelingService.MODEL_FORMATS.STL : modelingService.MODEL_FORMATS.OBJ;
      const apiModelType = modelType.toUpperCase();
      
      const uploadResponse = await modelingService.uploadModel(
        file,
        modelingData.patientId,
        apiModelType,
        modelFormat
      );
      
      // Добавляем модель в сессию
      if (modelingData.sessionId) {
        await modelingService.addModelToSession(
          modelingData.sessionId,
          apiModelType,
          uploadResponse.id
        );
      }
      
      // Создаем URL для 3D модели
      const modelUrl = modelingService.getModelFileUrl(uploadResponse.id);
      
      setModelingData(prev => ({
        ...prev,
        models: {
          ...prev.models,
          [modelType]: modelUrl
        },
        modelTypes: {
          ...prev.modelTypes,
          [modelType]: modelFormat.toUpperCase()
        },
        modelFiles: {
          ...prev.modelFiles,
          [modelType]: file
        }
      }));
      
      setSuccessMessage(`Модель ${getModelDisplayName(modelType)} успешно загружена`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error) {
      console.error('Error uploading model:', error);
      setError('Ошибка при загрузке модели: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка тестовых моделей для демонстрации
  const loadTestModels = () => {
    setLoading(true);
    setError(null);

    console.log('ModelingModuleEnhanced: Loading test models');
    
    // Используем разные OBJ файлы для каждой модели
    const newModelData = {
      models: {
        upperJaw: '/test_upper_jaw.obj',
        lowerJaw: '/test_lower_jaw.obj',
        bite1: '/test_cube.obj',
        bite2: '/test_cube.obj'
      },
      modelTypes: {
        upperJaw: 'OBJ',
        lowerJaw: 'OBJ',
        bite1: 'OBJ',
        bite2: 'OBJ'
      },
      modelFiles: {
        upperJaw: null,
        lowerJaw: null,
        bite1: null,
        bite2: null
      }
    };
    
    console.log('ModelingModuleEnhanced: New model data:', newModelData);
    
    setModelingData(prev => {
      const updated = {
        ...prev,
        ...newModelData
      };
      console.log('ModelingModuleEnhanced: Updated modeling data:', updated);
      console.log('ModelingModuleEnhanced: 3D viewer condition check:', {
        upperJaw: updated.models.upperJaw,
        lowerJaw: updated.models.lowerJaw,
        bite1: updated.models.bite1,
        bite2: updated.models.bite2,
        condition: updated.models.upperJaw || updated.models.lowerJaw || updated.models.bite1 || updated.models.bite2
      });
      return updated;
    });
    
    setLoading(false);
    setSuccessMessage('Тестовые модели успешно загружены');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Получение отображаемого имени модели
  const getModelDisplayName = (modelType) => {
    const names = {
      upperJaw: 'Верхняя челюсть',
      lowerJaw: 'Нижняя челюсть',
      bite1: 'Прикус 1',
      bite2: 'Прикус 2'
    };
    return names[modelType] || modelType;
  };

  // Удаление модели
  const removeModel = (modelType) => {
    // Очистка URL если он существует
    if (modelingData.models[modelType] && modelingData.models[modelType].startsWith('blob:')) {
      URL.revokeObjectURL(modelingData.models[modelType]);
    }
    
    setModelingData(prev => ({
      ...prev,
      models: {
        ...prev.models,
        [modelType]: null
      },
      modelTypes: {
        ...prev.modelTypes,
        [modelType]: null
      },
      modelFiles: {
        ...prev.modelFiles,
        [modelType]: null
      }
    }));
  };

  // Сборка модели
  const assembleModels = async () => {
    if (!modelingData.models.upperJaw || !modelingData.models.lowerJaw) {
      setError('Для сборки необходимы модели верхней и нижней челюсти');
      return;
    }

    if (!modelingData.sessionId) {
      setError('Сессия моделирования не инициализирована');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const assemblyResponse = await modelingService.assembleModels(
        modelingData.sessionId,
        true, // auto_align
        modelingData.parameters.cementGap // tolerance
      );

      if (assemblyResponse.success) {
        setModelingData(prev => ({
          ...prev,
          modelingState: {
            ...prev.modelingState,
            isAssembled: true
          }
        }));
        setSuccessMessage('Модели успешно собраны');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Ошибка при сборке моделей: ' + assemblyResponse.message);
      }
    } catch (error) {
      console.error('Error assembling models:', error);
      setError('Ошибка при сборке моделей: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Создание окклюзионной накладки
  const createOcclusionPad = async () => {
    if (!modelingData.modelingState.isAssembled) {
      setError('Сначала необходимо собрать модели');
      return;
    }

    if (!modelingData.sessionId) {
      setError('Сессия моделирования не инициализирована');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const padResponse = await modelingService.createOcclusionPad(
        modelingData.sessionId,
        modelingData.parameters.borderThickness * 2, // pad_thickness
        modelingData.parameters.borderThickness, // margin_offset
        modelingData.parameters.cementGap // cement_gap
      );

      if (padResponse.success) {
        // Загружаем созданную накладку
        if (padResponse.pad_model_id) {
          const modelUrl = modelingService.getModelFileUrl(padResponse.pad_model_id);
          
          setModelingData(prev => ({
            ...prev,
            models: {
              ...prev.models,
              occlusionPad: modelUrl
            },
            modelTypes: {
              ...prev.modelTypes,
              occlusionPad: 'STL'
            },
            modelingState: {
              ...prev.modelingState,
              isOcclusionPadCreated: true
            }
          }));
        }
        
        setSuccessMessage('Окклюзионная накладка создана');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Ошибка при создании окклюзионной накладки: ' + padResponse.message);
      }
    } catch (error) {
      console.error('Error creating occlusion pad:', error);
      setError('Ошибка при создании окклюзионной накладки: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Автоматическая адаптация по окклюзии
  const autoAdaptOcclusion = () => {
    if (!modelingData.modelingState.isOcclusionPadCreated) {
      setError('Сначала необходимо создать окклюзионную накладку');
      return;
    }

    setLoading(true);
    setError(null);

    // Имитация процесса адаптации
    setTimeout(() => {
      setModelingData(prev => ({
        ...prev,
        modelingState: {
          ...prev.modelingState,
          isEdited: true
        }
      }));
      setLoading(false);
      setSuccessMessage('Автоматическая адаптация завершена');
      setTimeout(() => setSuccessMessage(null), 3000);
    }, 2500);
  };

  // Обработка изменения параметров
  const handleParameterChange = (parameter, value) => {
    setModelingData(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [parameter]: value
      }
    }));
  };

  // Обработка изменения инструмента
  const handleToolChange = (tool) => {
    setModelingData(prev => ({
      ...prev,
      activeTool: tool
    }));
  };

  // Экспорт модели
  const exportModel = async (format) => {
    if (!modelingData.modelingState.isOcclusionPadCreated) {
      setError('Сначала необходимо создать окклюзионную накладку');
      return;
    }

    if (!modelingData.sessionId) {
      setError('Сессия моделирования не инициализирована');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const exportResponse = await modelingService.exportModel(
        modelingData.sessionId,
        modelingService.MODEL_TYPES.OCCLUSION_PAD,
        format.toLowerCase()
      );

      if (exportResponse.success && exportResponse.download_url) {
        // Скачиваем файл
        const response = await modelingService.downloadExportedModel(
          exportResponse.download_url.split('/').pop()
        );
        
        // Создаем blob и скачиваем файл
        const blob = new Blob([response.data], { type: 'application/octet-stream' });
        console.log('ModelingModuleEnhanced create object URL with blob:', blob);
        console.log('Blob type:', typeof blob);
        console.log('Blob instanceof Blob:', blob instanceof Blob);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `occlusion_pad.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setSuccessMessage(`Модель экспортирована в формате ${format}`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Ошибка при экспорте модели: ' + (exportResponse.message || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Error exporting model:', error);
      setError('Ошибка при экспорте модели: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Сохранение в медицинскую карту
  const handleSave = async () => {
    try {
      // Подготовка данных для сохранения
      const modelingDataToSave = {
        patient_id: 1, // В реальном приложении будет из контекста пациента
        record_type: 'modeling',
        data: JSON.stringify({
          patientName: modelingData.patientName,
          analysisDate: modelingData.analysisDate,
          parameters: modelingData.parameters,
          modelingState: modelingData.modelingState,
          hasUpperJaw: !!modelingData.models.upperJaw,
          hasLowerJaw: !!modelingData.models.lowerJaw,
          hasBite1: !!modelingData.models.bite1,
          hasBite2: !!modelingData.models.bite2
        }),
        notes: 'Occlusion pad modeling'
      };
      
      // Сохранение в медицинских записях
      await localMedicalRecordService.createMedicalRecord(modelingDataToSave);
      
      setSuccessMessage('Данные моделирования сохранены успешно!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error saving modeling data:', error);
      setError('Ошибка при сохранении данных моделирования: ' + error.message);
    }
  };

  // Очистка сообщений об ошибках при изменении данных
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="modeling-module">
      <h2>Модуль моделирования окклюзионных накладок</h2>
      
      {/* Информация о пациенте */}
      <div className="patient-info">
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
      
      {/* Загрузка моделей */}
      <div className="models-upload">
        <h3>Загрузка 3D моделей</h3>
        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={loadTestModels}
            disabled={loading}
            style={{
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Загрузить тестовые модели
          </button>
        </div>
        <div className="models-grid">
          {Object.keys(modelingData.models).map(modelType => (
            <div key={modelType} className="model-card">
              <h4>{getModelDisplayName(modelType)}</h4>
              {modelingData.models[modelType] ? (
                <div className="model-loaded">
                  <p>Загружено: {modelingData.modelTypes[modelType]}</p>
                  <button 
                    className="remove-btn"
                    onClick={() => removeModel(modelType)}
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
                    style={{ display: 'none' }}
                  />
                  <button 
                    onClick={() => fileInputRefs[modelType].current.click()}
                    disabled={loading}
                  >
                    Загрузить модель
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Параметры моделирования */}
      <div className="modeling-parameters">
        <h3>Параметры моделирования</h3>
        <div className="parameters-grid">
          <div className="parameter-group">
            <label>Цементный зазор (мм):</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={modelingData.parameters.cementGap}
              onChange={(e) => handleParameterChange('cementGap', parseFloat(e.target.value))}
            />
          </div>
          
          <div className="parameter-group">
            <label>Путь введения:</label>
            <select
              value={modelingData.parameters.insertionPath}
              onChange={(e) => handleParameterChange('insertionPath', e.target.value)}
            >
              <option value="vertical">Вертикальный</option>
              <option value="horizontal">Горизонтальный</option>
              <option value="custom">Пользовательский</option>
            </select>
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
            />
          </div>
          
          <div className="parameter-group">
            <label>Сила сглаживания:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={modelingData.parameters.smoothingStrength}
              onChange={(e) => handleParameterChange('smoothingStrength', parseFloat(e.target.value))}
            />
            <span>{modelingData.parameters.smoothingStrength.toFixed(1)}</span>
          </div>
          
          <div className="parameter-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={modelingData.parameters.autoAdaptation}
                onChange={(e) => handleParameterChange('autoAdaptation', e.target.checked)}
              />
              Автоматическая адаптация
            </label>
          </div>
        </div>
      </div>
      
      {/* 3D просмотрщик */}
      <div className="model-viewer">
        <h3>3D просмотр моделей</h3>
        {/* Отладочная информация */}
        <div style={{ backgroundColor: '#f0f0f0', padding: '10px', marginBottom: '10px', fontSize: '12px' }}>
          <strong>Отладочная информация:</strong><br/>
          Upper Jaw URL: {modelingData.models.upperJaw ? modelingData.models.upperJaw.substring(0, 50) + '...' : 'null'}<br/>
          Lower Jaw URL: {modelingData.models.lowerJaw ? modelingData.models.lowerJaw.substring(0, 50) + '...' : 'null'}<br/>
          Bite1 URL: {modelingData.models.bite1 ? modelingData.models.bite1.substring(0, 50) + '...' : 'null'}<br/>
          Bite2 URL: {modelingData.models.bite2 ? modelingData.models.bite2.substring(0, 50) + '...' : 'null'}<br/>
          Условие отображения: {(modelingData.models.upperJaw || modelingData.models.lowerJaw || modelingData.models.bite1 || modelingData.models.bite2) ? 'true' : 'false'}
        </div>
        {(modelingData.models.upperJaw || modelingData.models.lowerJaw || modelingData.models.bite1 || modelingData.models.bite2) ? (
          <ThreeDViewerEnhanced
            models={modelingData.models}
            modelTypes={modelingData.modelTypes}
            showAssembly={modelingData.modelingState.isAssembled}
            showOcclusionPad={modelingData.modelingState.isOcclusionPadCreated}
          />
        ) : (
          <div style={{
            height: '200px',
            backgroundColor: '#ffebee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #f44336'
          }}>
            <p style={{ color: '#d32f2f', textAlign: 'center' }}>
              Нет загруженных моделей для отображения<br/>
              Нажмите "Загрузить тестовые модели" выше
            </p>
          </div>
        )}
      </div>
      
      {/* Инструменты моделирования */}
      {modelingData.modelingState.isOcclusionPadCreated && (
        <div className="modeling-tools">
          <h3>Инструменты редактирования</h3>
          <div className="tools-panel">
            <div className="tool-buttons">
              <button
                className={modelingData.activeTool === 'select' ? 'active' : ''}
                onClick={() => handleToolChange('select')}
              >
                Выбор
              </button>
              <button
                className={modelingData.activeTool === 'brush' ? 'active' : ''}
                onClick={() => handleToolChange('brush')}
              >
                Кисть
              </button>
              <button
                className={modelingData.activeTool === 'smooth' ? 'active' : ''}
                onClick={() => handleToolChange('smooth')}
              >
                Сглаживание
              </button>
              <button
                className={modelingData.activeTool === 'erase' ? 'active' : ''}
                onClick={() => handleToolChange('erase')}
              >
                Стирание
              </button>
            </div>
            
            {(modelingData.activeTool === 'brush' || modelingData.activeTool === 'smooth' || modelingData.activeTool === 'erase') && (
              <div className="tool-settings">
                <div className="setting-group">
                  <label>Размер кисти:</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={modelingData.brushSize}
                    onChange={(e) => setModelingData(prev => ({
                      ...prev,
                      brushSize: parseInt(e.target.value)
                    }))}
                  />
                  <span>{modelingData.brushSize}px</span>
                </div>
                
                <div className="setting-group">
                  <label>Сила:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={modelingData.brushStrength}
                    onChange={(e) => setModelingData(prev => ({
                      ...prev,
                      brushStrength: parseFloat(e.target.value)
                    }))}
                  />
                  <span>{modelingData.brushStrength.toFixed(1)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Основные действия */}
      <div className="modeling-actions">
        <h3>Действия</h3>
        <div className="actions-grid">
          <button
            onClick={assembleModels}
            disabled={!modelingData.models.upperJaw || !modelingData.models.lowerJaw || loading}
            className="primary-btn"
          >
            Собрать модели
          </button>
          
          <button
            onClick={createOcclusionPad}
            disabled={!modelingData.modelingState.isAssembled || loading}
            className="primary-btn"
          >
            Создать окклюзионную накладку
          </button>
          
          <button
            onClick={autoAdaptOcclusion}
            disabled={!modelingData.modelingState.isOcclusionPadCreated || loading}
          >
            Автоматическая адаптация
          </button>
          
          <div className="export-buttons">
            <button
              onClick={() => exportModel('STL')}
              disabled={!modelingData.modelingState.isOcclusionPadCreated || loading}
            >
              Экспорт в STL
            </button>
            <button
              onClick={() => exportModel('OBJ')}
              disabled={!modelingData.modelingState.isOcclusionPadCreated || loading}
            >
              Экспорт в OBJ
            </button>
          </div>
        </div>
      </div>
      
      {/* Сохранение */}
      <div className="save-section">
        <button
          onClick={handleSave}
          disabled={!modelingData.modelingState.isOcclusionPadCreated}
          className="save-btn"
        >
          Сохранить в медицинскую карту
        </button>
      </div>
      
      {/* Индикаторы состояния */}
      <div className="status-indicators">
        <h3>Статус моделирования</h3>
        <div className="status-list">
          <div className={`status-item ${modelingData.models.upperJaw ? 'completed' : 'pending'}`}>
            <span className="status-icon">{modelingData.models.upperJaw ? '✓' : '○'}</span>
            Верхняя челюсть загружена
          </div>
          <div className={`status-item ${modelingData.models.lowerJaw ? 'completed' : 'pending'}`}>
            <span className="status-icon">{modelingData.models.lowerJaw ? '✓' : '○'}</span>
            Нижняя челюсть загружена
          </div>
          <div className={`status-item ${modelingData.modelingState.isAssembled ? 'completed' : 'pending'}`}>
            <span className="status-icon">{modelingData.modelingState.isAssembled ? '✓' : '○'}</span>
            Модели собраны
          </div>
          <div className={`status-item ${modelingData.modelingState.isOcclusionPadCreated ? 'completed' : 'pending'}`}>
            <span className="status-icon">{modelingData.modelingState.isOcclusionPadCreated ? '✓' : '○'}</span>
            Окклюзионная накладка создана
          </div>
          <div className={`status-item ${modelingData.modelingState.isEdited ? 'completed' : 'pending'}`}>
            <span className="status-icon">{modelingData.modelingState.isEdited ? '✓' : '○'}</span>
            Модель отредактирована
          </div>
        </div>
      </div>
      
      {/* Сообщения */}
      {loading && <div className="loading-indicator">Обработка...</div>}
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
    </div>
  );
};

export default ModelingModuleEnhanced;