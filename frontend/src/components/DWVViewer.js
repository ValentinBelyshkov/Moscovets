import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as dwv from 'dwv';
import './DWVViewer.css';

const DWVViewer = ({ files, onLoaded, onError }) => {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [currentTool, setCurrentTool] = useState('Scroll');
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [metaData, setMetaData] = useState(null);
  const [scale, setScale] = useState(1);
  const [windowLevel, setWindowLevel] = useState({ width: 0, center: 0 });

  // Доступные инструменты DWV
  const tools = [
    { name: 'Scroll', icon: '📜', label: 'Прокрутка' },
    { name: 'WindowLevel', icon: '🔆', label: 'Окно/Уровень' },
    { name: 'ZoomAndPan', icon: '🔍', label: 'Масштаб/Пан' },
    { name: 'Opacity', icon: '👁️', label: 'Прозрачность' },
    { name: 'Draw', icon: '✏️', label: 'Рисование' },
    { name: 'Brush', icon: '🖌️', label: 'Кисть' },
    { name: 'Floodfill', icon: '💧', label: 'Заливка' },
    { name: 'Livewire', icon: '⚡', label: 'Livewire' },
    { name: 'Filter', icon: '✨', label: 'Фильтр' },
    { name: 'Ruler', icon: '📏', label: 'Линейка' },
    { name: 'Ellipse', icon: '⭕', label: 'Эллипс' },
    { name: 'Rectangle', icon: '⬜', label: 'Прямоугольник' },
  ];

  // Типы измерений
  const drawShapes = [
    { name: 'Ruler', label: 'Линейка' },
    { name: 'Ellipse', label: 'Эллипс' },
    { name: 'Rectangle', label: 'Прямоугольник' },
    { name: 'Protractor', label: 'Транспортир' },
  ];

  // Фильтры
  const filters = [
    { name: 'Threshold', label: 'Порог' },
    { name: 'Sharpen', label: 'Резкость' },
    { name: 'Sobel', label: 'Sobel' },
    { name: 'Gaussian', label: 'Гаусс' },
  ];

  useEffect(() => {
    if (!containerRef.current || appRef.current) return;

    try {
      // Создаем экземпляр DWV приложения
      const app = new dwv.App();
      appRef.current = app;

      // Инициализация приложения с минимальной конфигурацией
      app.init({
        containerDivId: 'dwv-viewport',
        tools: {
          Scroll: {},
          WindowLevel: {},
          ZoomAndPan: {},
          Opacity: {},
          Draw: {
            options: ['Ruler', 'Ellipse', 'Rectangle', 'Protractor'],
            type: 'shape',
          },
          Brush: {},
          Floodfill: {},
          Livewire: {},
          Filter: {
            options: ['Threshold', 'Sharpen', 'Sobel', 'Gaussian'],
          },
        },
      });

      // Обработчики событий
      app.addEventListener('loadstart', () => {
        setIsLoading(true);
        setLoadProgress(0);
      });

      app.addEventListener('loadprogress', (event) => {
        setLoadProgress(event.loaded || 0);
      });

      app.addEventListener('load', (event) => {
        setIsLoading(false);
        setIsReady(true);
        
        // Получаем метаданные
        try {
          const meta = app.getMetaData(0);
          setMetaData(meta);
          
          // Получаем текущие значения окна/уровня
          const viewController = app.getViewController();
          if (viewController) {
            const wl = viewController.getWindowLevel();
            setWindowLevel({ width: wl.width, center: wl.center });
          }
        } catch (e) {
          console.warn('Error getting metadata:', e);
        }
        
        if (onLoaded) {
          onLoaded({
            data: event.data,
            metaData: app.getMetaData(0),
          });
        }
      });

      app.addEventListener('loadend', () => {
        setIsLoading(false);
      });

      app.addEventListener('error', (event) => {
        setIsLoading(false);
        console.error('DWV Error:', event);
        if (onError) {
          onError(event.message || 'Ошибка загрузки DICOM');
        }
      });

      // Установка начального инструмента
      app.setTool('Scroll');
      setIsReady(true);
    } catch (error) {
      console.error('Error initializing DWV:', error);
      if (onError) {
        onError('Ошибка инициализации DWV: ' + error.message);
      }
    }

    return () => {
      if (appRef.current) {
        try {
          appRef.current.dispose();
        } catch (e) {
          console.warn('Error disposing DWV:', e);
        }
        appRef.current = null;
      }
    };
  }, []);

  // Загрузка файлов
  useEffect(() => {
    if (!appRef.current || !files || files.length === 0) return;

    const loadFiles = async () => {
      try {
        const fileArray = Array.isArray(files) ? files : [files];
        
        // Фильтруем только DICOM файлы
        const dicomFiles = fileArray.filter(file => {
          if (!file) return false;
          const name = file.name?.toLowerCase() || '';
          return name.endsWith('.dcm') || name.endsWith('.dicom') || file.type === 'application/dicom';
        });

        if (dicomFiles.length === 0) {
          onError && onError('Не найдено DICOM файлов');
          return;
        }

        console.log('Loading DICOM files:', dicomFiles.map(f => f.name));
        
        // Загружаем файлы в DWV
        appRef.current.loadFiles(dicomFiles);
      } catch (error) {
        console.error('Error loading files:', error);
        onError && onError(error.message);
      }
    };

    loadFiles();
  }, [files, onError]);

  // Смена инструмента
  const handleToolChange = useCallback((toolName) => {
    if (!appRef.current) return;
    
    try {
      appRef.current.setTool(toolName);
      setCurrentTool(toolName);
    } catch (error) {
      console.error('Error setting tool:', error);
    }
  }, []);

  // Установка формы рисования
  const handleDrawShapeChange = useCallback((shape) => {
    if (!appRef.current) return;
    
    try {
      appRef.current.setTool('Draw');
      appRef.current.setToolFeatures({ shapeName: shape });
      setCurrentTool('Draw');
    } catch (error) {
      console.error('Error setting draw shape:', error);
    }
  }, []);

  // Установка фильтра
  const handleFilterChange = useCallback((filter) => {
    if (!appRef.current) return;
    
    try {
      appRef.current.setTool('Filter');
      appRef.current.setToolFeatures({ filterName: filter });
      setCurrentTool('Filter');
    } catch (error) {
      console.error('Error setting filter:', error);
    }
  }, []);

  // Сброс вида
  const handleReset = useCallback(() => {
    if (!appRef.current) return;
    try {
      appRef.current.resetDisplay();
      setScale(1);
    } catch (error) {
      console.error('Error resetting display:', error);
    }
  }, []);

  // Undo
  const handleUndo = useCallback(() => {
    if (!appRef.current) return;
    try {
      appRef.current.undo();
    } catch (error) {
      console.error('Error undoing:', error);
    }
  }, []);

  // Увеличить масштаб
  const handleZoomIn = useCallback(() => {
    if (!appRef.current) return;
    try {
      appRef.current.stepZoom(0.1);
      setScale(prev => prev * 1.1);
    } catch (error) {
      console.error('Error zooming in:', error);
    }
  }, []);

  // Уменьшить масштаб
  const handleZoomOut = useCallback(() => {
    if (!appRef.current) return;
    try {
      appRef.current.stepZoom(-0.1);
      setScale(prev => prev / 1.1);
    } catch (error) {
      console.error('Error zooming out:', error);
    }
  }, []);

  // Изменение окна/уровня
  const handleWindowChange = useCallback((delta) => {
    if (!appRef.current) return;
    try {
      const viewController = appRef.current.getViewController();
      if (viewController) {
        const current = viewController.getWindowLevel();
        viewController.setWindowLevel(current.width + delta, current.center);
        setWindowLevel({ width: current.width + delta, center: current.center });
      }
    } catch (error) {
      console.error('Error changing window:', error);
    }
  }, []);

  const handleLevelChange = useCallback((delta) => {
    if (!appRef.current) return;
    try {
      const viewController = appRef.current.getViewController();
      if (viewController) {
        const current = viewController.getWindowLevel();
        viewController.setWindowLevel(current.width, current.center + delta);
        setWindowLevel({ width: current.width, center: current.center + delta });
      }
    } catch (error) {
      console.error('Error changing level:', error);
    }
  }, []);

  return (
    <div className="dwv-viewer">
      {/* Панель инструментов */}
      <div className="dwv-toolbar">
        <div className="toolbar-section tools-section">
          <h4>Инструменты</h4>
          <div className="tools-grid">
            {tools.map((tool) => (
              <button
                key={tool.name}
                className={`tool-button ${currentTool === tool.name ? 'active' : ''}`}
                onClick={() => handleToolChange(tool.name)}
                title={tool.label}
              >
                <span className="tool-icon">{tool.icon}</span>
                <span className="tool-label">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

        {currentTool === 'Draw' && (
          <div className="toolbar-section">
            <h4>Фигуры</h4>
            <div className="shape-buttons">
              {drawShapes.map((shape) => (
                <button
                  key={shape.name}
                  className="shape-button"
                  onClick={() => handleDrawShapeChange(shape.name)}
                >
                  {shape.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentTool === 'Filter' && (
          <div className="toolbar-section">
            <h4>Фильтры</h4>
            <div className="filter-buttons">
              {filters.map((filter) => (
                <button
                  key={filter.name}
                  className="filter-button"
                  onClick={() => handleFilterChange(filter.name)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="toolbar-section controls-section">
          <h4>Управление</h4>
          <div className="control-buttons">
            <button className="control-button" onClick={handleZoomIn} title="Увеличить">
              🔍+
            </button>
            <span className="scale-display">{Math.round(scale * 100)}%</span>
            <button className="control-button" onClick={handleZoomOut} title="Уменьшить">
              🔍-
            </button>
            <button className="control-button" onClick={handleUndo} title="Отменить">
              ↩️
            </button>
            <button className="control-button reset" onClick={handleReset} title="Сбросить">
              🔄
            </button>
          </div>
        </div>

        {currentTool === 'WindowLevel' && (
          <div className="toolbar-section">
            <h4>Окно/Уровень</h4>
            <div className="wl-controls">
              <div className="wl-row">
                <span>Окно:</span>
                <button onClick={() => handleWindowChange(-10)}>-</button>
                <span>{Math.round(windowLevel.width)}</span>
                <button onClick={() => handleWindowChange(10)}>+</button>
              </div>
              <div className="wl-row">
                <span>Уровень:</span>
                <button onClick={() => handleLevelChange(-10)}>-</button>
                <span>{Math.round(windowLevel.center)}</span>
                <button onClick={() => handleLevelChange(10)}>+</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Область просмотра */}
      <div className="dwv-container-wrapper">
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Загрузка DICOM... {Math.round(loadProgress)}%</p>
          </div>
        )}
        
        <div 
          ref={containerRef}
          id="dwv-viewport"
          className="dwv-viewport"
        />

        {!isReady && !isLoading && (
          <div className="empty-state">
            <p>Загрузите DICOM файлы для просмотра</p>
          </div>
        )}
      </div>

      {/* Информация о изображении */}
      {metaData && (
        <div className="metadata-panel">
          <h4>Информация DICOM</h4>
          <div className="metadata-grid">
            {metaData['PatientName'] && (
              <div className="metadata-item">
                <span className="metadata-label">Пациент:</span>
                <span className="metadata-value">
                  {typeof metaData['PatientName'] === 'object' 
                    ? metaData['PatientName'].value 
                    : metaData['PatientName']}
                </span>
              </div>
            )}
            {metaData['StudyDate'] && (
              <div className="metadata-item">
                <span className="metadata-label">Дата:</span>
                <span className="metadata-value">
                  {typeof metaData['StudyDate'] === 'object' 
                    ? metaData['StudyDate'].value 
                    : metaData['StudyDate']}
                </span>
              </div>
            )}
            {metaData['Modality'] && (
              <div className="metadata-item">
                <span className="metadata-label">Модальность:</span>
                <span className="metadata-value">
                  {typeof metaData['Modality'] === 'object' 
                    ? metaData['Modality'].value 
                    : metaData['Modality']}
                </span>
              </div>
            )}
            {metaData['InstitutionName'] && (
              <div className="metadata-item">
                <span className="metadata-label">Учреждение:</span>
                <span className="metadata-value">
                  {typeof metaData['InstitutionName'] === 'object' 
                    ? metaData['InstitutionName'].value 
                    : metaData['InstitutionName']}
                </span>
              </div>
            )}
            {metaData['SliceThickness'] && (
              <div className="metadata-item">
                <span className="metadata-label">Толщина среза:</span>
                <span className="metadata-value">
                  {typeof metaData['SliceThickness'] === 'object' 
                    ? metaData['SliceThickness'].value 
                    : metaData['SliceThickness']} мм
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DWVViewer;
