import React, { useMemo, useCallback } from 'react';

const BiometryPointsManager = ({ 
  biometryData, 
  setNextPointToPlace, 
  setActiveTool, 
  setSelectedPoint, 
  setShowPointPlacementGuide,
  selectedPoint,
  nextPointToPlace,
  activeTool,
  handle3DPointAdd,
  handleDeleteSelectedPoint,
  handleMovePoint
}) => {
  // Полный список ВСЕХ точек согласно ТЗ
  const allPoints = useMemo(() => [
    // === 1. Мезиодистальные размеры зубов (ширины) ===
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
  ], []);

  // Функция для получения следующей точки для расстановки
  const getNextPointToPlace = useCallback(() => {
    const currentPoints = biometryData.points || {};
    const nextPoint = allPoints.find(point => 
      point.required && !currentPoints[point.id]
    );
    return nextPoint ? nextPoint.id : null;
  }, [allPoints, biometryData.points]);

  // Обработчик активации режима расстановки точек
  const handleStartPointPlacement = useCallback(() => {
    setActiveTool('point');
    
    // Находим следующую точку для расстановки
    const nextPoint = getNextPointToPlace();
    
    if (nextPoint) {
      setNextPointToPlace(nextPoint);
      setShowPointPlacementGuide(true);
      
      // Находим описание точки
      const pointInfo = allPoints.find(p => p.id === nextPoint);
      if (pointInfo) {
        alert(`🔴 Режим расстановки точек активирован\n\n` +
              `📍 Следующая точка для расстановки: ${pointInfo.id}\n` +
              `📝 Описание: ${pointInfo.name}\n\n` +
              `🖱️ Кликните на 3D модели в нужном месте для установки точки.`);
      }
    } else {
      alert('✅ Все необходимые точки уже расставлены!');
      setActiveTool('select');
    }
  }, [allPoints, getNextPointToPlace, setActiveTool, setNextPointToPlace, setShowPointPlacementGuide]);

  // Обработчик выбора точки
  const handlePointSelect = useCallback((pointId) => {
    setSelectedPoint(pointId);
    
    // Если в режиме расстановки точек и выбрана новая точка
    if (activeTool === 'point' && pointId !== nextPointToPlace) {
      // Проверяем, расставлена ли уже эта точка
      if (biometryData.points[pointId]) {
        alert(`ℹ️ Точка ${pointId} уже расставлена. Для перемещения используйте инструмент "Переместить точку".`);
        return;
      }
      
      // Устанавливаем выбранную точку как следующую для расстановки
      setNextPointToPlace(pointId);
      
      const pointInfo = allPoints.find(p => p.id === pointId);
      if (pointInfo) {
        alert(`🔴 Выбрана точка для расстановки: ${pointInfo.id}\n` +
              `📝 Описание: ${pointInfo.name}\n\n` +
              `🖱️ Кликните на 3D модели в нужном месте для установки точки.`);
      }
    }
  }, [activeTool, nextPointToPlace, biometryData.points, allPoints, setSelectedPoint, setNextPointToPlace]);

  // Эффект для обновления nextPointToPlace при изменении точек
  const updateNextPointToPlace = useCallback(() => {
    if (activeTool === 'point') {
      const nextPoint = getNextPointToPlace();
      setNextPointToPlace(nextPoint);
    }
  }, [biometryData.points, activeTool, getNextPointToPlace, setNextPointToPlace]);

  return {
    allPoints,
    getNextPointToPlace,
    handleStartPointPlacement,
    handlePointSelect,
    updateNextPointToPlace,
    handleMovePoint,
    handleDeleteSelectedPoint,
    handle3DPointAdd
  };
};

export default BiometryPointsManager;