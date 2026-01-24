const MedicalCardPersonalData = ({ orthodonticData }) => {
  const data = orthodonticData?.personalData || {};

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-blue-500">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
        <span>👤</span> Персональные данные
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">ФИО пациента:</label>
            <p className="text-lg font-semibold text-gray-800">{data.fullName || 'Не указано'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Дата рождения:</label>
            <p className="text-gray-800">{data.birthDate || 'Не указано'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Возраст:</label>
            <p className="text-gray-800">{data.age || 'Не указано'} лет</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Дата исследования:</label>
            <p className="text-gray-800">{data.examinationDate || 'Не указано'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Врач:</label>
            <p className="text-gray-800">{data.doctor || 'Не указан'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Жалобы:</label>
            <p className="text-gray-800">{data.complaints || 'Не указаны'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalCardPersonalData;
