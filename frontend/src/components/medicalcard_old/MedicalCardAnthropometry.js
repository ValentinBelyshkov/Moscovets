const MedicalCardAnthropometry = ({ orthodonticData }) => {
  const data = orthodonticData?.anthropometry || {};

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-purple-500">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
        <span>📐</span> Антропометрия / Биометрия
      </h3>

      {/* Размеры челюстей */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">Размеры челюстей</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h5 className="font-medium text-gray-700 mb-3">Верхняя челюсть</h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Ширина:</span>
                <span className="font-medium">{data.jawDimensions?.maxillaryWidth || 0} мм</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Основание:</span>
                <span className="font-medium">{data.jawDimensions?.maxillaryBase || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h5 className="font-medium text-gray-700 mb-3">Нижняя челюсть</h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Ширина:</span>
                <span className="font-medium">{data.jawDimensions?.mandibularWidth || 0} мм</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Основание:</span>
                <span className="font-medium">{data.jawDimensions?.mandibularBase || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Индексы */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">Индексы</h4>
        <div className="space-y-4">
          {/* Индекс Тона */}
          {data.indices?.tonIndex && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-700">Индекс Тона</h5>
                  <p className="text-sm text-gray-500">Соотношение сумм мезиодистальных размеров зубов верхней и нижней челюсти</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.indices.tonIndex.value?.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Норма: {data.indices.tonIndex.norm}</div>
                  <div className={`text-sm font-medium ${data.indices.tonIndex.interpretation === 'Норма' ? 'text-green-600' : 'text-orange-600'}`}>
                    {data.indices.tonIndex.interpretation}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Анализ Болтона */}
          {data.indices?.boltonAnalysis && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium text-gray-700 mb-3">Анализ Болтона</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Передний сегмент */}
                <div className="bg-white p-3 rounded border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Передний сегмент</div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600">
                      {data.indices.boltonAnalysis.anterior?.ratio?.toFixed(1)}%
                    </span>
                    <div className="text-right text-sm">
                      <div className="text-gray-500">{data.indices.boltonAnalysis.anterior?.norm}</div>
                      <div className="text-green-600">{data.indices.boltonAnalysis.anterior?.interpretation}</div>
                    </div>
                  </div>
                </div>

                {/* Общий сегмент */}
                <div className="bg-white p-3 rounded border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Общий сегмент</div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600">
                      {data.indices.boltonAnalysis.overall?.ratio?.toFixed(1)}%
                    </span>
                    <div className="text-right text-sm">
                      <div className="text-gray-500">{data.indices.boltonAnalysis.overall?.norm}</div>
                      <div className="text-green-600">{data.indices.boltonAnalysis.overall?.interpretation}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Размеры зубов */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">Размеры зубов</h4>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700">{data.toothSizes || 'Соответствуют норме'}</p>
        </div>
      </div>

      {/* Детальная биометрия (если есть реальные данные) */}
      {data.detailedBiometry && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h4 className="font-semibold text-gray-700 mb-3">Детальные данные биометрии</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Индексы */}
            {data.detailedBiometry.tonIndex !== null && (
              <div className="bg-white p-3 rounded border border-gray-200">
                <div className="text-sm text-gray-600">Индекс Тона</div>
                <div className="text-lg font-bold text-purple-600">
                  {data.detailedBiometry.tonIndex.toFixed(2)}
                </div>
                {data.detailedBiometry.tonInterpretation && (
                  <div className="text-sm text-gray-500">{data.detailedBiometry.tonInterpretation}</div>
                )}
              </div>
            )}

            {/* Анализ Понта */}
            {data.detailedBiometry.pontAnalysis && (
              <div className="bg-white p-3 rounded border border-gray-200">
                <div className="text-sm text-gray-600">Анализ Понта</div>
                <div className="text-sm text-gray-500 mt-1">
                  {data.detailedBiometry.pontAnalysis.interpretation || 'Выполнен'}
                </div>
              </div>
            )}

            {/* Анализ Коркхауза */}
            {data.detailedBiometry.korkhausAnalysis && (
              <div className="bg-white p-3 rounded border border-gray-200">
                <div className="text-sm text-gray-600">Анализ Коркхауза</div>
                <div className="text-sm text-gray-500 mt-1">
                  {data.detailedBiometry.korkhausAnalysis.interpretation || 'Выполнен'}
                </div>
              </div>
            )}

            {/* Кривая Шпее */}
            {data.detailedBiometry.speeCurve && (
              <div className="bg-white p-3 rounded border border-gray-200">
                <div className="text-sm text-gray-600">Кривая Шпее</div>
                <div className="text-sm text-gray-500 mt-1">
                  {data.detailedBiometry.speeCurve.value || data.detailedBiometry.speeCurve.interpretation || 'Оценена'}
                </div>
              </div>
            )}
          </div>

          {/* Измерения зубов */}
          {data.detailedBiometry.toothMeasurements && (
            <div className="mt-4">
              <h5 className="font-medium text-gray-700 mb-2">Измерения зубов</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Верхняя челюсть:</div>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <pre className="text-xs text-gray-700 overflow-auto">
                      {JSON.stringify(data.detailedBiometry.toothMeasurements.upperJaw, null, 2)}
                    </pre>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">Нижняя челюсть:</div>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <pre className="text-xs text-gray-700 overflow-auto">
                      {JSON.stringify(data.detailedBiometry.toothMeasurements.lowerJaw, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicalCardAnthropometry;
