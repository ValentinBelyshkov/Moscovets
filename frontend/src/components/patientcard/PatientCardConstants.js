// Constants for PatientCard component

export const MODULE_TABS = [
  { id: 'overview', label: 'Медицинская карта', icon: '📋' },
  { id: 'photometry', label: 'Фотометрия', icon: '📷' },
  { id: 'cephalometry', label: 'Цефалометрия', icon: '🦴' },
  { id: 'biometry', label: 'Биометрия', icon: '📐' },
  { id: 'modeling', label: '3D Модели', icon: '🖥️' },
  { id: 'ct', label: 'КТ', icon: '🩻' },
  { id: 'history', label: 'История', icon: '📝' }
];

export const MODULE_INFO = {
  photometry: {
    name: 'Фотометрия',
    icon: '📷',
    color: 'bg-blue-500'
  },
  cephalometry: {
    name: 'Цефалометрия',
    icon: '🦴',
    color: 'bg-emerald-500'
  },
  biometry: {
    name: 'Биометрия',
    icon: '📐',
    color: 'bg-purple-500'
  },
  modeling: {
    name: '3D Моделирование',
    icon: '🖥️',
    color: 'bg-amber-500'
  },
  ct: {
    name: 'КТ Анализ',
    icon: '🩻',
    color: 'bg-rose-500'
  }
};
