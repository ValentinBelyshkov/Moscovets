import React from 'react';

const VisualizationControls = ({ 
  visualizationSettings, 
  handleVisualizationSetting, 
  biometryPlanes, 
  handleTogglePlane, 
  handleToggleAllPlanes 
}) => {
  return (
    <div className="visualization-controls p-5 bg-gray-50 rounded-lg mt-5">
      <h4 className="mt-0 mb-4 text-gray-800">👁️ Настройки визуализации</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        {/* Отображение элементов */}
        <div>
          <h5 className="text-sm mb-3 text-gray-600 font-medium">📊 Отображение:</h5>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={visualizationSettings.showDistances}
                onChange={(e) => handleVisualizationSetting('showDistances', e.target.checked)}
                className="w-4 h-4"
              />
              📏 Расстояния
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={visualizationSettings.showPoints}
                onChange={(e) => handleVisualizationSetting('showPoints', e.target.checked)}
                className="w-4 h-4"
              />
              🔴 Точки
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={visualizationSettings.showLabels}
                onChange={(e) => handleVisualizationSetting('showLabels', e.target.checked)}
                className="w-4 h-4"
              />
              🏷️ Метки
            </label>
          </div>
        </div>
        
        {/* Настройки точек */}
        <div>
          <h5 className="text-sm mb-3 text-gray-600 font-medium">📍 Точки:</h5>
          <div className="flex flex-col gap-2">
            <label className="text-sm">Тип точек:</label>
            <select
              value={visualizationSettings.pointType}
              onChange={(e) => handleVisualizationSetting('pointType', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="sphere">Сфера</option>
              <option value="cube">Куб</option>
              <option value="cylinder">Цилиндр</option>
              <option value="tetrahedron">Тетраэдр</option>
              <option value="pyramid">Пирамида</option>
            </select>
            
            <label className="text-sm mt-2">Размер точек:</label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={visualizationSettings.pointSize}
              onChange={(e) => handleVisualizationSetting('pointSize', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-center text-gray-500">
              {visualizationSettings.pointSize.toFixed(1)}x
            </div>
          </div>
        </div>
        
        {/* Настройки линий */}
        <div>
          <h5 className="text-sm mb-3 text-gray-600 font-medium">📏 Линии:</h5>
          <div className="flex flex-col gap-2">
            <label className="text-sm">Толщина линий:</label>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={visualizationSettings.lineWidth}
              onChange={(e) => handleVisualizationSetting('lineWidth', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-center text-gray-500">
              {visualizationSettings.lineWidth.toFixed(1)}px
            </div>
          </div>
        </div>
      </div>
      
      {/* ============ БИОМЕТРИЧЕСКИЕ ПЛОСКОСТИ ============ */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h5 className="text-sm m-0 text-gray-600 font-medium">📐 Биометрические плоскости</h5>
          <div className="flex gap-2">
            <button
              onClick={() => handleToggleAllPlanes(true)}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
            >
              Показать все
            </button>
            <button
              onClick={() => handleToggleAllPlanes(false)}
              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
            >
              Скрыть все
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-100 rounded">
          {Object.entries(biometryPlanes).map(([planeName, isVisible]) => (
            <label 
              key={planeName}
              className={`flex items-center gap-2 text-xs p-2 rounded ${
                isVisible ? 'bg-cyan-100 border border-cyan-500 text-cyan-800 font-medium' : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => handleTogglePlane(planeName)}
                className="w-4 h-4"
              />
              <span>{planeName}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VisualizationControls;