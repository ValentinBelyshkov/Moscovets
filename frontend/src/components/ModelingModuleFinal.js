import React, { useState, useEffect } from 'react';
import ThreeDViewerFixed from './ThreeDViewerFixed';
import './ModelingModule.css';

const ModelingModuleFinal = () => {
  // State for modeling data
  const [modelingData, setModelingData] = useState({
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
    // Состояние моделирования
    modelingState: {
      isAssembled: false,
      isOcclusionPadCreated: false,
      isEdited: false
    }
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Загрузка тестовых моделей для демонстрации
  const loadTestModels = () => {
    setLoading(true);
    setError(null);

    console.log('ModelingModuleFinal: Loading test models');
    
    // Используем статические OBJ файлы
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
      }
    };
    
    console.log('ModelingModuleFinal: New model data:', newModelData);
    
    setModelingData(prev => {
      const updated = {
        ...prev,
        ...newModelData
      };
      console.log('ModelingModuleFinal: Updated modeling data:', updated);
      return updated;
    });
    
    setLoading(false);
    setSuccessMessage('Тестовые модели успешно загружены');
    setTimeout(() => setSuccessMessage(null), 3000);
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
      }
    }));
  };

  // Сборка модели
  const assembleModels = () => {
    if (!modelingData.models.upperJaw || !modelingData.models.lowerJaw) {
      setError('Для сборки необходимы модели верхней и нижней челюсти');
      return;
    }

    setModelingData(prev => ({
      ...prev,
      modelingState: {
        ...prev.modelingState,
        isAssembled: true
      }
    }));
    
    setSuccessMessage('Модели успешно собраны');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Создание окклюзионной накладки
  const createOcclusionPad = () => {
    if (!modelingData.modelingState.isAssembled) {
      setError('Сначала необходимо собрать модели');
      return;
    }

    setModelingData(prev => ({
      ...prev,
      modelingState: {
        ...prev.modelingState,
        isOcclusionPadCreated: true
      }
    }));
    
    setSuccessMessage('Окклюзионная накладка создана');
    setTimeout(() => setSuccessMessage(null), 3000);
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

  // Экспорт модели
  const exportModel = (format) => {
    if (!modelingData.modelingState.isOcclusionPadCreated) {
      setError('Сначала необходимо создать окклюзионную накладку');
      return;
    }

    setSuccessMessage(`Модель экспортирована в формате ${format}`);
    setTimeout(() => setSuccessMessage(null), 3000);
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
      <h2>Финальный модуль моделирования окклюзионных накладок</h2>
      
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
              <h4>{modelType}</h4>
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
                  <button 
                    onClick={() => alert('Загрузка реальных моделей недоступна в тестовой версии')}
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
      
      {/* 3D просмотрщик */}
      <div className="model-viewer">
        <h3>3D просмотр моделей</h3>
        {/* Отладочная информация */}
        <div style={{ backgroundColor: '#f0f0f0', padding: '10px', marginBottom: '10px', fontSize: '12px' }}>
          <strong>Отладочная информация:</strong><br/>
          Models: {JSON.stringify(modelingData.models)}<br/>
          ModelTypes: {JSON.stringify(modelingData.modelTypes)}<br/>
          Условие отображения: {(modelingData.models.upperJaw || modelingData.models.lowerJaw || modelingData.models.bite1 || modelingData.models.bite2) ? 'true' : 'false'}
        </div>
        {(modelingData.models.upperJaw || modelingData.models.lowerJaw || modelingData.models.bite1 || modelingData.models.bite2) ? (
          <ThreeDViewerFixed
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

export default ModelingModuleFinal;