import React from 'react';
import './PhotometryModule.css';

const PhotometryMeasurementsPanel = ({ 
  photometryData, 
  calculateMeasurements,
  onCalculateMeasurements
}) => {
  const hasPoints = Object.keys(photometryData.points).length > 0;
  const hasMeasurements = Object.keys(photometryData.measurements).length > 0;
  
  const handleCalculate = () => {
    const measurements = calculateMeasurements();
    if (onCalculateMeasurements) {
      onCalculateMeasurements(measurements);
    }
  };
  
  return (
    <div className="measurements">
      <h3>Измерения</h3>
      {hasPoints && (
        <button onClick={handleCalculate}>Рассчитать измерения</button>
      )}
      
      {hasMeasurements && (
        <table>
          <thead>
            <tr>
              <th>Измерение</th>
              <th>Значение</th>
              <th>Единицы</th>
              <th>Норма</th>
              <th>Интерпретация</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(photometryData.measurements || {}).map(([key, measurement]) => (
              <tr key={key}>
                <td>{measurement.name}</td>
                <td>{measurement.value.toFixed(2)}</td>
                <td>{measurement.unit}</td>
                <td>{measurement.norm || 'N/A'}</td>
                <td>{measurement.interpretation || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {!hasPoints && (
        <p className="no-measurements-info">
          Установите точки на изображении, чтобы рассчитать измерения.
        </p>
      )}
    </div>
  );
};

export default PhotometryMeasurementsPanel;