const MedicalCardCTAnalysis = ({ orthodonticData, ctImages }) => {
  const data = orthodonticData?.ctAnalysis || {};

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-teal-500">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
        <span>🏥</span> КТ анализ
      </h3>

      <div className="space-y-4">
        {/* ОПТГ */}
        {data.optg && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">ОПТГ (ортопантомограмма)</h4>
            <div className="space-y-2">
              {data.optg.findings && (
                <div className="flex items-start">
                  <span className="text-gray-600 mr-2">Находки:</span>
                  <span className="text-gray-800">{data.optg.findings}</span>
                </div>
              )}
              {data.optg.comments && (
                <div className="flex items-start">
                  <span className="text-gray-600 mr-2">Комментарии:</span>
                  <span className="text-gray-800">{data.optg.comments}</span>
                </div>
              )}
            </div>
            {ctImages?.optg && (
              <img
                src={ctImages.optg}
                alt="OPTG"
                className="mt-3 max-w-full h-auto rounded-lg border border-gray-300"
              />
            )}
          </div>
        )}

        {/* ВНЧС */}
        {data.tmj && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">ВНЧС (височно-нижнечелюстной сустав)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded border border-gray-200">
                <div className="text-sm text-gray-600">Правый сустав</div>
                <div className="text-base font-medium text-gray-800">{data.tmj.right}</div>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <div className="text-sm text-gray-600">Левый сустав</div>
                <div className="text-base font-medium text-gray-800">{data.tmj.left}</div>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <div className="text-sm text-gray-600">Симметрия</div>
                <div className="text-base font-medium text-gray-800">{data.tmj.symmetry}</div>
              </div>
            </div>
            {ctImages?.tmj && (
              <img
                src={ctImages.tmj}
                alt="TMJ"
                className="mt-3 max-w-full h-auto rounded-lg border border-gray-300"
              />
            )}
          </div>
        )}

        {/* Аксиальные срезы */}
        {data.axialCuts && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">Аксиальные срезы</h4>
            <div className="space-y-2">
              {data.axialCuts.tonguePosition && (
                <div className="flex items-start">
                  <span className="text-gray-600 mr-2">Положение языка:</span>
                  <span className="text-gray-800">{data.axialCuts.tonguePosition}</span>
                </div>
              )}
              {data.axialCuts.airway && (
                <div className="flex items-start">
                  <span className="text-gray-600 mr-2">Воздухоносные пути:</span>
                  <span className="text-gray-800">{data.axialCuts.airway}</span>
                </div>
              )}
              {data.axialCuts.comments && (
                <div className="flex items-start">
                  <span className="text-gray-600 mr-2">Комментарии:</span>
                  <span className="text-gray-800">{data.axialCuts.comments}</span>
                </div>
              )}
            </div>
            {ctImages?.axialCuts && (
              <img
                src={ctImages.axialCuts}
                alt="Axial cuts"
                className="mt-3 max-w-full h-auto rounded-lg border border-gray-300"
              />
            )}
          </div>
        )}

        {/* Структура костной ткани */}
        {data.boneStructure && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">Структура костной ткани</h4>
            <p className="text-gray-800">{data.boneStructure}</p>
          </div>
        )}

        {/* Детальные данные КТ */}
        {orthodonticData?.ctAnalysis?.detailedCT && (
          <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
            <h4 className="font-semibold text-gray-700 mb-3">Детальные данные КТ</h4>

            {/* Измерения */}
            {orthodonticData.ctAnalysis.detailedCT.measurements && (
              <div className="mb-4">
                <h5 className="font-medium text-gray-700 mb-2">Измерения</h5>
                <pre className="bg-white p-3 rounded border border-gray-200 text-xs overflow-auto">
                  {JSON.stringify(orthodonticData.ctAnalysis.detailedCT.measurements, null, 2)}
                </pre>
              </div>
            )}

            {/* Находки */}
            {orthodonticData.ctAnalysis.detailedCT.findings && orthodonticData.ctAnalysis.detailedCT.findings.length > 0 && (
              <div className="mb-4">
                <h5 className="font-medium text-gray-700 mb-2">Находки</h5>
                <ul className="list-disc pl-5 space-y-1">
                  {orthodonticData.ctAnalysis.detailedCT.findings.map((finding, idx) => (
                    <li key={idx} className="text-gray-700">{finding}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Диагнозы */}
            {orthodonticData.ctAnalysis.detailedCT.diagnoses && orthodonticData.ctAnalysis.detailedCT.diagnoses.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Диагнозы</h5>
                <ul className="list-disc pl-5 space-y-1">
                  {orthodonticData.ctAnalysis.detailedCT.diagnoses.map((diagnosis, idx) => (
                    <li key={idx} className="text-gray-700">{diagnosis}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalCardCTAnalysis;
