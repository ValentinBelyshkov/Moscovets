import React from 'react';

const CTViewerControls = ({
  activeTool,
  onToolSelect,
  availablePlanes,
  selectedPlane,
  onPlaneSelect
}) => {
  return (
    <div className="viewer-controls">
      <div className="tool-selector">
        <h4>Инструменты анализа</h4>
        <button
          className={activeTool === 'ruler' ? 'active' : ''}
          onClick={() => onToolSelect('ruler')}
        >
          Линейка (измерение расстояний)
        </button>
        <button
          className={activeTool === 'protractor' ? 'active' : ''}
          onClick={() => onToolSelect('protractor')}
        >
          Транспортир (измерение углов)
        </button>
        <button
          className={activeTool === 'annotate' ? 'active' : ''}
          onClick={() => onToolSelect('annotate')}
        >
          Аннотации (визуальные метки)
        </button>
      </div>
      
      {availablePlanes && Object.keys(availablePlanes).length > 0 && (
        <div className="plane-selector">
          <h4>Выбор плоскости</h4>
          <div className="plane-buttons">
            {availablePlanes.sagittal && (
              <button
                className={selectedPlane === 'sagittal' ? 'active' : ''}
                onClick={() => onPlaneSelect('sagittal')}
              >
                Сагиттальная
              </button>
            )}
            {availablePlanes.coronal && (
              <button
                className={selectedPlane === 'coronal' ? 'active' : ''}
                onClick={() => onPlaneSelect('coronal')}
              >
                Корональная
              </button>
            )}
            {availablePlanes.axial && (
              <button
                className={selectedPlane === 'axial' ? 'active' : ''}
                onClick={() => onPlaneSelect('axial')}
              >
                Аксиальная
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CTViewerControls;
