// Constants for MedicalCard component

export const MODULE_TABS = [
  { id: 'overview', label: 'Обзор', icon: '📊' },
  { id: 'personal', label: 'Персональные данные', icon: '👤' },
  { id: 'anamnesis', label: 'Анамнез', icon: '📋' },
  { id: 'photo', label: 'Фотометрия', icon: '📷' },
  { id: 'intraoral', label: 'Внутриротовой анализ', icon: '🦷' },
  { id: 'anthropometry', label: 'Антропометрия', icon: '📐' },
  { id: 'cephalometry', label: 'Цефалометрия', icon: '🦴' },
  { id: 'modeling3d', label: '3D Моделирование', icon: '🖥️' },
  { id: 'ct', label: 'КТ анализ', icon: '🏥' },
  { id: 'diagnosis', label: 'Диагнозы', icon: '🏥' },
  { id: 'treatment', label: 'План лечения', icon: '📋' },
  { id: 'conclusions', label: 'Выводы', icon: '📝' }
];

export const EXPORT_SLIDE_TITLES = {
  title: 'Титульный лист',
  anamnesis: 'Анамнез',
  photoAnalysis: 'Фотометрический анализ',
  intraoralAnalysis: 'Внутриротовой анализ',
  anthropometry: 'Антропометрия',
  frontalTRG: 'Цефалометрия (прямая ТРГ)',
  lateralTRG: 'Цефалометрия (боковая ТРГ)',
  modeling3D: '3D Моделирование',
  ctAnalysis: 'КТ анализ',
  diagnoses: 'Диагнозы',
  treatmentPlan: 'План лечения',
  conclusions: 'Выводы'
};
