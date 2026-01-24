const MedicalCardNoData = ({ patient, onLoadData }) => {
  return (
    <div className="medical-card no-data">
      <h2>📋 Медицинская карта</h2>
      <div className="no-data-message">
        <p>Нет данных для отображения медицинской карты</p>
        <button
          className="btn-primary"
          onClick={() => onLoadData(patient)}
        >
          Загрузить медицинские данные
        </button>
      </div>
    </div>
  );
};

export default MedicalCardNoData;
