import React from 'react';

const PresentationHeader = ({ 
  patient, 
  exportFormat, 
  setExportFormat, 
  onGenerate, 
  onSelectAll, 
  onDeselectAll 
}) => {
  return (
    <div className="presentation-header-section">
      <div className="header-top">
        <h2>Генератор презентаций</h2>
        <div className="patient-badge">
          Пациент: {patient?.fullName || 'Демо-пациент'}
        </div>
      </div>
      
      <div className="generator-controls">
        <div className="control-group">
          <label>Формат экспорта:</label>
          <select 
            value={exportFormat} 
            onChange={(e) => setExportFormat(e.target.value)}
          >
            <option value="html">Интерактивный HTML</option>
            <option value="pptx">PowerPoint (PPTX)</option>
            <option value="pdf">Adobe PDF</option>
          </select>
        </div>
        
        <div className="action-buttons">
          <button className="btn-secondary" onClick={onSelectAll}>Выбрать все</button>
          <button className="btn-secondary" onClick={onDeselectAll}>Снять выбор</button>
          <button className="btn-primary" onClick={onGenerate}>Сгенерировать презентацию</button>
        </div>
      </div>
    </div>
  );
};

export default PresentationHeader;
