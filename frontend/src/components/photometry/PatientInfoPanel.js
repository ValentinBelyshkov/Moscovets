import React from 'react';

const PatientInfoPanel = ({ photometryData, onDataChange }) => {
  return (
    <div className="patient-info">
      <h3>Информация о пациенте</h3>
      <div className="form-group">
        <label>Имя пациента:</label>
        <input
          type="text"
          value={photometryData.patientName}
          onChange={(e) => onDataChange({
            ...photometryData,
            patientName: e.target.value
          })}
        />
      </div>
      <div className="form-group">
        <label>Дата анализа:</label>
        <input
          type="date"
          value={photometryData.analysisDate}
          onChange={(e) => onDataChange({
            ...photometryData,
            analysisDate: e.target.value
          })}
        />
      </div>
      <div className="form-group">
        <label>Тип проекции:</label>
        <select
          value={photometryData.projectionType}
          onChange={(e) => onDataChange({
            ...photometryData,
            projectionType: e.target.value
          })}
        >
          <option value="frontal">Анфас</option>
          <option value="frontalSmile">Анфас с улыбкой</option>
          <option value="frontalRetractorsClosed">Анфас с закрытыми щечками</option>
          <option value="frontalRetractorsOpen">Анфас с открытыми щечками</option>
          <option value="profileRight">Профиль справа</option>
          <option value="profileLeft">Профиль слева</option>
          <option value="profileSmileRight">Профиль справа с улыбкой</option>
          <option value="profileSmileLeft">Профиль слева с улыбкой</option>
          <option value="profile45Right">Профиль 45° справа</option>
          <option value="profile45Left">Профиль 45° слева</option>
          <option value="intraoralFrontalClosed">Внутриротовые анфас закрыто</option>
          <option value="intraoralFrontalOpen">Внутриротовые анфас открыто</option>
          <option value="intraoralRight90">Внутриротовые справа 90°</option>
          <option value="intraoralRight45">Внутриротовые справа 45°</option>
          <option value="intraoralLeft90">Внутриротовые слева 90°</option>
          <option value="intraoralLeft45">Внутриротовые слева 45°</option>
          <option value="intraoralUpper">Верхняя челюсть</option>
          <option value="intraoralLower">Нижняя челюсть</option>
        </select>
      </div>
    </div>
  );
};

export default PatientInfoPanel;
