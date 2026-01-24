const MedicalCardAnamnesis = ({ orthodonticData }) => {
  const data = orthodonticData?.anamnesis || {};

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-green-500">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
        <span>📋</span> Анамнез
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Пренатальный период */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-3">Пренатальный период</h4>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600">Осложнения беременности:</span>
              <span className="ml-2 text-gray-800">
                {data.pregnancyIssues?.trimester || 'нет'}
                {data.pregnancyIssues?.details && ` (${data.pregnancyIssues.details})`}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Тип родов:</span>
              <span className="ml-2 text-gray-800">{data.birthType || 'Не указано'}</span>
            </div>
          </div>
        </div>

        {/* Раннее развитие */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-3">Раннее развитие</h4>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600">Вскормление:</span>
              <span className="ml-2 text-gray-800">
                {data.feedingType?.type || 'Не указано'}
                {data.feedingType?.artificialFrom && ` с ${data.feedingType.artificialFrom} мес.`}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Первые зубы:</span>
              <span className="ml-2 text-gray-800">{data.firstTeethMonths || 'Не указано'} мес.</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Смена зубов:</span>
              <span className="ml-2 text-gray-800">{data.teethChangeYears || 'Не указано'} лет</span>
            </div>
          </div>
        </div>

        {/* Вредные привычки */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-3">Вредные привычки</h4>
          {data.badHabits?.exists ? (
            <ul className="list-disc pl-5 space-y-1">
              {data.badHabits.habits.map((habit, idx) => (
                <li key={idx} className="text-gray-700">{habit}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">Не выявлены</p>
          )}
        </div>

        {/* Семейный анамнез */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-3">Семейный анамнез</h4>
          {data.familyAnomalies?.exists ? (
            <ul className="list-disc pl-5 space-y-1">
              {data.familyAnomalies.relatives.map((relative, idx) => (
                <li key={idx} className="text-gray-700">{relative}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">Нет сведений о наследственных аномалиях</p>
          )}
        </div>

        {/* Перенесенные заболевания */}
        {data.pastDiseases?.exists && (
          <div className="bg-red-50 p-4 rounded-lg md:col-span-2">
            <h4 className="font-semibold text-gray-700 mb-3">Перенесенные заболевания</h4>
            <ul className="list-disc pl-5 space-y-1">
              {data.pastDiseases.diseases.map((disease, idx) => (
                <li key={idx} className="text-gray-700">{disease}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Предыдущее ортодонтическое лечение */}
        {data.previousOrthoTreatment?.exists && (
          <div className="bg-blue-50 p-4 rounded-lg md:col-span-2">
            <h4 className="font-semibold text-gray-700 mb-3">Предыдущее ортодонтическое лечение</h4>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Длительность:</span> {data.previousOrthoTreatment.duration}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Аппаратура:</span>
              </p>
              <ul className="list-disc pl-5">
                {data.previousOrthoTreatment.appliances.map((appliance, idx) => (
                  <li key={idx}>{appliance}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Общее здоровье */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-3">Общее здоровье</h4>
          <p className="text-gray-700">{data.generalHealth || 'Не указано'}</p>
        </div>

        {/* Гигиена */}
        <div className="bg-cyan-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-3">Гигиена полости рта</h4>
          <p className="text-gray-700">{data.hygiene || 'Не указано'}</p>
        </div>
      </div>
    </div>
  );
};

export default MedicalCardAnamnesis;
