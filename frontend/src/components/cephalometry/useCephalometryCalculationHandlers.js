import { useCallback } from 'react';
import { calculateLateralMeasurements, calculateFrontalMeasurements } from './measurementUtils';

export const useCephalometryCalculationHandlers = (state) => {
  const {
    cephalometryData, setCephalometryData,
    setReportData
  } = state;

  const calculateDistance = useCallback((point1, point2) => {
    if (!point1 || !point2) return 0;
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    return cephalometryData.scale > 0 ? pixelDistance / cephalometryData.scale : pixelDistance;
  }, [cephalometryData.scale]);

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

  const calculateMeasurements = useCallback(() => {
    let measurements = {};
    const points = cephalometryData.points;
    
    if (cephalometryData.projectionType === 'lateral') {
      measurements = calculateLateralMeasurements(points, calculateAngle, calculateDistance, projectPointOnLine, cephalometryData.scale);
    } else if (cephalometryData.projectionType === 'frontal') {
      measurements = calculateFrontalMeasurements(points, calculateDistance, cephalometryData.scale);
    }
    
    setCephalometryData(prev => ({ ...prev, measurements }));
    return measurements;
  }, [cephalometryData.points, cephalometryData.projectionType, cephalometryData.scale, calculateAngle, calculateDistance, projectPointOnLine, setCephalometryData]);

  const generateReport = useCallback(() => {
    const measurements = calculateMeasurements();
    let allNormal = true;
    Object.values(measurements).forEach(m => {
      if (m.interpretation && m.interpretation !== 'Норма' && !m.interpretation.includes('(норма)')) allNormal = false;
    });
    
    const report = {
      patientName: cephalometryData.patientName,
      analysisDate: cephalometryData.analysisDate,
      projectionType: cephalometryData.projectionType,
      measurements,
      allNormal,
      conclusion: allNormal ? 'Попадает в норму' : 'Не попадает в норму',
      timestamp: new Date().toISOString()
    };
    
    setReportData(report);
    return report;
  }, [calculateMeasurements, cephalometryData.patientName, cephalometryData.analysisDate, cephalometryData.projectionType, setReportData]);

  return {
    calculateDistance,
    calculateAngle,
    projectPointOnLine,
    calculateMeasurements,
    generateReport
  };
};
