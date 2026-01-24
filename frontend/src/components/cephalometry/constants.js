export const INITIAL_CEPHALOMETRY_DATA = {
  patientName: 'John Doe',
  analysisDate: new Date().toISOString().split('T')[0],
  images: {
    frontal: null,
    lateral: null,
    profile45: null,
    intraoral: null
  },
  imageDimensions: { width: 0, height: 0 },
  scale: 1, // pixels per mm
  scaleMode: '10mm', // '10mm' or '30mm' for lateral projection
  scalePoints: { point0: null, point10: null }, // For 10mm mode
  scalePoints30: { point0: null, point30: null }, // For 30mm mode
  isSettingScale: false, // Flag to indicate if we're in scale setting mode
  projectionType: 'frontal', // 'frontal', 'lateral', 'profile45', 'intraoral'
  points: {},
  measurements: {},
  interpretation: {},
  // New calibration system for frontal projection
  calibrationType: 'implant', // 'implant', 'crown', 'distance', 'known_object'
  calibrationObjectSize: 10, // Size in mm for the selected object
  calibrationPoints: { point1: null, point2: null }, // Points for calibration
  calibrationDistance: 0 // Distance between calibration points in mm
};

export const POINT_DEFINITIONS = {
  frontal: [
    { id: 'eu_L', name: 'eu_L - Латерально выступающая точка на боковой поверхности головы слева' },
    { id: 'eu_R', name: 'eu_R - Латерально выступающая точка на боковой поверхности головы справа' },
    { id: 'zy_L', name: 'zy_L - Наиболее выступающая кнаружи точка скуловой дуги слева' },
    { id: 'zy_R', name: 'zy_R - Наиболее выступающая кнаружи точка скуловой дуги справа' },
    { id: 'go_L', name: 'go_L - Точка угла нижней челюсти слева' },
    { id: 'go_R', name: 'go_R - Точка угла нижней челюсти справа' },
    { id: 'n', name: 'n - Nasion (наиболее глубокая точка между носом и лбом)' },
    { id: 'sn', name: 'sn - Subnasale (середина перехода перегородки носа к верхней губе)' },
    { id: 'gn', name: 'gn - Gnatios (наиболее выступающая точка подбородка)' },
    { id: 'pg', name: 'pg - Pogonion (наиболее выступающая точка подбородочного выступа)' },
    { id: 'oph', name: 'oph - Оphrion (точка на пересечении средней линии лица и касательной к надбровным дугам)' }
  ],
  lateral: [
    { id: 'S', name: 'S - Sella (точка в центре турецкого седла)' },
    { id: 'N', name: 'N - Nasion (наиболее глубокая точка между носом и лбом)' },
    { id: 'A', name: 'A - A point (точка на наиболее глубокой части передней стенки альвеолярного гребня верхней челюсти)' },
    { id: 'B', name: 'B - B point (точка на наиболее глубокой части передней стенки альвеолярного гребня нижней челюсти)' },
    { id: 'PNS', name: 'PNS - Posterior Nasal Spine (задняя носовая ость)' },
    { id: 'ANS', name: 'ANS - Anterior Nasal Spine (передняя носовая ость)' },
    { id: 'Go', name: 'Go - Gonion (точка на углу нижней челюсти)' },
    { id: 'Me', name: 'Me - Menton (точка на нижней точке подбородка)' },
    { id: 'Pg', name: 'Pg - Pogonion (наиболее выступающая точка подбородочного выступа)' },
    { id: 'Ar', name: 'Ar - Articulare (точка на пересечении контуров нижнего края ветви и заднего края мыщелкового отростка)' },
    { id: 'Ba', name: 'Ba - Basion (точка на нижнем конце передней границы большого затылочного отверстия)' },
    { id: 'Gn', name: 'Gn - Gnathion (точка на нижней точке подбородочного выступа)' },
    { id: 'E1', name: 'E1 - Точка на середине режущих краев резцов (середина отрезка между точками ii и Is)' },
    { id: 'P6', name: 'P6 - Точка на пересечении касательной к нижнему краю носа и линии ii-Is' },
    { id: 'ii', name: 'ii - Incision Inferius (точка на режущем крае нижнего центрального резца)' },
    { id: 'Is', name: 'Is - Incision Superius (точка на режущем крае верхнего центрального резца)' },
    { id: 'Aii', name: 'Aii - Точка на альвеолярной дуге у основания нижнего центрального резца' },
    { id: 'Ais', name: 'Ais - Точка на альвеолярной дуге у основания верхнего центрального резца' }
  ],
  profile45: [
    { id: 'n', name: 'n - Nasion (наиболее глубокая точка между носом и лбом)' },
    { id: 'sn', name: 'sn - Subnasale (середина перехода перегородки носа к верхней губе)' },
    { id: 'pg', name: 'pg - Pogonion (наиболее выступающая точка подбородочного выступа)' },
    { id: 'zy_L', name: 'zy_L - Наиболее выступающая кнаружи точка скуловой дуги слева' },
    { id: 'zy_R', name: 'zy_R - Наиболее выступающая кнаружи точка скуловой дуги справа' }
  ],
  intraoral: [
    { id: 'midline_upper', name: 'midline_upper - Средняя линия верхней челюсти' },
    { id: 'midline_lower', name: 'midline_lower - Средняя линия нижней челюсти' },
    { id: 'canine_R', name: 'canine_R - Клык справа' },
    { id: 'canine_L', name: 'canine_L - Клык слева' },
    { id: 'molar_R', name: 'molar_R - Первый моляр справа' },
    { id: 'molar_L', name: 'molar_L - Первый моляр слева' }
  ]
};
