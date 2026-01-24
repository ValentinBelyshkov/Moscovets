const MedicalCardIntraoralAnalysis = ({ orthodonticData }) => {
  const data = orthodonticData?.intraoralAnalysis || {};

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-orange-500">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
        <span>🦷</span> Внутриротовой анализ
      </h3>

      {/* Окклюзия */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">Окклюзионные соотношения</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Сагиттальные соотношения */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h5 className="font-medium text-gray-700 mb-3">Сагиттальные</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Моляры справа:</span>
                <span className="font-medium">{data.occlusion?.sagittal?.molarsRight || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Моляры слева:</span>
                <span className="font-medium">{data.occlusion?.sagittal?.molarsLeft || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Клыки справа:</span>
                <span className="font-medium">{data.occlusion?.sagittal?.caninesRight || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Клыки слева:</span>
                <span className="font-medium">{data.occlusion?.sagittal?.caninesLeft || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Резцовое соотношение:</span>
                <span className="font-medium">{data.occlusion?.sagittal?.incisorRelationship || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Сагиттальная щель:</span>
                <span className="font-medium">{data.occlusion?.sagittal?.sagittalGap || 0} мм</span>
              </div>
            </div>
          </div>

          {/* Вертикальные соотношения */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h5 className="font-medium text-gray-700 mb-3">Вертикальные</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Передняя окклюзия:</span>
                <span className="font-medium">{data.occlusion?.vertical?.anterior || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Глубокая окклюзия:</span>
                <span className="font-medium">{data.occlusion?.vertical?.deepOcclusion || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Вертикальное перекрытие:</span>
                <span className="font-medium">{data.occlusion?.vertical?.verticalOverlap || 0} мм</span>
              </div>
              <div className="mt-2 pt-2 border-t border-green-300">
                <div className="flex justify-between">
                  <span className="text-gray-600">Норма:</span>
                  <span className="text-gray-500">{data.occlusion?.vertical?.norm || '2.5 мм ± 2.0 мм'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Трансверзальные соотношения */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h5 className="font-medium text-gray-700 mb-3">Трансверзальные</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Смещение срединной линии:</span>
                <span className="font-medium">{data.occlusion?.transversal?.midlineShift || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Перекрестный прикус:</span>
                <span className="font-medium">{data.occlusion?.transversal?.crossbite || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Щечная окклюзия:</span>
                <span className="font-medium">{data.occlusion?.transversal?.buccalOcclusion || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Язычная окклюзия:</span>
                <span className="font-medium">{data.occlusion?.transversal?.lingualOcclusion || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Зубная формула */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">Зубная формула (ширина зубов, мм)</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Верхняя челюсть */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-700 mb-3 text-center">Верхняя челюсть</h5>
            <div className="grid grid-cols-6 gap-2 text-center text-sm">
              {Object.entries(data.dentalFormula?.upperJaw || {}).map(([tooth, width]) => (
                <div key={tooth} className="bg-white p-2 rounded border border-gray-300">
                  <div className="font-bold text-gray-800">{tooth}</div>
                  <div className="text-blue-600">{width} мм</div>
                </div>
              ))}
            </div>
          </div>

          {/* Нижняя челюсть */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-700 mb-3 text-center">Нижняя челюсть</h5>
            <div className="grid grid-cols-6 gap-2 text-center text-sm">
              {Object.entries(data.dentalFormula?.lowerJaw || {}).map(([tooth, width]) => (
                <div key={tooth} className="bg-white p-2 rounded border border-gray-300">
                  <div className="font-bold text-gray-800">{tooth}</div>
                  <div className="text-green-600">{width} мм</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Комментарии */}
      {data.comments && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-gray-700 mb-2">Комментарий:</h4>
          <p className="text-gray-700">{data.comments}</p>
        </div>
      )}
    </div>
  );
};

export default MedicalCardIntraoralAnalysis;
