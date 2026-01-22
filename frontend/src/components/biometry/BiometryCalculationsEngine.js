import React, { useCallback } from 'react';

const BiometryCalculationsEngine = ({ 
  biometryData, 
  setBiometryData, 
  calculateDistance,
  setCalculationsPerformed
}) => {
  // Функция проверки наличия необходимых точек для расчета
  const checkRequiredPointsForCalculation = useCallback((calculationType) => {
    const points = biometryData.points;
    
    switch(calculationType) {
      case 'tonIndex':
        return points['U11_M'] && points['U11_D'] && points['U12_M'] && points['U12_D'] &&
               points['U21_M'] && points['U21_D'] && points['U22_M'] && points['U22_D'] &&
               points['L31_M'] && points['L31_D'] && points['L32_M'] && points['L32_D'] &&
               points['L41_M'] && points['L41_D'] && points['L42_M'] && points['L42_D'];
        
      case 'boltonAnalysis':
        const upperTeeth = ['U13_M', 'U13_D', 'U12_M', 'U12_D', 'U11_M', 'U11_D', 
                           'U21_M', 'U21_D', 'U22_M', 'U22_D', 'U23_M', 'U23_D'];
        const lowerTeeth = ['L33_M', 'L33_D', 'L32_M', 'L32_D', 'L31_M', 'L31_D',
                           'L41_M', 'L41_D', 'L42_M', 'L42_D', 'L43_M', 'L43_D'];
        return upperTeeth.every(id => points[id]) && lowerTeeth.every(id => points[id]);
        
      case 'pontAnalysis':
        return points['U_PREMOLAR_LEFT'] && points['U_PREMOLAR_RIGHT'] &&
               points['U_MOLAR_LEFT'] && points['U_MOLAR_RIGHT'] &&
               points['L_PREMOLAR_LEFT'] && points['L_PREMOLAR_RIGHT'] &&
               points['L_MOLAR_LEFT'] && points['L_MOLAR_RIGHT'];
        
      case 'korkhausAnalysis':
        return points['U_SEGMENT_LEFT'] && points['U_SEGMENT_RIGHT'] &&
               points['L_SEGMENT_LEFT'] && points['L_SEGMENT_RIGHT'];
        
      case 'snaginaMethod':
        return points['U_APICAL_LEFT'] && points['U_APICAL_RIGHT'] &&
               points['U_APICAL_ANTERIOR'] && points['U_APICAL_POSTERIOR'] &&
               points['L_APICAL_LEFT'] && points['L_APICAL_RIGHT'] &&
               points['L_APICAL_ANTERIOR'] && points['L_APICAL_POSTERIOR'];
        
      case 'slabkovskayaMethod':
        return points['U_CANINE_LEFT'] && points['U_CANINE_RIGHT'] &&
               points['L_CANINE_LEFT'] && points['L_CANINE_RIGHT'];
        
      case 'speeCurve':
        return points['SPEE_CENTRAL'] && points['SPEE_MOLAR_LEFT'] &&
               points['SPEE_MOLAR_RIGHT'] && points['SPEE_DEEPEST'];
        
      default:
        return false;
    }
  }, [biometryData.points]);

  // 1. Расчет индекса Тона на основе реальных точек
  const calculateTonIndex = useCallback(() => {
    const points = biometryData.points;
    
    if (!checkRequiredPointsForCalculation('tonIndex')) {
      alert('Для расчета индекса Тона нужно расставить все точки для 4 верхних и 4 нижних резцов');
      return;
    }
    
    const upper11 = calculateDistance(points['U11_M'], points['U11_D']);
    const upper12 = calculateDistance(points['U12_M'], points['U12_D']);
    const upper21 = calculateDistance(points['U21_M'], points['U21_D']);
    const upper22 = calculateDistance(points['U22_M'], points['U22_D']);
    
    const lower31 = calculateDistance(points['L31_M'], points['L31_D']);
    const lower32 = calculateDistance(points['L32_M'], points['L32_D']);
    const lower41 = calculateDistance(points['L41_M'], points['L41_D']);
    const lower42 = calculateDistance(points['L42_M'], points['L42_D']);
    
    const upperIncisorsSum = upper11 + upper12 + upper21 + upper22;
    const lowerIncisorsSum = lower31 + lower32 + lower41 + lower42;
    
    if (lowerIncisorsSum === 0) {
      alert('Ошибка: сумма размеров нижних резцов равна нулю');
      return;
    }
    
    const tonIndex = upperIncisorsSum / lowerIncisorsSum;
    
    let interpretation = '';
    if (tonIndex > 1.33) {
      interpretation = 'Макродентия верхних резцов, микродентия нижних резцов или сочетание этих двух причин.';
    } else if (tonIndex < 1.33) {
      interpretation = 'Микродентия верхних резцов, макродентия нижних резцов или сочетание этих двух причин.';
    } else {
      interpretation = 'Норма';
    }
    
    setBiometryData(prev => ({
      ...prev,
      tonIndex: parseFloat(tonIndex.toFixed(2)),
      tonInterpretation: interpretation
    }));
    
    setCalculationsPerformed(true);
    alert(`📐 Индекс Тона: ${tonIndex.toFixed(2)}\n` +
          `Верхние резцы: ${upperIncisorsSum.toFixed(2)} мм\n` +
          `Нижние резцы: ${lowerIncisorsSum.toFixed(2)} мм`);
  }, [biometryData.points, calculateDistance, checkRequiredPointsForCalculation, setBiometryData, setCalculationsPerformed]);

  // 2. Расчет индекса Болтона
  const calculateBoltonAnalysis = useCallback(() => {
    const points = biometryData.points;
    
    if (!checkRequiredPointsForCalculation('boltonAnalysis')) {
      alert('Для расчета индекса Болтона нужно расставить все точки для передних зубов');
      return;
    }
    
    const upper13 = calculateDistance(points['U13_M'], points['U13_D']);
    const upper12 = calculateDistance(points['U12_M'], points['U12_D']);
    const upper11 = calculateDistance(points['U11_M'], points['U11_D']);
    const upper21 = calculateDistance(points['U21_M'], points['U21_D']);
    const upper22 = calculateDistance(points['U22_M'], points['U22_D']);
    const upper23 = calculateDistance(points['U23_M'], points['U23_D']);
    
    const upperSum6 = upper13 + upper12 + upper11 + upper21 + upper22 + upper23;
    
    const lower33 = calculateDistance(points['L33_M'], points['L33_D']);
    const lower32 = calculateDistance(points['L32_M'], points['L32_D']);
    const lower31 = calculateDistance(points['L31_M'], points['L31_D']);
    const lower41 = calculateDistance(points['L41_M'], points['L41_D']);
    const lower42 = calculateDistance(points['L42_M'], points['L42_D']);
    const lower43 = calculateDistance(points['L43_M'], points['L43_D']);
    
    const lowerSum6 = lower33 + lower32 + lower31 + lower41 + lower42 + lower43;
    
    let upperSum12 = upperSum6;
    const upperTeethIds = [
      ['U14_M', 'U14_D'], ['U15_M', 'U15_D'], ['U16_M', 'U16_D'],
      ['U24_M', 'U24_D'], ['U25_M', 'U25_D'], ['U26_M', 'U26_D']
    ];
    
    upperTeethIds.forEach(([mesial, distal]) => {
      if (points[mesial] && points[distal]) {
        upperSum12 += calculateDistance(points[mesial], points[distal]);
      }
    });
    
    let lowerSum12 = lowerSum6;
    const lowerTeethIds = [
      ['L34_M', 'L34_D'], ['L35_M', 'L35_D'], ['L36_M', 'L36_D'],
      ['L44_M', 'L44_D'], ['L45_M', 'L45_D'], ['L46_M', 'L46_D']
    ];
    
    lowerTeethIds.forEach(([mesial, distal]) => {
      if (points[mesial] && points[distal]) {
        lowerSum12 += calculateDistance(points[mesial], points[distal]);
      }
    });
    
    const anteriorRatio = upperSum6 > 0 ? (lowerSum6 / upperSum6) * 100 : 0;
    const overallRatio = upperSum12 > 0 ? (lowerSum12 / upperSum12) * 100 : 0;
    const difference = Math.abs(anteriorRatio - 77.2);
    
    let interpretation = '';
    if (difference > 2) {
      interpretation = `Ширина нижних передних зубов ${anteriorRatio > 77.2 ? 'шире' : 'уже'} нормы на ${Math.abs(difference).toFixed(2)}%`;
    } else {
      interpretation = 'Соотношение в норме';
    }
    
    setBiometryData(prev => ({
      ...prev,
      boltonAnalysis: {
        upperSum6: parseFloat(upperSum6.toFixed(2)),
        lowerSum6: parseFloat(lowerSum6.toFixed(2)),
        upperSum12: parseFloat(upperSum12.toFixed(2)),
        lowerSum12: parseFloat(lowerSum12.toFixed(2)),
        anteriorRatio: parseFloat(anteriorRatio.toFixed(2)),
        overallRatio: parseFloat(overallRatio.toFixed(2)),
        difference: parseFloat(difference.toFixed(2)),
        interpretation
      }
    }));
    
    setCalculationsPerformed(true);
    alert(`📏 Индекс Болтона: ${anteriorRatio.toFixed(2)}%\n` +
          `Верхние 6 зубов: ${upperSum6.toFixed(2)} мм\n` +
          `Нижние 6 зубов: ${lowerSum6.toFixed(2)} мм`);
  }, [biometryData.points, calculateDistance, checkRequiredPointsForCalculation, setBiometryData, setCalculationsPerformed]);

  // 3. Расчет анализа Пона
  const calculatePontAnalysis = useCallback(() => {
    const { points, toothMeasurements } = biometryData;
    
    if (!checkRequiredPointsForCalculation('pontAnalysis')) {
      alert('Для анализа Пона нужно расставить все 8 точек для премоляров и моляров');
      return;
    }
    
    const upperPremolarActual = calculateDistance(points['U_PREMOLAR_LEFT'], points['U_PREMOLAR_RIGHT']);
    const upperMolarActual = calculateDistance(points['U_MOLAR_LEFT'], points['U_MOLAR_RIGHT']);
    const lowerPremolarActual = calculateDistance(points['L_PREMOLAR_LEFT'], points['L_PREMOLAR_RIGHT']);
    const lowerMolarActual = calculateDistance(points['L_MOLAR_LEFT'], points['L_MOLAR_RIGHT']);
    
    const sum4UpperIncisors = toothMeasurements.upperJaw['11'] + toothMeasurements.upperJaw['12'] + 
                             toothMeasurements.upperJaw['21'] + toothMeasurements.upperJaw['22'];
    
    const upperPremolarNorm = sum4UpperIncisors * 1.25;
    const upperMolarNorm = sum4UpperIncisors * 1.54;
    
    const sum4LowerIncisors = toothMeasurements.lowerJaw['31'] + toothMeasurements.lowerJaw['32'] + 
                             toothMeasurements.lowerJaw['41'] + toothMeasurements.lowerJaw['42'];
    
    const lowerPremolarNorm = sum4LowerIncisors * 1.25;
    const lowerMolarNorm = sum4LowerIncisors * 1.54;
    
    setBiometryData(prev => ({
      ...prev,
      pontAnalysis: {
        upperPremolar: {
          actualWidth: parseFloat(upperPremolarActual.toFixed(2)),
          normalWidth: parseFloat(upperPremolarNorm.toFixed(2)),
          difference: parseFloat((upperPremolarActual - upperPremolarNorm).toFixed(2)),
          interpretation: upperPremolarActual > upperPremolarNorm ? 
            `Расширение на ${(upperPremolarActual - upperPremolarNorm).toFixed(2)} мм` : 
            `Сужение на ${(upperPremolarNorm - upperPremolarActual).toFixed(2)} мм`
        },
        upperMolar: {
          actualWidth: parseFloat(upperMolarActual.toFixed(2)),
          normalWidth: parseFloat(upperMolarNorm.toFixed(2)),
          difference: parseFloat((upperMolarActual - upperMolarNorm).toFixed(2)),
          interpretation: upperMolarActual > upperMolarNorm ? 
            `Расширение на ${(upperMolarActual - upperMolarNorm).toFixed(2)} мм` : 
            `Сужение на ${(upperMolarNorm - upperMolarActual).toFixed(2)} мм`
        },
        lowerPremolar: {
          actualWidth: parseFloat(lowerPremolarActual.toFixed(2)),
          normalWidth: parseFloat(lowerPremolarNorm.toFixed(2)),
          difference: parseFloat((lowerPremolarActual - lowerPremolarNorm).toFixed(2)),
          interpretation: lowerPremolarActual > lowerPremolarNorm ? 
            `Расширение на ${(lowerPremolarActual - lowerPremolarNorm).toFixed(2)} мм` : 
            `Сужение на ${(lowerPremolarNorm - lowerPremolarActual).toFixed(2)} мм`
        },
        lowerMolar: {
          actualWidth: parseFloat(lowerMolarActual.toFixed(2)),
          normalWidth: parseFloat(lowerMolarNorm.toFixed(2)),
          difference: parseFloat((lowerMolarActual - lowerMolarNorm).toFixed(2)),
          interpretation: lowerMolarActual > lowerMolarNorm ? 
            `Расширование на ${(lowerMolarActual - lowerMolarNorm).toFixed(2)} мм` : 
            `Сужение на ${(lowerMolarNorm - lowerMolarActual).toFixed(2)} мм`
        }
      }
    }));
    
    setCalculationsPerformed(true);
    alert(`📊 Анализ Пона выполнен`);
  }, [biometryData.points, biometryData.toothMeasurements, calculateDistance, checkRequiredPointsForCalculation, setBiometryData, setCalculationsPerformed]);

  // 4. Расчет анализа Корхауза
  const calculateKorkhausAnalysis = useCallback(() => {
    const { points, toothMeasurements } = biometryData;
    
    if (!checkRequiredPointsForCalculation('korkhausAnalysis')) {
      alert('Для анализа Корхауза нужно расставить точки переднего отрезка');
      return;
    }
    
    const upperActualLength = calculateDistance(points['U_SEGMENT_LEFT'], points['U_SEGMENT_RIGHT']);
    const lowerActualLength = calculateDistance(points['L_SEGMENT_LEFT'], points['L_SEGMENT_RIGHT']);
    
    const sum4UpperIncisors = toothMeasurements.upperJaw['11'] + toothMeasurements.upperJaw['12'] + 
                             toothMeasurements.upperJaw['21'] + toothMeasurements.upperJaw['22'];
    
    const upperNormal = (sum4UpperIncisors * 100) / 170;
    const lowerNormal = upperNormal - 2;
    
    setBiometryData(prev => ({
      ...prev,
      korkhausAnalysis: {
        upperSegment: {
          actualLength: parseFloat(upperActualLength.toFixed(2)),
          normalLength: parseFloat(upperNormal.toFixed(2)),
          difference: parseFloat((upperActualLength - upperNormal).toFixed(2)),
          interpretation: `Длина переднего отрезка верхнего зубного ряда ${upperActualLength > upperNormal ? 'длиннее' : 'короче'} нормы на ${Math.abs(upperActualLength - upperNormal).toFixed(2)} мм`
        },
        lowerSegment: {
          actualLength: parseFloat(lowerActualLength.toFixed(2)),
          normalLength: parseFloat(lowerNormal.toFixed(2)),
          difference: parseFloat((lowerActualLength - lowerNormal).toFixed(2)),
          interpretation: `Длина переднего отрезка нижнего зубного ряда ${lowerActualLength > lowerNormal ? 'длиннее' : 'короче'} нормы на ${Math.abs(lowerActualLength - lowerNormal).toFixed(2)} мм`
        }
      }
    }));
    
    setCalculationsPerformed(true);
    alert(`📏 Анализ Корхауза выполнен`);
  }, [biometryData.points, biometryData.toothMeasurements, calculateDistance, checkRequiredPointsForCalculation, setBiometryData, setCalculationsPerformed]);

  // 5. Расчет метода Снагиной
  const calculateSnaginaMethod = useCallback(() => {
    const points = biometryData.points;
    
    if (!checkRequiredPointsForCalculation('snaginaMethod')) {
      alert('Для метода Снагиной нужно расставить все 8 точек апикального базиса');
      return;
    }
    
    const upperApicalLength = calculateDistance(points['U_APICAL_ANTERIOR'], points['U_APICAL_POSTERIOR']);
    const lowerApicalLength = calculateDistance(points['L_APICAL_ANTERIOR'], points['L_APICAL_POSTERIOR']);
    
    const upperApicalWidth = calculateDistance(points['U_APICAL_LEFT'], points['U_APICAL_RIGHT']);
    const lowerApicalWidth = calculateDistance(points['L_APICAL_LEFT'], points['L_APICAL_RIGHT']);
    
    setBiometryData(prev => ({
      ...prev,
      snaginaMethod: {
        upperApicalLength: parseFloat(upperApicalLength.toFixed(2)),
        upperApicalWidth: parseFloat(upperApicalWidth.toFixed(2)),
        lowerApicalLength: parseFloat(lowerApicalLength.toFixed(2)),
        lowerApicalWidth: parseFloat(lowerApicalWidth.toFixed(2))
      }
    }));
    
    setCalculationsPerformed(true);
    alert(`📐 Метод Снагиной выполнен`);
  }, [biometryData.points, calculateDistance, checkRequiredPointsForCalculation, setBiometryData, setCalculationsPerformed]);

  // 6. Расчет метода Слабковской
  const calculateSlabkovskayaMethod = useCallback(() => {
    const points = biometryData.points;
    
    if (!checkRequiredPointsForCalculation('slabkovskayaMethod')) {
      alert('Для метода Слабковской нужно расставить точки клыков');
      return;
    }
    
    const upperCanineWidth = calculateDistance(points['U_CANINE_LEFT'], points['U_CANINE_RIGHT']);
    const lowerCanineWidth = calculateDistance(points['L_CANINE_LEFT'], points['L_CANINE_RIGHT']);
    
    setBiometryData(prev => ({
      ...prev,
      slabkovskayaMethod: {
        upperCanineWidth: parseFloat(upperCanineWidth.toFixed(2)),
        lowerCanineWidth: parseFloat(lowerCanineWidth.toFixed(2))
      }
    }));
    
    setCalculationsPerformed(true);
    alert(`📏 Метод Слабковской выполнен`);
  }, [biometryData.points, calculateDistance, checkRequiredPointsForCalculation, setBiometryData, setCalculationsPerformed]);

  // 7. Расчет кривой Шпее
  const calculateSpeeCurve = useCallback(() => {
    const points = biometryData.points;
    
    if (!checkRequiredPointsForCalculation('speeCurve')) {
      alert('Для расчета кривой Шпее нужно расставить все 4 точки');
      return;
    }
    
    const depth = Math.abs(points['SPEE_DEEPEST'].y - points['SPEE_CENTRAL'].y);
    
    let interpretation = '';
    if (depth > 1.5) {
      interpretation = `Глубина кривой Шпее превышает норму (${depth.toFixed(2)} мм > 1.5 мм)`;
    } else if (depth < 1.5) {
      interpretation = `Глубина кривой Шпее меньше нормы (${depth.toFixed(2)} мм < 1.5 мм)`;
    } else {
      interpretation = 'Глубина кривой Шпее в норме';
    }
    
    setBiometryData(prev => ({
      ...prev,
      speeCurve: {
        depth: parseFloat(depth.toFixed(2)),
        interpretation
      }
    }));
    
    setCalculationsPerformed(true);
    alert(`📐 Кривая Шпее рассчитана: ${depth.toFixed(2)} мм`);
  }, [biometryData.points, checkRequiredPointsForCalculation, setBiometryData, setCalculationsPerformed]);

  // Выполнить все расчеты
  const calculateAllMeasurements = useCallback(() => {
    const calculationsToPerform = [];
    
    if (checkRequiredPointsForCalculation('tonIndex')) {
      calculationsToPerform.push('Индекс Тона');
      calculateTonIndex();
    }
    
    if (checkRequiredPointsForCalculation('boltonAnalysis')) {
      calculationsToPerform.push('Индекс Болтона');
      calculateBoltonAnalysis();
    }
    
    if (checkRequiredPointsForCalculation('pontAnalysis')) {
      calculationsToPerform.push('Анализ Пона');
      calculatePontAnalysis();
    }
    
    if (checkRequiredPointsForCalculation('korkhausAnalysis')) {
      calculationsToPerform.push('Анализ Корхауза');
      calculateKorkhausAnalysis();
    }
    
    if (checkRequiredPointsForCalculation('snaginaMethod')) {
      calculationsToPerform.push('Метод Снагиной');
      calculateSnaginaMethod();
    }
    
    if (checkRequiredPointsForCalculation('slabkovskayaMethod')) {
      calculationsToPerform.push('Метод Слабковской');
      calculateSlabkovskayaMethod();
    }
    
    if (checkRequiredPointsForCalculation('speeCurve')) {
      calculationsToPerform.push('Кривая Шпее');
      calculateSpeeCurve();
    }
    
    if (calculationsToPerform.length === 0) {
      alert('Для выполнения расчетов нужно расставить необходимые точки.');
    } else {
      setCalculationsPerformed(true);
      alert(`Выполнены расчеты: ${calculationsToPerform.join(', ')}`);
    }
  }, [
    calculateTonIndex, calculateBoltonAnalysis, calculatePontAnalysis,
    calculateKorkhausAnalysis, calculateSnaginaMethod, calculateSlabkovskayaMethod,
    calculateSpeeCurve, checkRequiredPointsForCalculation, setCalculationsPerformed
  ]);

  return {
    calculateTonIndex,
    calculateBoltonAnalysis,
    calculatePontAnalysis,
    calculateKorkhausAnalysis,
    calculateSnaginaMethod,
    calculateSlabkovskayaMethod,
    calculateSpeeCurve,
    calculateAllMeasurements,
    checkRequiredPointsForCalculation
  };
};

export default BiometryCalculationsEngine;