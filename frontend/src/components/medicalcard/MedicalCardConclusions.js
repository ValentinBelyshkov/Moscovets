const MedicalCardConclusions = ({ orthodonticData }) => {
  const data = orthodonticData?.conclusions || [];

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-indigo-500">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
        <span>📋</span> Выводы / Заключение
      </h3>

      {data.length === 0 ? (
        <div className="bg-gray-100 p-6 rounded-lg text-center text-gray-600 mb-6">
          Выводы не сформулированы
        </div>
      ) : (
        <div className="mb-6">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200 mb-4">
            <h4 className="font-semibold text-gray-700 mb-3 text-lg">Основные выводы:</h4>
            <div className="space-y-2">
              {data.map((conclusion, idx) => (
                <div key={idx} className="flex items-start p-3 bg-white rounded border border-gray-200">
                  <span className="bg-indigo-100 text-indigo-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
                    {idx + 1}
                  </span>
                  <span className="text-gray-700">{conclusion}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-gray-700 mb-3 text-lg">Выводы из образца презентации:</h4>
        <div className="space-y-2">
          <div className="flex items-start p-3 bg-white rounded border border-gray-200">
            <span className="bg-blue-100 text-blue-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
              1
            </span>
            <span className="text-gray-700">Скелетный I класс</span>
          </div>
          <div className="flex items-start p-3 bg-white rounded border border-gray-200">
            <span className="bg-blue-100 text-blue-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
              2
            </span>
            <span className="text-gray-700">Нейтральный тип роста</span>
          </div>
          <div className="flex items-start p-3 bg-white rounded border border-gray-200">
            <span className="bg-blue-100 text-blue-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
              3
            </span>
            <span className="text-gray-700">Высота нижней трети лица по Ricketts в норме</span>
          </div>
          <div className="flex items-start p-3 bg-white rounded border border-gray-200">
            <span className="bg-blue-100 text-blue-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
              4
            </span>
            <span className="text-gray-700">Ретрогнатия верхней и нижней челюстей</span>
          </div>
          <div className="flex items-start p-3 bg-white rounded border border-gray-200">
            <span className="bg-blue-100 text-blue-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
              5
            </span>
            <span className="text-gray-700">Глубокая резцовая окклюзия</span>
          </div>
          <div className="flex items-start p-3 bg-white rounded border border-gray-200">
            <span className="bg-blue-100 text-blue-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
              6
            </span>
            <span className="text-gray-700">Вертикальное резцовое перекрытие увеличено до 5.3 мм</span>
          </div>
          <div className="flex items-start p-3 bg-white rounded border border-gray-200">
            <span className="bg-blue-100 text-blue-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
              7
            </span>
            <span className="text-gray-700">Сагиттальное резцовое перекрытие в норме</span>
          </div>
          <div className="flex items-start p-3 bg-white rounded border border-gray-200">
            <span className="bg-blue-100 text-blue-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
              8
            </span>
            <span className="text-gray-700">Сужение верхнего и нижнего зубных рядов</span>
          </div>
          <div className="flex items-start p-3 bg-white rounded border border-gray-200">
            <span className="bg-blue-100 text-blue-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
              9
            </span>
            <span className="text-gray-700">Воздухоносные пути без патологий</span>
          </div>
          <div className="flex items-start p-3 bg-white rounded border border-gray-200">
            <span className="bg-blue-100 text-blue-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
              10
            </span>
            <span className="text-gray-700">Асимметрия положения ВНЧС</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalCardConclusions;
