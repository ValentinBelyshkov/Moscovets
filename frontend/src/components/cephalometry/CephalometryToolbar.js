import React from 'react';

const CephalometryToolbar = ({ 
  activeTool, 
  setActiveTool, 
  cephalometryData, 
  setCephalometryData,
  imagesUploaded,
  onSave,
  onExportPDF,
  onExportPPTX,
  onQuickSave
}) => {
  return (
    <div className="cephalometry-toolbar bg-white p-3 rounded shadow-sm mb-4 flex flex-wrap gap-3 items-center justify-between">
      <div className="flex gap-2">
        <button 
          className={`px-4 py-2 rounded ${activeTool === 'select' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setActiveTool('select')}
          title="Выбрать и переместить точку"
        >
          <span className="mr-2">🖱️</span> Выбор
        </button>
        <button 
          className={`px-4 py-2 rounded ${activeTool === 'point' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setActiveTool('point')}
          disabled={!imagesUploaded || cephalometryData.scale <= 1}
          title={cephalometryData.scale <= 1 ? "Сначала установите масштаб" : "Расставить точки"}
        >
          <span className="mr-2">📍</span> Точки
        </button>
        <button 
          className={`px-4 py-2 rounded ${activeTool === 'scale' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setActiveTool('scale')}
          disabled={!imagesUploaded}
          title="Установить масштаб (линейка)"
        >
          <span className="mr-2">📏</span> Масштаб
        </button>
      </div>

      <div className="flex gap-2 items-center">
        <div className="text-sm font-medium text-gray-600 mr-2">
          Проекция:
        </div>
        <select 
          className="px-3 py-2 border rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={cephalometryData.projectionType}
          onChange={(e) => setCephalometryData(prev => ({ ...prev, projectionType: e.target.value, points: {} }))}
        >
          <option value="frontal">Прямая (Frontal)</option>
          <option value="lateral">Боковая (Lateral)</option>
          <option value="profile45">Профиль 45°</option>
          <option value="intraoral">Внутриротовая</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button 
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
          onClick={onSave}
          disabled={!imagesUploaded}
        >
          <span className="mr-2">💾</span> Сохранить
        </button>
        <div className="relative group">
          <button 
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center"
            disabled={!imagesUploaded}
          >
            <span className="mr-2">📄</span> Отчет ▼
          </button>
          <div className="absolute right-0 mt-1 w-48 bg-white border rounded shadow-lg hidden group-hover:block z-10">
            <button 
              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
              onClick={onExportPDF}
            >
              <span className="mr-2">📕</span> Экспорт PDF
            </button>
            <button 
              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
              onClick={onExportPPTX}
            >
              <span className="mr-2">📙</span> Экспорт PPTX
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CephalometryToolbar;
