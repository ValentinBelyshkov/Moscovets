import React from 'react';
import './PhotometryModule.css';

const PhotometryToolbar = ({ 
  activeTool, 
  setActiveTool, 
  photometryData, 
  setPhotometryData, 
  isScaleSet,
  magnifierZoom
}) => {
  return (
    <div className="toolbar">
      <h4>Инструменты</h4>
      <div className="tools">
        <button
          className={activeTool === 'select' ? 'active' : ''}
          onClick={() => setActiveTool('select')}
        >
          Выбор
        </button>
        <button
          className={activeTool === 'scale' ? 'active' : ''}
          onClick={() => {
            setActiveTool('scale');
            setPhotometryData(prev => ({ ...prev, isSettingScale: true }));
          }}
        >
          Установка масштаба
        </button>
        <button
          className={activeTool === 'point' ? 'active' : ''}
          onClick={() => setActiveTool('point')}
          disabled={!isScaleSet}
        >
          Перейти к расстановке точек
        </button>
      </div>
      
      <div className="scale-control">
        {photometryData.projectionType === 'profile' || photometryData.projectionType === 'profile45' ? (
          <>
            <label>Режим масштаба:</label>
            <select
              value={photometryData.scaleMode}
              onChange={(e) => {
                const newMode = e.target.value;
                setPhotometryData(prev => ({
                  ...prev,
                  scaleMode: newMode
                }));
                
                if (newMode === '10mm') {
                  setPhotometryData(prev => ({
                    ...prev,
                    scalePoints30: { point0: null, point30: null }
                  }));
                } else {
                  setPhotometryData(prev => ({
                    ...prev,
                    scalePoints: { point0: null, point10: null }
                  }));
                }
              }}
            >
              <option value="10mm">10 мм</option>
              <option value="30mm">30 мм</option>
            </select>
          </>
        ) : (
          <>
            <label>Тип эталонного объекта:</label>
            <select
              value={photometryData.calibrationType}
              onChange={(e) => {
                const newType = e.target.value;
                setPhotometryData(prev => ({
                  ...prev,
                  calibrationType: newType
                }));
                
                let defaultSize = 10;
                switch (newType) {
                  case 'implant': defaultSize = 10; break;
                  case 'crown': defaultSize = 8; break;
                  case 'distance': defaultSize = 15; break;
                  case 'known_object': defaultSize = 10; break;
                  default: defaultSize = 10;
                }
                
                setPhotometryData(prev => ({
                  ...prev,
                  calibrationObjectSize: defaultSize
                }));
              }}
            >
              <option value="implant">Имплантат</option>
              <option value="crown">Коронка/брекет</option>
              <option value="distance">Межзубное расстояние</option>
              <option value="known_object">Известный объект</option>
            </select>
            
            <label>Размер объекта (мм):</label>
            <input
              type="number"
              min="1"
              max="100"
              step="0.1"
              value={photometryData.calibrationObjectSize}
              onChange={(e) => {
                const newSize = parseFloat(e.target.value) || 0;
                setPhotometryData(prev => ({
                  ...prev,
                  calibrationObjectSize: newSize
                }));
              }}
            />
          </>
        )}
        
        <button
          onClick={() => {
            if (photometryData.projectionType === 'profile' || photometryData.projectionType === 'profile45') {
              if (photometryData.scaleMode === '10mm') {
                setPhotometryData(prev => ({
                  ...prev,
                  scalePoints: { point0: null, point10: null },
                  scale: 1
                }));
              } else {
                setPhotometryData(prev => ({
                  ...prev,
                  scalePoints30: { point0: null, point30: null },
                  scale: 1
                }));
              }
            } else {
              setPhotometryData(prev => ({
                ...prev,
                calibrationPoints: { point1: null, point2: null },
                scale: 1
              }));
            }
          }}
          style={{ marginTop: '10px', padding: '5px 10px' }}
        >
          Сбросить масштаб
        </button>
        
        {activeTool === 'scale' && (
          <div className="scale-instructions">
            {photometryData.projectionType === 'profile' || photometryData.projectionType === 'profile45' ? (
              <>
                <p>
                  {photometryData.scaleMode === '10mm'
                    ? 'Установите точку 0, затем точку 10 на расстоянии 10 мм'
                    : 'Установите точку 0, затем точку 30 на расстоянии 30 мм'}
                </p>
                <p>
                  {photometryData.scaleMode === '10mm'
                    ? `Точек установлено: ${photometryData.scalePoints.point0 ? 1 : 0}${photometryData.scalePoints.point10 ? ' + 1' : ''}`
                    : `Точек установлено: ${photometryData.scalePoints30.point0 ? 1 : 0}${photometryData.scalePoints30.point30 ? ' + 1' : ''}`}
                </p>
              </>
            ) : (
              <>
                <p>Установите первую точку на одном конце эталонного объекта</p>
                <p>Установите вторую точку на другом конце эталонного объекта</p>
                <p>Тип объекта: {photometryData.calibrationType}</p>
                <p>Размер объекта: {photometryData.calibrationObjectSize} мм</p>
                <p>Точек установлено: {photometryData.calibrationPoints.point1 ? 1 : 0}{photometryData.calibrationPoints.point2 ? ' + 1' : ''}</p>
              </>
            )}
          </div>
        )}
      </div>
      
      <div className="magnifier-info">
        <small>
          Средняя кнопка мыши для лупы (зум: {magnifierZoom}x)
        </small>
      </div>
    </div>
  );
};

export default PhotometryToolbar;