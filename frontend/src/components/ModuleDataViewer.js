import React from 'react';
import './ModuleDataViewer.css';

const ModuleDataViewer = ({ moduleData, moduleType }) => {
  if (!moduleData) {
    return (
      <div className="module-data-viewer empty">
        <p>Нет данных модуля для отображения</p>
      </div>
    );
  }

  const formatData = (data) => {
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return (
          <ul>
            {data.map((item, index) => (
              <li key={index}>{formatData(item)}</li>
            ))}
          </ul>
        );
      } else {
        return (
          <table className="module-data-table">
            <tbody>
              {Object.entries(data).map(([key, value]) => (
                <tr key={key}>
                  <td className="data-key">{key}:</td>
                  <td className="data-value">
                    {typeof value === 'object' ? formatData(value) : String(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      }
    }
    return String(data);
  };

  const renderModuleSpecific = () => {
    switch (moduleType) {
      case 'photometry':
        return (
          <div className="module-specific photometry">
            {moduleData.data && (
              <>
                <h4>Детали анализа:</h4>
                <div className="photometry-details">
                  <p><strong>Тип проекции:</strong> {moduleData.data.projectionType}</p>
                  <p><strong>Дата анализа:</strong> {moduleData.data.analysisDate}</p>
                  <p><strong>Пациент:</strong> {moduleData.data.patientName}</p>
                  <p><strong>Масштаб:</strong> {moduleData.data.scale?.toFixed(2) || 'не установлен'}</p>
                </div>
                
                {moduleData.data.measurements && (
                  <>
                    <h4>Измерения:</h4>
                    <table className="measurements-table">
                      <thead>
                        <tr>
                          <th>Параметр</th>
                          <th>Значение</th>
                          <th>Единицы</th>
                          <th>Интерпретация</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(moduleData.data.measurements).map(([key, measurement]) => (
                          <tr key={key}>
                            <td>{measurement.name}</td>
                            <td className="measurement-value">{measurement.value?.toFixed(2)}</td>
                            <td>{measurement.unit}</td>
                            <td className="measurement-interpretation">
                              {measurement.interpretation || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </>
            )}
          </div>
        );
      
      case 'cephalometry':
        return (
          <div className="module-specific cephalometry">
            {moduleData.data && (
              <>
                <h4>Параметры цефалометрии:</h4>
                {moduleData.data.measurements && (
                  <table className="measurements-table">
                    <thead>
                      <tr>
                        <th>Параметр</th>
                        <th>Значение</th>
                        <th>Норма</th>
                        <th>Интерпретация</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(moduleData.data.measurements).map(([key, measurement]) => (
                        <tr key={key}>
                          <td>{measurement.name || key}</td>
                          <td className="measurement-value">
                            {measurement.value?.toFixed(2)}{measurement.unit || '°'}
                          </td>
                          <td>{measurement.norm || '—'}</td>
                          <td className="measurement-interpretation">
                            {measurement.interpretation || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        );
      // Добавим кейс для биометрии в функцию renderModuleSpecific
      case 'biometry':
        return (
          <div className="module-specific biometry">
            {moduleData.data && (
              <>
                <h4>Биометрический анализ зубных рядов</h4>
                <div className="biometry-details">
                  <p><strong>Дата анализа:</strong> {moduleData.data.analysisDate}</p>
                  <p><strong>Пациент:</strong> {moduleData.data.patientName}</p>
                  <p><strong>Тип модели:</strong> {moduleData.data.modelType}</p>
                  {moduleData.data.source && (
                    <p><strong>Источник:</strong> {moduleData.data.source}</p>
                  )}
                </div>
                
                {moduleData.data.tonIndex !== null && (
                  <div className="biometry-section">
                    <h5>Индекс Тона</h5>
                    <table className="measurements-table">
                      <tbody>
                        <tr>
                          <td>Значение индекса Тона</td>
                          <td className="measurement-value">{moduleData.data.tonIndex.toFixed(2)}</td>
                          <td>Норма: 1.33</td>
                          <td className="measurement-interpretation">
                            {moduleData.data.tonInterpretation || '—'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                
                {moduleData.data.boltonAnalysis && moduleData.data.boltonAnalysis.anteriorRatio > 0 && (
                  <div className="biometry-section">
                    <h5>Анализ Болтона</h5>
                    <table className="measurements-table">
                      <thead>
                        <tr>
                          <th>Параметр</th>
                          <th>Значение</th>
                          <th>Норма</th>
                          <th>Интерпретация</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Соотношение передних зубов</td>
                          <td className="measurement-value">{moduleData.data.boltonAnalysis.anteriorRatio.toFixed(2)}%</td>
                          <td>77.2±1.65%</td>
                          <td className="measurement-interpretation">
                            {moduleData.data.boltonAnalysis.interpretation || '—'}
                          </td>
                        </tr>
                        {moduleData.data.boltonAnalysis.overallRatio > 0 && (
                          <tr>
                            <td>Общее соотношение</td>
                            <td className="measurement-value">{moduleData.data.boltonAnalysis.overallRatio.toFixed(2)}%</td>
                            <td>91.3±1.91%</td>
                            <td className="measurement-interpretation">Соотношение в норме</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {moduleData.data.pontAnalysis && moduleData.data.pontAnalysis.upperMolar?.actualWidth > 0 && (
                  <div className="biometry-section">
                    <h5>Анализ Пона</h5>
                    <table className="measurements-table">
                      <thead>
                        <tr>
                          <th>Область</th>
                          <th>Фактическая ширина</th>
                          <th>Нормальная ширина</th>
                          <th>Разница</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Верхние моляры</td>
                          <td className="measurement-value">{moduleData.data.pontAnalysis.upperMolar.actualWidth.toFixed(2)} мм</td>
                          <td>{moduleData.data.pontAnalysis.upperMolar.normalWidth.toFixed(2)} мм</td>
                          <td>{moduleData.data.pontAnalysis.upperMolar.difference.toFixed(2)} мм</td>
                        </tr>
                        <tr>
                          <td>Нижние моляры</td>
                          <td className="measurement-value">{moduleData.data.pontAnalysis.lowerMolar?.actualWidth.toFixed(2) || '0.00'} мм</td>
                          <td>{moduleData.data.pontAnalysis.lowerMolar?.normalWidth.toFixed(2) || '0.00'} мм</td>
                          <td>{moduleData.data.pontAnalysis.lowerMolar?.difference.toFixed(2) || '0.00'} мм</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                
                {moduleData.data.speeCurve && moduleData.data.speeCurve.depth > 0 && (
                  <div className="biometry-section">
                    <h5>Кривая Шпее</h5>
                    <table className="measurements-table">
                      <tbody>
                        <tr>
                          <td>Глубина кривой Шпее</td>
                          <td className="measurement-value">{moduleData.data.speeCurve.depth.toFixed(2)} мм</td>
                          <td>Норма: 1.5 мм</td>
                          <td className="measurement-interpretation">
                            {moduleData.data.speeCurve.interpretation || '—'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                
                {moduleData.data.toothMeasurements && (
                  <div className="biometry-section">
                    <h5>Измерения зубов (мм)</h5>
                    <div className="tooth-measurements-grid">
                      <div className="jaw-measurements">
                        <h6>Верхняя челюсть</h6>
                        <table className="tooth-table">
                          <tbody>
                            {Object.entries(moduleData.data.toothMeasurements.upperJaw || {}).map(([tooth, size]) => (
                              <tr key={tooth}>
                                <td>Зуб {tooth}</td>
                                <td className="measurement-value">{size} мм</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="jaw-measurements">
                        <h6>Нижняя челюсть</h6>
                        <table className="tooth-table">
                          <tbody>
                            {Object.entries(moduleData.data.toothMeasurements.lowerJaw || {}).map(([tooth, size]) => (
                              <tr key={tooth}>
                                <td>Зуб {tooth}</td>
                                <td className="measurement-value">{size} мм</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      
      default:
        return (
          <div className="module-data-raw">
            <h4>Сырые данные модуля:</h4>
            <pre>{JSON.stringify(moduleData, null, 2)}</pre>
          </div>
        );
    }
  };

  return (
    <div className="module-data-viewer">
      <div className="module-header">
        <h3>
          {moduleType === 'photometry' ? '📷 Фотометрия' : 
           moduleType === 'cephalometry' ? '🦴 Цефалометрия' :
           moduleType === 'biometry' ? '📐 Биометрия' :
           moduleType === 'ct' ? '🖥️ КТ анализ' : '📊 Модуль'}
        </h3>
        {moduleData.source && (
          <span className="module-source">
            Источник: {moduleData.source}
          </span>
        )}
        {moduleData.updatedAt && (
          <span className="module-updated">
            Обновлено: {new Date(moduleData.updatedAt).toLocaleString('ru-RU')}
          </span>
        )}
      </div>
      
      {renderModuleSpecific()}
      
      <div className="module-meta">
        <p><strong>ID пациента:</strong> {moduleData.data?.patientId || 'не указан'}</p>
        {moduleData.loadedAt && (
          <p><strong>Загружено:</strong> {new Date(moduleData.loadedAt).toLocaleString('ru-RU')}</p>
        )}
      </div>
    </div>
  );
};

export default ModuleDataViewer;