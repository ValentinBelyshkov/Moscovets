import React from 'react';

const CephalometrySidebar = ({
  pointDefinitions,
  cephalometryData,
  nextPointToPlace,
  selectedPoint,
  setSelectedPoint,
  setSelectedPointImage,
  setActiveTool,
  selectedPointImage,
  pointsListRef
}) => {
  return (
    <div className="points-list" ref={pointsListRef}>
      {/* Display selected point image above the points list */}
      {selectedPointImage && (
        <div className="selected-point-image">
          <h4>Изображение точки: {nextPointToPlace || selectedPoint}</h4>
          <img
            src={selectedPointImage}
            alt={`Точка ${nextPointToPlace || selectedPoint}`}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
            onLoad={(e) => {
              e.target.style.display = 'block';
            }}
          />
        </div>
      )}
      
      {/* Calibration status */}
      <div className={`calibration-section ${cephalometryData.scale > 1 ? 'hidden' : ''}`}>
        <h3>Калибровка</h3>
        <div className="calibration-info">
          <p>Перед расстановкой точек необходимо выполнить калибровку изображения:</p>
          <ol>
            <li>Выберите инструмент "Установка масштаба"</li>
            <li>Установите две точки на известном расстоянии</li>
          </ol>
        </div>
        <div className="calibration-status">
          {cephalometryData.scale > 1 ? (
            <p className="calibrated">✓ Откалибровано</p>
          ) : (
            <p className="not-calibrated">⚠ Нужна калибровка</p>
          )}
        </div>
      </div>
      
      <h3>Точки для расстановки</h3>
      <div className="points-grid">
        {pointDefinitions[cephalometryData.projectionType]?.map(point => (
          <div
            key={point.id}
            className={`point-item ${cephalometryData.points[point.id] ? 'placed' : ''} ${nextPointToPlace === point.id ? 'selected next-point' : ''} ${selectedPoint === point.id ? 'selected' : ''}`}
            onClick={() => {
              setSelectedPoint(point.id);
              setSelectedPointImage(`/${point.id}.jpg`);
              setActiveTool('select');
            }}
          >
            <span className="point-id">{point.id}</span>
            <span className="point-name">{point.name}</span>
            {cephalometryData.points[point.id] && <span className="point-status">✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CephalometrySidebar;
