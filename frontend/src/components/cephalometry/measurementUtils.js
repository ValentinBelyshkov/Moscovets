export const calculateLateralMeasurements = (points, calculateAngle, calculateDistance, projectPointOnLine, scale) => {
  const measurements = {};
  
  if (points['S'] && points['N'] && points['A']) {
    const v = calculateAngle(points['S'], points['N'], points['A']);
    measurements.SNA = { name: 'SNA', value: v, unit: '°', norm: '80-84°', interpretation: v < 80 ? 'Ретрогнатия ВЧ' : (v > 84 ? 'Прогнатия ВЧ' : 'Норма') };
  }
  
  if (points['S'] && points['N'] && points['B']) {
    const v = calculateAngle(points['S'], points['N'], points['B']);
    measurements.SNB = { name: 'SNB', value: v, unit: '°', norm: '78-82°', interpretation: v < 78 ? 'Ретрогнатия НЧ' : (v > 82 ? 'Прогнатия НЧ' : 'Норма') };
  }
  
  if (points['A'] && points['N'] && points['B']) {
    const v = calculateAngle(points['A'], points['N'], points['B']);
    measurements.ANB = { name: 'ANB', value: v, unit: '°', norm: '0-4°', interpretation: v < 0 ? 'Мезиальное' : (v > 4 ? 'Дистальное' : 'Норма') };
  }

  if (points['E3'] && points['B'] && points['A']) {
    const perp = projectPointOnLine(points['A'], points['E3'], points['B']);
    if (perp) {
      const v = calculateAngle(points['A'], points['B'], perp);
      measurements.Beta = { name: 'Beta', value: v, unit: '°', norm: '27-35°', interpretation: v < 27 ? 'II класс' : (v > 35 ? 'III класс' : 'I класс (норма)') };
    }
  }

  if (points['N'] && points['S'] && points['Ba']) {
    const v = calculateAngle(points['N'], points['S'], points['Ba']);
    measurements.NSBa = { name: 'N-S-Ba', value: v, unit: '°', norm: '130-133°', interpretation: v < 130 ? 'Прогнатический' : (v > 133 ? 'Ретрогнатический' : 'Норма') };
  }

  // Bjork Sum
  if (points['N'] && points['S'] && points['Ar'] && points['Go'] && points['Me']) {
    const sum = calculateAngle(points['N'], points['S'], points['Ar']) + calculateAngle(points['S'], points['Ar'], points['Go']) + calculateAngle(points['Ar'], points['Go'], points['Me']);
    measurements.Bjork = { name: 'Bjork Sum', value: sum, unit: '°', norm: '<396°', interpretation: sum < 396 ? 'Горизонтальный рост' : 'Норма/Вертикальный' };
  }

  // Wits
  if (points['A'] && points['B'] && points['ii'] && points['P6']) {
    const pA = projectPointOnLine(points['A'], points['ii'], points['P6']);
    const pB = projectPointOnLine(points['B'], points['ii'], points['P6']);
    if (pA && pB) {
      const v = calculateDistance(pA, pB);
      measurements.Wits = { name: 'Wits', value: v, unit: scale > 0 ? 'mm' : 'px', norm: '1mm', interpretation: v < 1 ? 'III класс' : (v > 1 ? 'II класс' : 'Норма') };
    }
  }

  return measurements;
};

export const calculateFrontalMeasurements = (points, calculateDistance, scale) => {
  const measurements = {};
  if (points['J_L'] && points['J_R']) measurements.J_J = { name: 'J-J', value: calculateDistance(points['J_L'], points['J_R']), unit: scale > 0 ? 'mm' : 'px' };
  if (points['U6_L'] && points['U6_R']) measurements.U6_U6 = { name: 'U6-U6', value: calculateDistance(points['U6_L'], points['U6_R']), unit: scale > 0 ? 'mm' : 'px' };
  if (points['L6_L'] && points['L6_R']) measurements.L6_L6 = { name: 'L6-L6', value: calculateDistance(points['L6_L'], points['L6_R']), unit: scale > 0 ? 'mm' : 'px' };
  if (points['Ag_L'] && points['Ag_R']) measurements.Ag_Ag = { name: 'Ag-Ag', value: calculateDistance(points['Ag_L'], points['Ag_R']), unit: scale > 0 ? 'mm' : 'px' };
  return measurements;
};
