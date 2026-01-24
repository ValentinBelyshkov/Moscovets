const MedicalCardLoading = ({ patient, photoDataLoaded, biometryDataLoaded, cephalometryDataLoaded, modelingDataLoaded }) => {
  return (
    <div className="medical-card loading">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Загрузка медицинской карты...</p>
        <p className="loading-info">
          {patient
            ? `Пациент: ${patient.fullName}`
            : 'Загрузка интегрированных медицинских данных...'
          }
        </p>
        {photoDataLoaded && (
          <p className="loading-success">✓ Данные фотометрии загружены</p>
        )}
        {biometryDataLoaded && (
          <p className="loading-success">✓ Данные биометрии загружены</p>
        )}
        {cephalometryDataLoaded && (
          <p className="loading-success">✓ Данные цефалометрии загружены</p>
        )}
        {modelingDataLoaded && (
          <p className="loading-success">✓ Данные моделирования загружены</p>
        )}
      </div>
    </div>
  );
};

export default MedicalCardLoading;
