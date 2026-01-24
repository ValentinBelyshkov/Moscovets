import React from 'react';

const SlideContent = ({ slide }) => {
  const { type, content } = slide;

  switch (type) {
    case 'title':
      return (
        <div className="content-title-page">
          <div className="title-decoration"></div>
          <h1>{content.patientName}</h1>
          <div className="subtitle">Клинический случай: Ортодонтия</div>
          <div className="patient-details">
            <div className="detail-item">
              <span className="label">Дата рождения:</span>
              <span className="value">{content.birthDate}</span>
            </div>
            <div className="detail-item">
              <span className="label">Возраст:</span>
              <span className="value">{content.age}</span>
            </div>
            <div className="detail-item">
              <span className="label">Дата обследования:</span>
              <span className="value">{content.examinationDate}</span>
            </div>
            <div className="detail-item">
              <span className="label">Лечащий врач:</span>
              <span className="value">{content.doctor}</span>
            </div>
          </div>
        </div>
      );

    case 'anamnesis':
      return (
        <div className="content-anamnesis">
          <div className="anamnesis-grid">
            <div className="anamnesis-card">
              <h3>Общие данные</h3>
              <ul>
                <li><strong>Рождение:</strong> {content.birthType}</li>
                <li><strong>Вскармливание:</strong> {content.feedingType?.type}</li>
                <li><strong>Смена зубов:</strong> с {content.teethChangeYears} лет</li>
                <li><strong>Общее состояние:</strong> {content.generalHealth}</li>
              </ul>
            </div>
            <div className="anamnesis-card">
              <h3>Жалобы</h3>
              <p className="complaints-text">{content.personalInfo?.complaints || 'Эстетический дефект'}</p>
            </div>
          </div>
        </div>
      );

    case 'frontal_photos':
    case 'profile_photos':
      return (
        <div className="content-photos">
          <div className="photos-row">
            {(content.photos || []).map((p, i) => (
              <div key={i} className="photo-item">
                <div className="photo-placeholder">
                  <span>{p}</span>
                </div>
              </div>
            ))}
          </div>
          {content.analysis && (
            <div className="photo-analysis-box">
              <h4>Клинический анализ</h4>
              <p>{content.analysis.comments}</p>
            </div>
          )}
        </div>
      );

    case 'diagnosis':
      return (
        <div className="content-diagnosis">
          <div className="diagnosis-list">
            {(content.diagnoses || []).map((d, i) => (
              <div key={i} className="diagnosis-item">
                <span className="diag-code">{d.code}</span>
                <span className="diag-text">{d.diagnosis}</span>
                <span className="diag-severity">{d.severity}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'lateral_trg':
      return (
        <div className="content-trg">
          <div className="trg-header">
            <strong>Скелетный класс:</strong> {content.skeletalClass}
          </div>
          <table className="trg-table">
            <thead>
              <tr>
                <th>Параметр</th>
                <th>Значение</th>
                <th>Норма</th>
                <th>Интерпретация</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(content.parameters || {}).map(([key, val], i) => (
                <tr key={i}>
                  <td>{key}</td>
                  <td>{val.value}</td>
                  <td>{val.norm}</td>
                  <td>{val.interpretation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'airway':
    case 'optg':
      return (
        <div className="content-media">
          <div className="media-placeholder">
            [ИЗОБРАЖЕНИЕ: {type === 'airway' ? 'Воздухоносные пути' : 'ОПТГ'}]
          </div>
          <div className="media-caption">
            {content.findings || content.airwayStatus || 'Патологий не выявлено'}
          </div>
        </div>
      );

    case 'conclusions':
      return (
        <div className="content-conclusions">
          <div className="conclusions-container">
            {(content.conclusions || []).map((c, i) => (
              <div key={i} className="conclusion-tag">{c}</div>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div className="content-default">
          <div className="placeholder-illustration">
            <div className="icon">📊</div>
            <p>Визуализация данных для типа <strong>{type}</strong></p>
          </div>
          <div className="data-preview-mock">
            <div className="mock-line"></div>
            <div className="mock-line short"></div>
            <div className="mock-line"></div>
          </div>
        </div>
      );
  }
};

export default SlideContent;
