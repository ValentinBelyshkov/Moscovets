import React from 'react';
import './PhotometryModule.css';

const PhotometryPointsList = ({
  pointDefinitions,
  photometryData,
  nextPointToPlace,
  selectedPoint,
  setSelectedPoint,
  setSelectedPointImage,
  setActiveTool,
  selectedPointImage
}) => {
  return (
    <div className="points-list">
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
      
      {/* Calibration section - Hidden after calibration is complete */}
      <div className={`calibration-section ${photometryData.scale > 1 ? 'hidden' : ''}`}>
        <h3>Калибровка</h3>
        <div className="calibration-info">
          <p>Перед расстановкой точек необходимо выполнить калибровку изображения:</p>
          <ol>
            <li>Выберите инструмент "Установка масштаба" в правой панели</li>
            <li>Выберите режим калибровки (10 мм или 30 мм)</li>
            <li>Установите первую точку на известном расстоянии</li>
            <li>Установите вторую точку на расстоянии 10 мм или 30 мм от первой</li>
            <li>После калибровки станет доступна расстановка точек</li>
          </ol>
        </div>
        
        <div className="calibration-status">
          {photometryData.scale > 1 ? (
            <p className="calibrated">✓ Изображение откалибровано</p>
          ) : (
            <p className="not-calibrated">⚠ Необходима калибровка</p>
          )}
        </div>
      </div>
      
      <h3>Точки для расстановки</h3>
      <div className="points-grid">
        {pointDefinitions[photometryData.projectionType].map(point => (
          <div
            key={point.id}
            className={`point-item ${photometryData.points[point.id] ? 'placed' : ''} ${nextPointToPlace === point.id ? 'next-point' : ''} ${selectedPoint === point.id ? 'selected' : ''}`}
            onClick={() => {
              setSelectedPoint(point.id);
              setSelectedPointImage(`/${point.id}.jpg`);
              setActiveTool('select');
            }}
          >
            <span className="point-id">{point.id}</span>
            <span className="point-name">{point.name}</span>
            {photometryData.points[point.id] ? (
              <span
                className="point-status"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPoint(point.id);
                  setSelectedPointImage(`/${point.id}.jpg`);
                  setActiveTool('select');
                }}
              >✓</span>
            ) : nextPointToPlace === point.id ? (
              <span className="point-next-indicator">След.</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotometryPointsList;