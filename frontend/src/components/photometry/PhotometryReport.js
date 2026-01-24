import React from 'react';
import './PhotometryModule.css';

const PhotometryReport = ({
  reportData,
  generateReport,
  exportReportAsPDF,
  exportReportAsPPTX,
  hasMeasurements
}) => {
  if (!hasMeasurements) {
    return null;
  }
  
  const handleGenerateReport = () => {
    generateReport();
  };
  
  return (
    <div className="report-section">
      <div className="report">
        <h3>Отчет</h3>
        <button onClick={handleGenerateReport}>Сформировать отчет</button>
        
        {reportData && (
          <div className="report-content">
            <h4>Результаты фотометрического анализа</h4>
            <p><strong>Пациент:</strong> {reportData.patientName}</p>
            <p><strong>Дата анализа:</strong> {reportData.analysisDate}</p>
            <p><strong>Тип проекции:</strong> {
              reportData.projectionType === 'frontal' ? 'Анфас' : 
              reportData.projectionType === 'profile' ? 'Профиль' :
              reportData.projectionType === 'profile45' ? 'Профиль 45°' : 'Внутриротовые'
            }</p>
            <p><strong>Заключение:</strong> {reportData.conclusion}</p>
            
            <table>
              <thead>
                <tr>
                  <th>Параметр</th>
                  <th>Значение</th>
                  <th>Единицы</th>
                  <th>Норма</th>
                  <th>Интерпретация</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(reportData.measurements || {}).map(([key, measurement]) => (
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
          </div>
        )}
      </div>
      
      {/* Export Buttons */}
      {reportData && (
        <div className="export-buttons">
          <button onClick={exportReportAsPDF}>Экспорт в PDF</button>
          <button onClick={exportReportAsPPTX}>Экспорт в PPTX</button>
        </div>
      )}
    </div>
  );
};

export default PhotometryReport;