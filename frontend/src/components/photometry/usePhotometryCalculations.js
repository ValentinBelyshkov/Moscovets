import { useCallback } from 'react';

export const usePhotometryCalculations = (photometryData) => {
  // Calculate distance between two points
  const calculateDistance = useCallback((point1, point2) => {
    if (!point1 || !point2) return 0;
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    return photometryData.scale > 0 ? pixelDistance / photometryData.scale : pixelDistance;
  }, [photometryData.scale]);

  // Calculate angle between three points
  const calculateAngle = useCallback((point1, point2, point3) => {
    if (!point1 || !point2 || !point3) return 0;
    
    const vector1 = { x: point1.x - point2.x, y: point1.y - point2.y };
    const vector2 = { x: point3.x - point2.x, y: point3.y - point2.y };
    
    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
    const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    const cosAngle = dotProduct / (magnitude1 * magnitude2);
    const angleRad = Math.acos(Math.min(1, Math.max(-1, cosAngle)));
    return angleRad * (180 / Math.PI);
  }, []);

  // Calculate the projection of a point onto a line segment
  const projectPointOnLine = useCallback((point, lineStart, lineEnd) => {
    if (!point || !lineStart || !lineEnd) return null;
    
    const lineVector = { x: lineEnd.x - lineStart.x, y: lineEnd.y - lineStart.y };
    const lineLength = Math.sqrt(lineVector.x * lineVector.x + lineVector.y * lineVector.y);
    if (lineLength === 0) return null;
    
    const normalizedLineVector = {
      x: lineVector.x / lineLength,
      y: lineVector.y / lineLength
    };
    
    const pointVector = { x: point.x - lineStart.x, y: point.y - lineStart.y };
    const projectionLength = pointVector.x * normalizedLineVector.x + pointVector.y * normalizedLineVector.y;
    
    return {
      x: lineStart.x + projectionLength * normalizedLineVector.x,
      y: lineStart.y + projectionLength * normalizedLineVector.y
    };
  }, []);

  // Calculate all measurements based on projection type
  const calculateMeasurements = useCallback(() => {
    const measurements = {};
    const points = photometryData.points;
    
    if (photometryData.projectionType === 'frontal') {
      // Width measurements
      if (points['eu_L'] && points['eu_R']) {
        measurements.HeadWidth = {
          name: 'Ширина головы (eu—eu)',
          value: calculateDistance(points['eu_L'], points['eu_R']),
          unit: photometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      if (points['zy_L'] && points['zy_R']) {
        measurements.FaceWidth = {
          name: 'Морфологическая ширина лица (zy—zy)',
          value: calculateDistance(points['zy_L'], points['zy_R']),
          unit: photometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      if (points['go_L'] && points['go_R']) {
        measurements.GonialWidth = {
          name: 'Гониальная ширина лица (go—go)',
          value: calculateDistance(points['go_L'], points['go_R']),
          unit: photometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      // Height measurements
      if (points['oph'] && points['gn']) {
        measurements.FullHeight = {
          name: 'Полная морфологическая высота лица (oph—gn)',
          value: calculateDistance(points['oph'], points['gn']),
          unit: photometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      if (points['oph'] && points['sn']) {
        measurements.MidHeight = {
          name: 'Средняя морфологическая высота лица (oph—sn)',
          value: calculateDistance(points['oph'], points['sn']),
          unit: photometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      if (points['sn'] && points['gn']) {
        measurements.LowerHeight = {
          name: 'Нижняя морфологическая высота лица (sn—gn)',
          value: calculateDistance(points['sn'], points['gn']),
          unit: photometryData.scale > 0 ? 'mm' : 'px'
        };
      }
      
      // Calculate indices
      if (points['zy_L'] && points['zy_R'] && points['oph'] && points['gn']) {
        const faceWidth = calculateDistance(points['zy_L'], points['zy_R']);
        const faceHeight = calculateDistance(points['oph'], points['gn']);
        const headShapeIndex = (faceWidth / faceHeight) * 100;
        
        let interpretation = '';
        if (headShapeIndex < 75.9) interpretation = 'долихоцефалическая форма';
        else if (headShapeIndex <= 80.9) interpretation = 'мезоцефалическая форма';
        else if (headShapeIndex <= 85.4) interpretation = 'брахицефалическая форма';
        else interpretation = 'гипербрахицефалическая форма';
        
        measurements.HeadShapeIndex = {
          name: 'Индекс формы головы',
          value: headShapeIndex,
          unit: '%',
          interpretation,
          norm: '75.9-85.4%'
        };
      }
      
      if (points['zy_L'] && points['zy_R'] && points['oph'] && points['gn']) {
        const faceWidth = calculateDistance(points['zy_L'], points['zy_R']);
        const faceHeight = calculateDistance(points['oph'], points['gn']);
        const facialIndex = (faceHeight * 100) / faceWidth;
        
        let interpretation = '';
        if (facialIndex >= 104) interpretation = 'узкое лицо';
        else if (facialIndex >= 97) interpretation = 'среднее лицо';
        else interpretation = 'широкое лицо';
        
        measurements.FacialIndex = {
          name: 'Лицевой индекс Изара',
          value: facialIndex,
          unit: '%',
          interpretation,
          norm: '97-104%'
        };
      }
    } else if (photometryData.projectionType === 'profile') {
      if (points['n'] && points['sn'] && points['pg']) {
        const profileAngleValue = calculateAngle(points['n'], points['sn'], points['pg']);
        let interpretation = '';
        if (profileAngleValue < 165) interpretation = 'выпуклый профиль (дистальный)';
        else if (profileAngleValue > 175) interpretation = 'вогнутый профиль (мезиальный)';
        else interpretation = 'прямой профиль';
        
        measurements.ProfileAngle = {
          name: 'Угол профиля лица (n-sn-pg)',
          value: profileAngleValue,
          unit: '°',
          interpretation,
          norm: '165-175°'
        };
      }
      
      if (points['sn'] && points['ls'] && points['coll']) {
        const nasolabialAngleValue = calculateAngle(points['sn'], points['ls'], points['coll']);
        let interpretation = '';
        if (nasolabialAngleValue < 100) interpretation = 'протрузионный профиль';
        else if (nasolabialAngleValue > 110) interpretation = 'ретрузионный профиль';
        else interpretation = 'нормальный профиль';
        
        measurements.NasolabialAngle = {
          name: 'Носогубный угол (sn-ls-coll)',
          value: nasolabialAngleValue,
          unit: '°',
          interpretation,
          norm: '100-110°'
        };
      }
      
      if (points['pro'] && points['pog']) {
        measurements.ELine = {
          name: 'E-line (pro-pog)',
          value: 0,
          unit: 'mm',
          interpretation: 'В норме верхняя губа расположена за Е-линией и отстоит от нее на 2 мм',
          norm: 'Верхняя губа: -2 мм, Нижняя губа: 0 мм'
        };
      }
    }
    
    return measurements;
  }, [photometryData.projectionType, photometryData.points, calculateDistance, calculateAngle]);

  return {
    calculateDistance,
    calculateAngle,
    projectPointOnLine,
    calculateMeasurements
  };
};