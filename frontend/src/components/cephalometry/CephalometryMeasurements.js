import React from 'react';

const CephalometryMeasurements = ({ measurements, onCalculate }) => {
  if (!measurements || Object.keys(measurements).length === 0) {
    return (
      <div className="mt-6 p-4 bg-gray-50 rounded border text-center">
        <p className="text-gray-600 mb-3">На расставленных точках можно рассчитать измерения</p>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={onCalculate}
        >
          Рассчитать измерения
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold mb-4">Результаты измерений</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-2 text-left">Параметр</th>
              <th className="px-4 py-2 text-left">Значение</th>
              <th className="px-4 py-2 text-left">Норма</th>
              <th className="px-4 py-2 text-left">Интерпретация</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(measurements).map(([key, m]) => (
              <tr key={key} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{m.name}</td>
                <td className="px-4 py-2">{m.value.toFixed(2)}{m.unit}</td>
                <td className="px-4 py-2 text-gray-600 text-sm">{m.norm || 'N/A'}</td>
                <td className={`px-4 py-2 text-sm ${m.interpretation === 'Норма' ? 'text-green-600' : 'text-amber-600'}`}>
                  {m.interpretation || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CephalometryMeasurements;
