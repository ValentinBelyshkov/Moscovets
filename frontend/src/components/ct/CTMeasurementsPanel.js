import React from 'react';

const measurementGroups = {
  "ВНЧС (височно-нижнечелюстной сустав) - положение суставной головки в суставной ямке": [
    "rightClosedPositionX", "rightClosedPositionY",
    "rightOpenPositionX", "rightOpenPositionY",
    "leftClosedPositionX", "leftClosedPositionY",
    "leftOpenPositionX", "leftOpenPositionY"
  ],
  "Срезы зубов верхней и нижней челюстей в сагиттальной проекции": [
    "toothWidthUpper", "toothWidthLower",
    "boneThicknessUpper", "boneThicknessLower"
  ],
  "Pen-анализ - наклоны первых моляров": [
    "molarInclinationUpper", "molarInclinationLower"
  ],
  "Ширина апикального базиса верхней и нижней челюстей": [
    "basalWidthUpper", "basalWidthLower", "basalWidthDeficit"
  ],
  "Воздухоносные пути - аксиальные срезы, положение языка, измерение объема": [
    "tonguePosition", "airwayVolume"
  ]
};

const measurementLabels = {
  rightClosedPositionX: 'Правая головка (закрыто) - X',
  rightClosedPositionY: 'Правая головка (закрыто) - Y',
  rightOpenPositionX: 'Правая головка (открыто) - X',
  rightOpenPositionY: 'Правая головка (открыто) - Y',
  leftClosedPositionX: 'Левая головка (закрыто) - X',
  leftClosedPositionY: 'Левая головка (закрыто) - Y',
  leftOpenPositionX: 'Левая головка (открыто) - X',
  leftOpenPositionY: 'Левая головка (открыто) - Y',
  toothWidthUpper: 'Ширина зуба (верхняя челюсть)',
  toothWidthLower: 'Ширина зуба (нижняя челюсть)',
  boneThicknessUpper: 'Толщина кости (верхняя челюсть)',
  boneThicknessLower: 'Толщина кости (нижняя челюсть)',
  molarInclinationUpper: 'Наклон моляра (верхняя челюсть)',
  molarInclinationLower: 'Наклон моляра (нижняя челюсть)',
  basalWidthUpper: 'Ширина апикального базиса (верхняя челюсть)',
  basalWidthLower: 'Ширина апикального базиса (нижняя челюсть)',
  basalWidthDeficit: 'Дефицит ширины апикального базиса',
  tonguePosition: 'Положение языка',
  airwayVolume: 'Объем воздухоносных путей'
};

const CTMeasurementsPanel = ({ measurements, onMeasurementChange }) => {
  return (
    <div className="measurements-section">
      <h3>Измерения</h3>
      
      {Object.entries(measurementGroups).map(([groupName, groupMeasurements]) => (
        <div key={groupName} className="measurement-group">
          <h4>{groupName}</h4>
          {groupMeasurements.map(measurement => (
            <div key={measurement} className="measurement-item">
              <label>{measurementLabels[measurement] || measurement}:</label>
              <input
                type="number"
                step="0.1"
                value={measurements[measurement] || 0}
                onChange={(e) => onMeasurementChange(measurement, e.target.value)}
              />
              <span className="measurement-unit">мм</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default CTMeasurementsPanel;
