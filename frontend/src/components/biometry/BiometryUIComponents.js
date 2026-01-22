import React, { useCallback } from 'react';
import ThreeDViewer from '../ThreeDViewer';

// Visualization Controls Component
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

// Toolbar Component
const Toolbar = ({ 
  activeTool, 
  setActiveTool, 
  selectedPoint, 
  handleMovePoint, 
  handleDeleteSelectedPoint, 
  handleStartPointPlacement, 
  model3DUploaded,
  calculateAllMeasurements,
  calculateTonIndex,
  calculateBoltonAnalysis,
  calculatePontAnalysis,
  calculateKorkhausAnalysis,
  calculateSnaginaMethod,
  calculateSlabkovskayaMethod,
  calculateSpeeCurve,
  calculationsPerformed,
  nextPointToPlace
}) => {
  return (
    <div className="toolbar p-5 bg-gray-50 rounded-lg">
      <h4 className="mt-0">🛠️ Инструменты анализа</h4>
      
      <div className={`mb-4 p-3 rounded ${
        activeTool === 'point' ? 'bg-yellow-100' : 
        activeTool === 'move' ? 'bg-cyan-100' : 'bg-gray-200'
      } text-sm`}>
        {activeTool === 'point' && nextPointToPlace ? (
          <>
            <div className="font-bold mb-1">📍 Режим расстановки:</div>
            <div className={`${activeTool === 'point' ? 'text-yellow-800' : 'text-cyan-800'}`}>
              <strong>Текущая точка:</strong> {nextPointToPlace}
            </div>
          </>
        ) : activeTool === 'move' ? (
          <>
            <div className="font-bold mb-1">🚚 Режим перемещения:</div>
            <div className="text-cyan-800">
              Выберите точку и кликните на нее в 3D виде для перемещения
            </div>
          </>
        ) : (
          <>
            <div className="font-bold mb-1">ℹ️ Информация:</div>
            <div className="text-cyan-800">
              Выберите инструмент для работы с точками
            </div>
          </>
        )}
      </div>
      
      <div className="tools flex flex-wrap gap-2 mb-5">
        <button
          className={`px-4 py-2 rounded transition-colors ${
            activeTool === 'select' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setActiveTool('select')}
        >
          ✋ Выбор
        </button>
        
        <button
          className={`px-4 py-2 rounded transition-colors ${
            activeTool === 'point' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={handleStartPointPlacement}
          disabled={!model3DUploaded}
        >
          🔴 Расстановка точек
        </button>
        
        <button
          className={`px-4 py-2 rounded transition-colors ${
            selectedPoint ? 'bg-cyan-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={handleMovePoint}
          disabled={!selectedPoint}
        >
          🚚 Переместить
        </button>
        
        <button
          className={`px-4 py-2 rounded transition-colors ${
            selectedPoint ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={handleDeleteSelectedPoint}
          disabled={!selectedPoint}
        >
          🗑️ Удалить
        </button>
      </div>
      
      {/* Расчеты и отчеты */}
      <div className="calculations-section mt-5">
        <h4>📊 Вычисления и анализы</h4>
        <div className="mb-4 p-3 bg-cyan-100 rounded text-sm">
          <div className="font-bold mb-1">ℹ️ Информация:</div>
          <div>• Сначала расставьте точки на 3D модели</div>
          <div>• Каждый расчет требует определенного набора точек</div>
          <div>• Используйте "Расстановка точек" для последовательной расстановки</div>
        </div>
        
        <div className="calculation-buttons grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          <button
            onClick={calculateAllMeasurements}
            className="p-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            🧮 Выполнить все расчеты
          </button>
          
          <button
            onClick={calculateTonIndex}
            className="p-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            📐 1. Индекс Тона
          </button>
          
          <button
            onClick={calculateBoltonAnalysis}
            className="p-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            📏 2. Индекс Болтона
          </button>
          
          <button
            onClick={calculatePontAnalysis}
            className="p-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            📊 3. Анализ Пона
          </button>
          
          <button
            onClick={calculateKorkhausAnalysis}
            className="p-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            📏 4. Анализ Корхауза
          </button>
          
          <button
            onClick={calculateSnaginaMethod}
            className="p-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            📐 5. Метод Снагиной
          </button>
          
          <button
            onClick={calculateSlabkovskayaMethod}
            className="p-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            📏 6. Метод Слабковской
          </button>
          
          <button
            onClick={calculateSpeeCurve}
            className="p-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            📐 7. Кривая Шпее
          </button>
        </div>
        
        {!calculationsPerformed && (
          <div className="mt-4 p-3 bg-yellow-100 rounded text-yellow-800">
            ⚠️ Для расчетов нужно расставить точки на 3D модели. Используйте инструмент "Расстановка точек".
          </div>
        )}
      </div>
    </div>
  );
};

// Points List Component
const PointsList = ({ 
  allPoints, 
  biometryData, 
  selectedPoint, 
  nextPointToPlace, 
  handlePointSelect, 
  pointsListRef,
  setBiometryData,
  setSelectedPoint,
  setNextPointToPlace
}) => {
  return (
    <div ref={pointsListRef} className="points-list flex-shrink-0 w-full lg:w-96 max-h-[800px] overflow-y-auto p-4 bg-gray-50 rounded-lg">
      <h3 className="mb-4">📍 Точки для расстановки</h3>
      
      {/* Кнопки управления */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            if (window.confirm('Очистить все расставленные точки?')) {
              setBiometryData(prev => ({
                ...prev,
                points: {}
              }));
              setSelectedPoint(null);
              setNextPointToPlace(null);
            }
          }}
          className="px-3 py-2 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
        >
          🗑️ Очистить все
        </button>
        
        <button
          onClick={() => {
            // Find the next unplaced required point
            const currentPoints = biometryData.points || {};
            const nextPoint = allPoints.find(point => 
              point.required && !currentPoints[point.id]
            );
            if (nextPoint) {
              setNextPointToPlace(nextPoint.id);
              alert(`🔴 Режим расстановки точек активирован\n\n` +
                    `📍 Следующая точка для расстановки: ${nextPoint.id}\n` +
                    `📝 Описание: ${nextPoint.name}\n\n` +
                    `🖱️ Кликните на 3D модели в нужном месте для установки точки.`);
            } else {
              alert('✅ Все необходимые точки уже расставлены!');
            }
          }}
          className="px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
        >
          🔄 Продолжить расстановку
        </button>
      </div>
      
      <div className="points-grid flex flex-col gap-2">
        {allPoints
          .filter(point => point.required)
          .map(point => (
          <div
            key={point.id}
            data-point-id={point.id}
            className={`point-item p-3 rounded cursor-pointer transition-all ${
              biometryData.points[point.id] ? 'bg-green-100 border-2 border-green-500' : 
              nextPointToPlace === point.id ? 'bg-yellow-100 border-2 border-yellow-500' : 
              selectedPoint === point.id ? 'bg-cyan-100 border-2 border-cyan-500' : 'bg-white border border-gray-300'
            }`}
            onClick={() => {
              handlePointSelect(point.id);
            }}
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800 text-sm">{point.id}</span>
              {biometryData.points[point.id] ? (
                <span className="text-green-600 text-sm">✅</span>
              ) : nextPointToPlace === point.id ? (
                <span className="text-yellow-600 text-sm">👉</span>
              ) : null}
            </div>
            <div className="text-xs text-gray-600 mt-1 leading-tight">
              {point.name}
            </div>
            {biometryData.points[point.id] && (
              <div className="text-xs text-green-600 mt-1">
                📍 ({biometryData.points[point.id].x.toFixed(1)}, {biometryData.points[point.id].y.toFixed(1)}, {biometryData.points[point.id].z.toFixed(1)})
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Points summary */}
      <div className="mt-5 p-3 bg-gray-100 rounded text-sm">
        <div className="font-bold mb-2 text-gray-800">
          📊 Статистика точек:
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div>Всего точек:</div>
            <div className="font-bold">{allPoints.filter(p => p.required).length}</div>
          </div>
          <div>
            <div>Расставлено:</div>
            <div className="font-bold text-green-600">
              {Object.keys(biometryData.points || {}).length}
            </div>
          </div>
          <div>
            <div>Осталось:</div>
            <div className="font-bold text-yellow-600">
              {allPoints.filter(p => p.required).length - Object.keys(biometryData.points || {}).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Results Display Component
const ResultsDisplay = ({ biometryData, calculationsPerformed, saveBiometryToMedicalCard, activePatient }) => {
  if (!calculationsPerformed) return null;
  
  return (
    <div className="results-display mt-5 p-5 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="mb-4">📋 Результаты биометрического анализа</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        
        {/* Индекс Тона */}
        {biometryData.tonIndex !== null && (
          <div className="p-4 bg-white rounded shadow-sm">
            <h4 className="mt-0 text-blue-600 font-medium">1. Индекс Тона</h4>
            <div className="text-sm">
              <strong>Значение:</strong> {biometryData.tonIndex.toFixed(2)}<br/>
              <strong>Норма:</strong> 1.33<br/>
              <strong>Интерпретация:</strong><br/>
              <span className={`p-2 rounded inline-block mt-1 ${
                biometryData.tonIndex === 1.33 ? 'bg-green-100 text-green-800' : 
                biometryData.tonIndex > 1.33 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                {biometryData.tonInterpretation}
              </span>
            </div>
          </div>
        )}
        
        {/* Индекс Болтона */}
        {biometryData.boltonAnalysis.anteriorRatio > 0 && (
          <div className="p-4 bg-white rounded shadow-sm">
            <h4 className="mt-0 text-blue-600 font-medium">2. Индекс Болтона</h4>
            <div className="text-sm">
              <strong>Соотношение передних зубов:</strong> {biometryData.boltonAnalysis.anteriorRatio}%<br/>
              <strong>Норма:</strong> 77.2%<br/>
              <strong>Интерпретация:</strong> {biometryData.boltonAnalysis.interpretation}
            </div>
          </div>
        )}
        
        {/* Анализ Пона */}
        {biometryData.pontAnalysis.upperPremolar.actualWidth > 0 && (
          <div className="p-4 bg-white rounded shadow-sm">
            <h4 className="mt-0 text-blue-600 font-medium">3. Анализ Пона</h4>
            <div className="text-sm">
              <strong>Верхняя челюсть:</strong><br/>
              <span className="ml-1">• Премоляры: {biometryData.pontAnalysis.upperPremolar.actualWidth.toFixed(2)} мм (норма: {biometryData.pontAnalysis.upperPremolar.normalWidth.toFixed(2)} мм) - {biometryData.pontAnalysis.upperPremolar.interpretation}</span><br/>
              <span className="ml-1">• Моляры: {biometryData.pontAnalysis.upperMolar.actualWidth.toFixed(2)} мм (норма: {biometryData.pontAnalysis.upperMolar.normalWidth.toFixed(2)} мм) - {biometryData.pontAnalysis.upperMolar.interpretation}</span>
            </div>
          </div>
        )}
        
        {/* Анализ Корхауза */}
        {biometryData.korkhausAnalysis.upperSegment.actualLength > 0 && (
          <div className="p-4 bg-white rounded shadow-sm">
            <h4 className="mt-0 text-blue-600 font-medium">4. Анализ Корхауза</h4>
            <div className="text-sm">
              <strong>Верхняя челюсть:</strong><br/>
              <span className="ml-1">{biometryData.korkhausAnalysis.upperSegment.interpretation}</span><br/>
              <strong>Нижняя челюсть:</strong><br/>
              <span className="ml-1">{biometryData.korkhausAnalysis.lowerSegment.interpretation}</span>
            </div>
          </div>
        )}
        
        {/* Метод Снагиной */}
        {biometryData.snaginaMethod.upperApicalLength > 0 && (
          <div className="p-4 bg-white rounded shadow-sm">
            <h4 className="mt-0 text-blue-600 font-medium">5. Метод Снагиной</h4>
            <div className="text-sm">
              <strong>Верхняя челюсть:</strong><br/>
              <span className="ml-1">• Длина: {biometryData.snaginaMethod.upperApicalLength.toFixed(2)} мм</span><br/>
              <span className="ml-1">• Ширина: {biometryData.snaginaMethod.upperApicalWidth.toFixed(2)} мм</span><br/>
              <strong>Нижняя челюсть:</strong><br/>
              <span className="ml-1">• Длина: {biometryData.snaginaMethod.lowerApicalLength.toFixed(2)} мм</span><br/>
              <span className="ml-1">• Ширина: {biometryData.snaginaMethod.lowerApicalWidth.toFixed(2)} мм</span>
            </div>
          </div>
        )}
        
        {/* Метод Слабковской */}
        {biometryData.slabkovskayaMethod.upperCanineWidth > 0 && (
          <div className="p-4 bg-white rounded shadow-sm">
            <h4 className="mt-0 text-blue-600 font-medium">6. Метод Слабковской</h4>
            <div className="text-sm">
              <strong>Верхние клыки:</strong> {biometryData.slabkovskayaMethod.upperCanineWidth.toFixed(2)} мм<br/>
              <strong>Нижние клыки:</strong> {biometryData.slabkovskayaMethod.lowerCanineWidth.toFixed(2)} мм
            </div>
          </div>
        )}
        
        {/* Кривая Шпее */}
        {biometryData.speeCurve.depth > 0 && (
          <div className="p-4 bg-white rounded shadow-sm">
            <h4 className="mt-0 text-blue-600 font-medium">7. Кривая Шпее</h4>
            <div className="text-sm">
              <strong>Глубина:</strong> {biometryData.speeCurve.depth.toFixed(2)} мм<br/>
              <strong>Норма:</strong> 1.5 мм<br/>
              <strong>Интерпретация:</strong><br/>
              <span className={`p-2 rounded inline-block mt-1 ${
                biometryData.speeCurve.depth === 1.5 ? 'bg-green-100 text-green-800' : 
                biometryData.speeCurve.depth > 1.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                {biometryData.speeCurve.interpretation}
              </span>
            </div>
          </div>
        )}
        
      </div>
      
      {/* Кнопка сохранения в медицинскую карту */}
      <div className="mt-5 p-4 bg-gray-100 rounded text-sm">
        <div className="font-bold mb-2">💾 Сохранение результатов:</div>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <button
            onClick={saveBiometryToMedicalCard}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            💾 Сохранить в медицинскую карту
          </button>
          
          <div className="text-xs text-gray-600">
            {activePatient
              ? `Данные будут сохранены для пациента: ${activePatient.fullName}`
              : 'Укажите пациента для сохранения данных'
            }
          </div>
        </div>
      </div>
      
      <div className="mt-5 p-4 bg-gray-100 rounded text-sm">
        <div className="font-bold mb-1">📝 Примечание:</div>
        <div>Все расчеты выполнены на основе фактических измерений расставленных точек на 3D модели.</div>
        <div>Для изменения результатов переместите точки на модели и выполните расчеты заново.</div>
      </div>
    </div>
  );
};

// 3D Model Viewer Component
const ModelViewer = ({ 
  model3DUploaded, 
  biometryData, 
  handle3DPointAdd, 
  handlePointSelect, 
  biometryPlanes, 
  activeTool, 
  nextPointToPlace, 
  visualizationSettings,
  showPointPlacementGuide,
  setShowPointPlacementGuide,
  threeDViewerRef
}) => {
  if (!model3DUploaded) return null;
  
  return (
    <div className="model-viewer flex-1 min-h-[600px] relative">
      {model3DUploaded && (
        <>
          <ThreeDViewer
            ref={threeDViewerRef}
            models={{ jaw: biometryData.model3D }}
            modelTypes={{ jaw: biometryData.modelType }}
            points={biometryData.points}
            onPointAdd={handle3DPointAdd}
            selectedPoint={handlePointSelect}
            showPlanes={biometryPlanes}
            activeTool={activeTool}
            nextPointToPlace={nextPointToPlace}
            visualizationSettings={visualizationSettings}
            chainVisualization={true}
            editingMode={activeTool === 'move'}
          />
          
          {showPointPlacementGuide && activeTool === 'point' && nextPointToPlace && (
            <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-yellow-100 text-yellow-800 p-4 rounded-lg max-w-md shadow-lg border border-yellow-300 z-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📍</span>
                <span className="font-bold text-lg">Режим расстановки точек</span>
              </div>
              <div className="text-sm mb-2">
                <strong>Текущая точка:</strong> {nextPointToPlace}
              </div>
              <div className="text-xs text-gray-700">
                {[
                  { id: 'U16_M', name: 'Первый моляр верхний слева (16) - мезиальная', type: 'dental', required: true },
                  { id: 'U15_M', name: 'Второй премоляр верхний слева (15) - мезиальная', type: 'dental', required: true },
                  { id: 'U14_M', name: 'Первый премоляр верхний слева (14) - мезиальная', type: 'dental', required: true },
                  { id: 'U13_M', name: 'Клык верхний слева (13) - мезиальная', type: 'dental', required: true },
                  { id: 'U12_M', name: 'Боковой резец верхний слева (12) - мезиальная', type: 'dental', required: true },
                  { id: 'U11_M', name: 'Центральный резец верхний слева (11) - мезиальная', type: 'dental', required: true },
                  { id: 'U21_M', name: 'Центральный резец верхний справа (21) - мезиальная', type: 'dental', required: true },
                  { id: 'U22_M', name: 'Боковой резец верхний справа (22) - мезиальная', type: 'dental', required: true },
                  { id: 'U23_M', name: 'Клык верхний справа (23) - мезиальная', type: 'dental', required: true },
                  { id: 'U24_M', name: 'Первый премоляр верхний справа (24) - мезиальная', type: 'dental', required: true },
                  { id: 'U25_M', name: 'Второй премоляр верхний справа (25) - мезиальная', type: 'dental', required: true },
                  { id: 'U26_M', name: 'Первый моляр верхний справа (26) - мезиальная', type: 'dental', required: true },
                  
                  { id: 'U16_D', name: 'Первый моляр верхний слева (16) - дистальная', type: 'dental', required: true },
                  { id: 'U15_D', name: 'Второй премоляр верхний слева (15) - дистальная', type: 'dental', required: true },
                  { id: 'U14_D', name: 'Первый премоляр верхний слева (14) - дистальная', type: 'dental', required: true },
                  { id: 'U13_D', name: 'Клык верхний слева (13) - дистальная', type: 'dental', required: true },
                  { id: 'U12_D', name: 'Боковой резец верхний слева (12) - дистальная', type: 'dental', required: true },
                  { id: 'U11_D', name: 'Центральный резец верхний слева (11) - дистальная', type: 'dental', required: true },
                  { id: 'U21_D', name: 'Центральный резец верхний справа (21) - дистальная', type: 'dental', required: true },
                  { id: 'U22_D', name: 'Боковой резец верхний справа (22) - дистальная', type: 'dental', required: true },
                  { id: 'U23_D', name: 'Клык верхний справа (23) - дистальная', type: 'dental', required: true },
                  { id: 'U24_D', name: 'Первый премоляр верхний справа (24) - дистальная', type: 'dental', required: true },
                  { id: 'U25_D', name: 'Второй премоляр верхний справа (25) - дистальная', type: 'dental', required: true },
                  { id: 'U26_D', name: 'Первый моляр верхний справа (26) - дистальная', type: 'dental', required: true },
                  
                  { id: 'L36_M', name: 'Первый моляр нижний слева (36) - мезиальная', type: 'dental', required: true },
                  { id: 'L35_M', name: 'Второй премоляр нижний слева (35) - мезиальная', type: 'dental', required: true },
                  { id: 'L34_M', name: 'Первый премоляр нижний слева (34) - мезиальная', type: 'dental', required: true },
                  { id: 'L33_M', name: 'Клык нижний слева (33) - мезиальная', type: 'dental', required: true },
                  { id: 'L32_M', name: 'Боковой резец нижний слева (32) - мезиальная', type: 'dental', required: true },
                  { id: 'L31_M', name: 'Центральный резец нижний слева (31) - мезиальная', type: 'dental', required: true },
                  { id: 'L41_M', name: 'Центральный резец нижний справа (41) - мезиальная', type: 'dental', required: true },
                  { id: 'L42_M', name: 'Боковой резец нижний справа (42) - мезиальная', type: 'dental', required: true },
                  { id: 'L43_M', name: 'Клык нижний справа (43) - мезиальная', type: 'dental', required: true },
                  { id: 'L44_M', name: 'Первый премоляр нижний справа (44) - мезиальная', type: 'dental', required: true },
                  { id: 'L45_M', name: 'Второй премоляр нижний справа (45) - мезиальная', type: 'dental', required: true },
                  { id: 'L46_M', name: 'Первый моляр нижний справа (46) - мезиальная', type: 'dental', required: true },
                  
                  { id: 'L36_D', name: 'Первый моляр нижний слева (36) - дистальная', type: 'dental', required: true },
                  { id: 'L35_D', name: 'Второй премоляр нижний слева (35) - дистальная', type: 'dental', required: true },
                  { id: 'L34_D', name: 'Первый премоляр нижний слева (34) - дистальная', type: 'dental', required: true },
                  { id: 'L33_D', name: 'Клык нижний слева (33) - дистальная', type: 'dental', required: true },
                  { id: 'L32_D', name: 'Боковой резец нижний слева (32) - дистальная', type: 'dental', required: true },
                  { id: 'L31_D', name: 'Центральный резец нижний слева (31) - дистальная', type: 'dental', required: true },
                  { id: 'L41_D', name: 'Центральный резец нижний справа (41) - дистальная', type: 'dental', required: true },
                  { id: 'L42_D', name: 'Боковой резец нижний справа (42) - дистальная', type: 'dental', required: true },
                  { id: 'L43_D', name: 'Клык нижний справа (43) - дистальная', type: 'dental', required: true },
                  { id: 'L44_D', name: 'Первый премоляр нижний справа (44) - дистальная', type: 'dental', required: true },
                  { id: 'L45_D', name: 'Второй премоляр нижний справа (45) - дистальная', type: 'dental', required: true },
                  { id: 'L46_D', name: 'Первый моляр нижний справа (46) - дистальная', type: 'dental', required: true },
                  
                  // === 2. Анализ Пона (ширина зубных рядов) ===
                  { id: 'U_PREMOLAR_LEFT', name: 'Верхний премоляр слева - щечный бугор', type: 'pont', required: true },
                  { id: 'U_PREMOLAR_RIGHT', name: 'Верхний премоляр справа - щечный бугор', type: 'pont', required: true },
                  { id: 'U_MOLAR_LEFT', name: 'Верхний моляр слева - межбугорковая фиссура', type: 'pont', required: true },
                  { id: 'U_MOLAR_RIGHT', name: 'Верхний моляр справа - межбугорковая фиссура', type: 'pont', required: true },
                  { id: 'L_PREMOLAR_LEFT', name: 'Нижний премоляр слева - щечный бугор', type: 'pont', required: true },
                  { id: 'L_PREMOLAR_RIGHT', name: 'Нижний премоляр справа - щечный бугор', type: 'pont', required: true },
                  { id: 'L_MOLAR_LEFT', name: 'Нижний моляр слева - межбугорковая фиссура', type: 'pont', required: true },
                  { id: 'L_MOLAR_RIGHT', name: 'Нижний моляр справа - межбугорковая фиссура', type: 'pont', required: true },
                  
                  // === 3. Метод Снагиной (апикальный базис) ===
                  { id: 'U_APICAL_LEFT', name: 'Левая точка апикального базиса верхней челюсти', type: 'snagina', required: true },
                  { id: 'U_APICAL_RIGHT', name: 'Правая точка апикального базиса верхней челюсти', type: 'snagina', required: true },
                  { id: 'L_APICAL_LEFT', name: 'Левая точка апикального базиса нижней челюсти', type: 'snagina', required: true },
                  { id: 'L_APICAL_RIGHT', name: 'Правая точка апикального базиса нижней челюсти', type: 'snagina', required: true },
                  { id: 'U_APICAL_ANTERIOR', name: 'Передняя точка апикального базиса верхней челюсти', type: 'snagina', required: true },
                  { id: 'U_APICAL_POSTERIOR', name: 'Задняя точка апикального базиса верхней челюсти', type: 'snagina', required: true },
                  { id: 'L_APICAL_ANTERIOR', name: 'Передняя точка апикального базиса нижней челюсти', type: 'snagina', required: true },
                  { id: 'L_APICAL_POSTERIOR', name: 'Задняя точка апикального базиса нижней челюсти', type: 'snagina', required: true },
                  
                  // === 4. Метод Слабковской (ширина в области клыков) ===
                  { id: 'U_CANINE_LEFT', name: 'Клык верхний слева - щечная поверхность', type: 'slabkovskaya', required: true },
                  { id: 'U_CANINE_RIGHT', name: 'Клык верхний справа - щечная поверхность', type: 'slabkovskaya', required: true },
                  { id: 'L_CANINE_LEFT', name: 'Клык нижний слева - щечная поверхность', type: 'slabkovskaya', required: true },
                  { id: 'L_CANINE_RIGHT', name: 'Клык нижний справа - щечная поверхность', type: 'slabkovskaya', required: true },
                  
                  // === 5. Анализ Корхауза (длина переднего отрезка) ===
                  { id: 'U_SEGMENT_LEFT', name: 'Левая точка переднего отрезка верхней челюсти', type: 'korkhaus', required: true },
                  { id: 'U_SEGMENT_RIGHT', name: 'Правая точка переднего отрезка верхней челюсти', type: 'korkhaus', required: true },
                  { id: 'L_SEGMENT_LEFT', name: 'Левая точка переднего отрезка нижней челюсти', type: 'korkhaus', required: true },
                  { id: 'L_SEGMENT_RIGHT', name: 'Правая точка переднего отрезка нижней челюсти', type: 'korkhaus', required: true },
                  
                  // === 6. Кривая Шпее ===
                  { id: 'SPEE_CENTRAL', name: 'Центральный резец нижний - режущий край', type: 'spee', required: true },
                  { id: 'SPEE_MOLAR_LEFT', name: 'Второй моляр нижний слева - дистально-щечный бугор', type: 'spee', required: true },
                  { id: 'SPEE_MOLAR_RIGHT', name: 'Второй моляр нижний справа - дистально щечный бугор', type: 'spee', required: true },
                  { id: 'SPEE_DEEPEST', name: 'Самая глубокая точка кривой Шпее (область первого моляра)', type: 'spee', required: true },
                  
                  // === 7. Симметрия ===
                  { id: 'MIDLINE', name: 'Срединная точка', type: 'symmetry', required: true },
                  { id: 'U_LEFT_SIDE', name: 'Крайняя левая точка верхнего зубного ряда', type: 'symmetry', required: true },
                  { id: 'U_RIGHT_SIDE', name: 'Крайняя правая точка верхнего зубного ряда', type: 'symmetry', required: true },
                  { id: 'L_LEFT_SIDE', name: 'Крайняя левая точка нижнего зубного ряда', type: 'symmetry', required: true },
                  { id: 'L_RIGHT_SIDE', name: 'Крайняя правая точка нижнего зубного ряда', type: 'symmetry', required: true },
                ].find(p => p.id === nextPointToPlace)?.name}
              </div>
              <div className="mt-2 text-xs italic">
                Кликните на 3D модели в нужном месте для установки точки
              </div>
              <button 
                onClick={() => {
                  setShowPointPlacementGuide(false);
                  // setActiveTool('select');  // We don't want to change the active tool here
                }}
                className="absolute top-1 right-1 bg-none border-none text-xl cursor-pointer text-yellow-800"
              >
                ×
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Patient Info Component
const PatientInfo = ({ biometryData, setBiometryData, activePatient }) => {
  return (
    <div className="patient-info bg-gray-50 p-4 rounded-lg mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">👤 Информация о пациенте</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Имя пациента:</label>
          <input
            type="text"
            value={biometryData.patientName}
            onChange={(e) => setBiometryData(prev => ({
              ...prev,
              patientName: e.target.value
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Дата анализа:</label>
          <input
            type="date"
            value={biometryData.analysisDate}
            onChange={(e) => setBiometryData(prev => ({
              ...prev,
              analysisDate: e.target.value
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Отображаем информацию о выбранном пациенте */}
      {activePatient && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm">
          <div className="font-medium text-blue-800"><strong>Текущий пациент:</strong> {activePatient.fullName}</div>
          <div className="text-blue-700"><strong>ID пациента:</strong> {activePatient.id}</div>
          <div className="text-blue-600"><small>Данные будут сохранены для этого пациента</small></div>
        </div>
      )}
    </div>
  );
};

// Model Upload Component
const ModelUpload = ({ 
  model3DUploaded, 
  handleModelUpload, 
  fileInputRef, 
  biometryData,
  setModel3DUploaded,
  setBiometryData,
  setCalculationsPerformed
}) => {
  return (
    <div className="image-upload bg-gray-50 p-4 rounded-lg mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-700">🦷 3D модель челюсти</h3>
      {!model3DUploaded ? (
        <div>
          <input
            type="file"
            accept=".stl,.obj"
            onChange={handleModelUpload}
            ref={fileInputRef}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current.click()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 text-base font-medium shadow-md hover:shadow-lg"
          >
            📁 Загрузить 3D модель челюсти (STL/OBJ)
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Поддерживаемые форматы: STL, OBJ
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-green-600 font-medium">
            ✅ 3D модель загружена: {biometryData.modelFile?.name || 'Тестовая модель'}
          </p>
          <button onClick={() => {
            setModel3DUploaded(false);
            setBiometryData(prev => ({
              ...prev,
              model3D: null,
              modelType: null,
              modelFile: null,
              points: {}
            }));
            setCalculationsPerformed(false);
          }} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300 text-sm font-medium">
            🔄 Загрузить другую модель
          </button>
        </div>
      )}
    </div>
  );
};

export {
  VisualizationControls,
  Toolbar,
  PointsList,
  ResultsDisplay,
  ModelViewer,
  PatientInfo,
  ModelUpload
};