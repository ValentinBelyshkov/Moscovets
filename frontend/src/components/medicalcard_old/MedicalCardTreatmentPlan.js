const MedicalCardTreatmentPlan = ({ orthodonticData }) => {
  const data = orthodonticData?.treatmentPlan || {};

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6 border-l-4 border-amber-500">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
        <span>📋</span> План лечения
      </h3>

      <div className="space-y-6">
        {/* Общая информация */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-700 mb-2">Сложность лечения</h4>
            <p className="text-2xl font-bold text-blue-800">{data.complexity || 'Не указана'}</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-gray-700 mb-2">Ожидаемая длительность</h4>
            <p className="text-2xl font-bold text-green-800">{data.estimatedDuration || 'Не указана'}</p>
          </div>
        </div>

        {/* Цели лечения */}
        {data.objectives && data.objectives.length > 0 && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-gray-700 mb-3">Цели лечения</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.objectives.map((objective, idx) => (
                <div key={idx} className="flex items-start p-2 bg-white rounded border border-gray-200">
                  <span className="bg-purple-100 text-purple-800 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0 text-sm">
                    {idx + 1}
                  </span>
                  <span className="text-gray-700">{objective}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Этапы лечения */}
        {data.phases && data.phases.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Этапы лечения</h4>
            <div className="space-y-4">
              {data.phases.map((phase) => (
                <div
                  key={phase.phase}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative"
                >
                  {/* Номер этапа */}
                  <div className="absolute -left-2 -top-2 bg-amber-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                    {phase.phase}
                  </div>

                  <div className="ml-6">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-semibold text-gray-800 text-lg">{phase.name}</h5>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {phase.duration}
                      </span>
                    </div>

                    {phase.procedures && phase.procedures.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm text-gray-600 mb-2">Процедуры:</div>
                        <ul className="space-y-1">
                          {phase.procedures.map((procedure, idx) => (
                            <li key={idx} className="flex items-start text-gray-700">
                              <span className="text-blue-500 mr-2">•</span>
                              {procedure}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Планируемая аппаратура */}
        {data.appliances && data.appliances.length > 0 && (
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-gray-700 mb-3">Планируемая аппаратура</h4>
            <div className="flex flex-wrap gap-2">
              {data.appliances.map((appliance, idx) => (
                <span
                  key={idx}
                  className="bg-white px-4 py-2 rounded-lg text-gray-700 border border-amber-300 shadow-sm"
                >
                  {appliance}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Ретенционный план */}
        {data.retention && data.retention.length > 0 && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-gray-700 mb-3">Ретенционный план</h4>
            <ul className="space-y-2">
              {data.retention.map((item, idx) => (
                <li key={idx} className="flex items-start text-gray-700">
                  <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 text-xs">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Статистика */}
        {data.phases && data.phases.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-700 mb-3">Статистика плана лечения</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{data.phases.length}</div>
                <div className="text-sm text-gray-600">Этапов лечения</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {data.phases.reduce((sum, phase) => sum + (phase.procedures?.length || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Процедур</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {data.appliances?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Видов аппаратуры</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {data.objectives?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Целей лечения</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalCardTreatmentPlan;
