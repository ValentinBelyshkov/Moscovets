import React from 'react';
import './PhotometryModule.css';

const PatientInfoPanel = ({ 
  photometryData, 
  setPhotometryData,
  setShowFileLibrary
}) => {
  return (
    <div className="patient-info">
      <h3>Информация о пациенте</h3>
      <div className="patient-info-grid">
        <div className="form-group">
          <label>Имя пациента:</label>
          <input
            type="text"
            value={photometryData.patientName}
            onChange={(e) => setPhotometryData(prev => ({
              ...prev,
              patientName: e.target.value
            }))}
          />
        </div>
        <div className="form-group">
          <label>Дата анализа:</label>
          <input
            type="date"
            value={photometryData.analysisDate}
            onChange={(e) => setPhotometryData(prev => ({
              ...prev,
              analysisDate: e.target.value
            }))}
          />
        </div>
        <div className="form-group">
          <label>Тип проекции:</label>
          <select
            value={photometryData.projectionType}
            onChange={(e) => setPhotometryData(prev => ({
              ...prev,
              projectionType: e.target.value
            }))}
          >
            <option value="frontal">Анфас</option>
            <option value="profile">Профиль</option>
            <option value="profile45">Профиль 45°</option>
            <option value="intraoral">Внутриротовые</option>
          </select>
        </div>
        <div className="form-group">
          <button 
            onClick={() => setShowFileLibrary(true)}
            className="load-image-btn"
          >
            Загрузить изображение
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientInfoPanel;