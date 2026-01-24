const MedicalCardDiagnoses = ({ orthodonticData }) => {
  const diagnoses = orthodonticData?.diagnoses || [];

  // Группировка диагнозов по категориям
  const groupedDiagnoses = diagnoses.reduce((groups, diagnosis) => {
    const category = diagnosis.category || 'Другие';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(diagnosis);
    return groups;
  }, {});

  const categoryColors = {
    'Челюстно-лицевые': 'red',
    'Окклюзионные': 'orange',
    'Зубные ряды': 'yellow',
    'Другие': 'gray'
  };

  const severityColors = {
    'легкое': 'bg-green-100 text-green-800',
    'умеренная': 'bg-yellow-100 text-yellow-800',
    'тяжелая': 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-red-500">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
        <span>🏥</span> Диагнозы
      </h3>

      {diagnoses.length === 0 ? (
        <div className="bg-gray-100 p-6 rounded-lg text-center text-gray-600">
          Диагнозы не установлены
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedDiagnoses).map(([category, categoryDiagnoses]) => (
            <div
              key={category}
              className={`bg-${categoryColors[category] || 'gray'}-50 p-4 rounded-lg border border-${categoryColors[category] || 'gray'}-200`}
            >
              <h4 className="font-semibold text-gray-700 mb-3">{category}</h4>
              <div className="space-y-2">
                {categoryDiagnoses.map((diagnosis) => (
                  <div
                    key={diagnosis.id}
                    className="flex items-center justify-between p-3 bg-white rounded border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      {diagnosis.confirmed && (
                        <span className="text-green-600 font-bold">✓</span>
                      )}
                      <div>
                        <div className="font-medium text-gray-800">{diagnosis.diagnosis}</div>
                        {diagnosis.code && (
                          <div className="text-sm text-gray-500">Код МКБ: {diagnosis.code}</div>
                        )}
                      </div>
                    </div>
                    {diagnosis.severity && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${severityColors[diagnosis.severity]}`}>
                        {diagnosis.severity}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Статистика */}
      {diagnoses.length > 0 && (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-gray-700 mb-2">Сводка диагнозов</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{diagnoses.length}</div>
              <div className="text-sm text-gray-600">Всего диагнозов</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {diagnoses.filter(d => d.confirmed).length}
              </div>
              <div className="text-sm text-gray-600">Подтверждено</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {diagnoses.filter(d => d.severity === 'умеренная' || d.severity === 'тяжелая').length}
              </div>
              <div className="text-sm text-gray-600">Требуют лечения</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(groupedDiagnoses).length}
              </div>
              <div className="text-sm text-gray-600">Категорий</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalCardDiagnoses;
