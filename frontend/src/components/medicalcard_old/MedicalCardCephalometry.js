import { useState } from 'react';

const MedicalCardCephalometry = ({ orthodonticData }) => {
  const [activeTab, setActiveTab] = useState('lateralTRG');
  const data = orthodonticData?.cephalometry || {};

  const tabs = [
    { id: 'lateralTRG', label: 'Боковая ТРГ', icon: '📐' },
    { id: 'frontalTRG', label: 'Прямая ТРГ', icon: '🦴' }
  ];

  const currentData = data[activeTab] || {};

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-pink-500">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
        <span>🦴</span> Цефалометрический анализ
      </h3>

      {/* Вкладки */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-2 rounded-lg transition duration-300 flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-pink-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Боковая ТРГ */}
      {activeTab === 'lateralTRG' && (
        <div className="space-y-4">
          {/* Скелетный класс */}
          {currentData.skeletalClass && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-700 mb-2">Скелетный класс</h4>
              <p className="text-xl font-bold text-blue-800">{currentData.skeletalClass}</p>
            </div>
          )}

          {/* Угловые параметры */}
          {currentData.parameters && Object.keys(currentData.parameters).length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">Угловые параметры</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(currentData.parameters).map(([param, values]) => (
                  <div
                    key={param}
                    className={`p-3 rounded border ${
                      values.interpretation === 'Норма' || values.interpretation?.includes('Норма')
                        ? 'bg-green-100 border-green-300'
                        : 'bg-red-100 border-red-300'
                    }`}
                  >
                    <div className="font-bold text-gray-800">{param}</div>
                    <div className="text-2xl font-bold text-gray-700">{values.value}°</div>
                    <div className="text-xs text-gray-500">Норма: {values.norm}</div>
                    <div className="text-sm font-medium text-gray-600">{values.interpretation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Положение челюстей */}
          {currentData.jawPositions && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">Положение челюстей</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded border border-gray-200">
                  <div className="font-medium text-gray-700 mb-2">Верхняя челюсть</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Положение:</span>
                      <span className="font-medium">{currentData.jawPositions.maxilla?.position}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Наклон:</span>
                      <span className="font-medium">{currentData.jawPositions.maxilla?.inclination}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded border border-gray-200">
                  <div className="font-medium text-gray-700 mb-2">Нижняя челюсть</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Положение:</span>
                      <span className="font-medium">{currentData.jawPositions.mandible?.position}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Наклон:</span>
                      <span className="font-medium">{currentData.jawPositions.mandible?.inclination}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Вертикальные параметры */}
          {currentData.verticalParameters && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">Вертикальные параметры</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded border border-gray-200">
                  <div className="text-sm text-gray-600">Лицевой индекс</div>
                  <div className="text-lg font-bold text-blue-600">
                    {(currentData.verticalParameters.facialRatio * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="bg-white p-3 rounded border border-gray-200">
                  <div className="text-sm text-gray-600">Высота нижней трети лица</div>
                  <div className="text-base font-medium text-gray-700">
                    {currentData.verticalParameters.lowerFaceHeight}
                  </div>
                </div>

                {currentData.verticalParameters.ODI && (
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <div className="text-sm text-gray-600">ODI</div>
                    <div className="text-lg font-bold text-green-600">
                      {currentData.verticalParameters.ODI.value}°
                    </div>
                    <div className="text-xs text-gray-500">Норма: {currentData.verticalParameters.ODI.norm}</div>
                    <div className="text-sm font-medium text-gray-600">
                      {currentData.verticalParameters.ODI.interpretation}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Изображение ТРГ */}
          {data.images?.lateralTRG && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">Изображение</h4>
              <img
                src={data.images.lateralTRG}
                alt="Lateral TRG"
                className="max-w-full h-auto rounded-lg border border-gray-300"
              />
            </div>
          )}
        </div>
      )}

      {/* Прямая ТРГ */}
      {activeTab === 'frontalTRG' && (
        <div className="space-y-4">
          {/* Симметрия */}
          {currentData.symmetry && (
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-gray-700 mb-2">Симметрия</h4>
              <p className="text-xl font-bold text-orange-800">{currentData.symmetry}</p>
              {currentData.chinDeviation && (
                <p className="text-lg text-gray-700 mt-2">{currentData.chinDeviation}</p>
              )}
            </div>
          )}

          {/* Измерения */}
          {currentData.measurements && Object.keys(currentData.measurements).length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">Измерения</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(currentData.measurements).map(([name, values]) => (
                  <div
                    key={name}
                    className={`p-3 rounded border ${
                      values.interpretation === 'Норма'
                        ? 'bg-green-100 border-green-300'
                        : 'bg-red-100 border-red-300'
                    }`}
                  >
                    <div className="font-bold text-gray-800">{name}</div>
                    <div className="text-2xl font-bold text-gray-700">{values.value} мм</div>
                    <div className="text-xs text-gray-500">Норма: {values.norm}</div>
                    <div className="text-sm font-medium text-gray-600">{values.interpretation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Изображение ТРГ */}
          {data.images?.frontalTRG && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">Изображение</h4>
              <img
                src={data.images.frontalTRG}
                alt="Frontal TRG"
                className="max-w-full h-auto rounded-lg border border-gray-300"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicalCardCephalometry;
