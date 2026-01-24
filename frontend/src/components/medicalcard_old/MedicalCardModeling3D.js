import { useState } from 'react';

const MedicalCardModeling3D = ({ orthodonticData, modeling3DModels }) => {
  const [activeTab, setActiveTab] = useState('skull');
  const data = orthodonticData?.modeling3D || {};

  const tabs = [
    { id: 'skull', label: 'Череп', icon: '💀' },
    { id: 'maxilla', label: 'Верхняя челюсть', icon: '🦷' },
    { id: 'mandible', label: 'Нижняя челюсть', icon: '🦷' },
    { id: 'setup', label: 'Setup', icon: '⚙️' }
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-violet-500">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
        <span>🖥️</span> 3D Моделирование
      </h3>

      {/* Вкладки */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-2 rounded-lg transition duration-300 flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-violet-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Информация о моделях */}
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-3">Доступные модели</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
              <span className="text-gray-700">3D модель черепа</span>
              <span className={`font-medium ${data.skullModel ? 'text-green-600' : 'text-gray-400'}`}>
                {data.skullModel || 'не загружена'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
              <span className="text-gray-700">3D модель верхней челюсти</span>
              <span className={`font-medium ${data.maxillaModel ? 'text-green-600' : 'text-gray-400'}`}>
                {data.maxillaModel || 'не загружена'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
              <span className="text-gray-700">3D модель нижней челюсти</span>
              <span className={`font-medium ${data.mandibleModel ? 'text-green-600' : 'text-gray-400'}`}>
                {data.mandibleModel || 'не загружена'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
              <span className="text-gray-700">Setup-модель</span>
              <span className={`font-medium ${data.setupModel ? 'text-green-600' : 'text-gray-400'}`}>
                {data.setupModel || 'не загружена'}
              </span>
            </div>
          </div>
        </div>

        {/* Симуляции */}
        {data.simulations && data.simulations.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-700 mb-3">Доступные симуляции</h4>
            <div className="flex flex-wrap gap-2">
              {data.simulations.map((sim, idx) => (
                <span key={idx} className="bg-white px-3 py-1 rounded-full text-sm text-gray-700 border border-blue-300">
                  {sim}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Детальные данные моделирования */}
        {orthodonticData?.modeling3D?.detailedModeling && (
          <div className="bg-violet-50 p-4 rounded-lg border border-violet-200">
            <h4 className="font-semibold text-gray-700 mb-3">Детальные данные моделирования</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Модели */}
              {Object.entries(modeling3DModels || {}).map(([modelKey, modelValue]) => (
                <div key={modelKey} className="bg-white p-3 rounded border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">
                    {modelKey === 'skull' ? 'Череп' :
                     modelKey === 'maxilla' ? 'Верхняя челюсть' :
                     modelKey === 'mandible' ? 'Нижняя челюсть' :
                     modelKey === 'setup' ? 'Setup' : modelKey}
                  </div>
                  {modelValue ? (
                    <div className="text-green-600 font-medium">✓ Модель доступна</div>
                  ) : (
                    <div className="text-gray-400">Не загружена</div>
                  )}
                </div>
              ))}
            </div>

            {/* Симуляции */}
            {orthodonticData.modeling3D.detailedModeling.simulations && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-700 mb-2">Симуляции</h5>
                <pre className="bg-white p-3 rounded border border-gray-200 text-xs overflow-auto">
                  {JSON.stringify(orthodonticData.modeling3D.detailedModeling.simulations, null, 2)}
                </pre>
              </div>
            )}

            {/* План лечения */}
            {orthodonticData.modeling3D.detailedModeling.treatmentPlan && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-700 mb-2">План лечения</h5>
                <pre className="bg-white p-3 rounded border border-gray-200 text-xs overflow-auto">
                  {JSON.stringify(orthodonticData.modeling3D.detailedModeling.treatmentPlan, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalCardModeling3D;
