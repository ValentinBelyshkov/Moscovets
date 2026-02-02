/**
 * Enum значения для полей пациента
 * Используются для форм и отображения данных
 */

// Пол
export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other'
};

export const GENDER_LABELS = {
  [GENDER.MALE]: 'Мужской',
  [GENDER.FEMALE]: 'Женский',
  [GENDER.OTHER]: 'Другой'
};

// Тип местности
export const LOCALITY_TYPE = {
  URBAN: 'urban',
  RURAL: 'rural'
};

export const LOCALITY_TYPE_LABELS = {
  [LOCALITY_TYPE.URBAN]: 'Городская',
  [LOCALITY_TYPE.RURAL]: 'Сельская'
};

// Семейное положение
export const MARITAL_STATUS = {
  REGISTERED_MARRIAGE: 'registered_marriage',
  UNREGISTERED_MARRIAGE: 'unregistered_marriage',
  NOT_MARRIED: 'not_married',
  UNKNOWN: 'unknown'
};

export const MARITAL_STATUS_LABELS = {
  [MARITAL_STATUS.REGISTERED_MARRIAGE]: 'Зарегистрированный брак',
  [MARITAL_STATUS.UNREGISTERED_MARRIAGE]: 'Незарегистрированный брак',
  [MARITAL_STATUS.NOT_MARRIED]: 'Не состоит',
  [MARITAL_STATUS.UNKNOWN]: 'Неизвестно'
};

// Уровень образования
export const EDUCATION_LEVEL = {
  HIGHER: 'higher',
  INCOMPLETE_HIGHER: 'incomplete_higher',
  SECONDARY: 'secondary',
  PRIMARY: 'primary',
  NONE: 'none',
  UNKNOWN: 'unknown'
};

export const EDUCATION_LEVEL_LABELS = {
  [EDUCATION_LEVEL.HIGHER]: 'Высшее',
  [EDUCATION_LEVEL.INCOMPLETE_HIGHER]: 'Неполное высшее',
  [EDUCATION_LEVEL.SECONDARY]: 'Среднее (полное)',
  [EDUCATION_LEVEL.PRIMARY]: 'Начальное',
  [EDUCATION_LEVEL.NONE]: 'Не имеет',
  [EDUCATION_LEVEL.UNKNOWN]: 'Неизвестно'
};

// Тип профиля
export const PROFILE_TYPE = {
  CONVEX: 'convex',
  CONCAVE: 'concave',
  STRAIGHT: 'straight'
};

export const PROFILE_TYPE_LABELS = {
  [PROFILE_TYPE.CONVEX]: 'Выпуклый',
  [PROFILE_TYPE.CONCAVE]: 'Вогнутый',
  [PROFILE_TYPE.STRAIGHT]: 'Прямой'
};

// Положение верхней губы
export const LIP_POSITION = {
  PROTRUDES: 'protrudes',
  RECEDES: 'recedes',
  CORRECT: 'correct'
};

export const LIP_POSITION_LABELS = {
  [LIP_POSITION.PROTRUDES]: 'Выступает',
  [LIP_POSITION.RECEDES]: 'Западает',
  [LIP_POSITION.CORRECT]: 'Правильное'
};

// Смещение подбородка
export const CHIN_SHIFT = {
  RIGHT: 'right',
  LEFT: 'left',
  NONE: 'none'
};

export const CHIN_SHIFT_LABELS = {
  [CHIN_SHIFT.RIGHT]: 'Вправо',
  [CHIN_SHIFT.LEFT]: 'Влево',
  [CHIN_SHIFT.NONE]: 'Нет смещения'
};

/**
 * Получить все enum значения для select-полей
 */
export const getEnumOptions = (enumObj, labelsObj) => {
  return Object.keys(enumObj).map(key => ({
    value: enumObj[key],
    label: labelsObj[enumObj[key]]
  }));
};

/**
 * Получить label по значению enum
 */
export const getEnumLabel = (value, labelsObj) => {
  return labelsObj[value] || value;
};

/**
 * Утилиты для работы с enum полями пациента
 */
export const PatientEnums = {
  // Геттеры для options селектов
  getGenderOptions: () => getEnumOptions(GENDER, GENDER_LABELS),
  getLocalityTypeOptions: () => getEnumOptions(LOCALITY_TYPE, LOCALITY_TYPE_LABELS),
  getMaritalStatusOptions: () => getEnumOptions(MARITAL_STATUS, MARITAL_STATUS_LABELS),
  getEducationLevelOptions: () => getEnumOptions(EDUCATION_LEVEL, EDUCATION_LEVEL_LABELS),
  getProfileTypeOptions: () => getEnumOptions(PROFILE_TYPE, PROFILE_TYPE_LABELS),
  getLipPositionOptions: () => getEnumOptions(LIP_POSITION, LIP_POSITION_LABELS),
  getChinShiftOptions: () => getEnumOptions(CHIN_SHIFT, CHIN_SHIFT_LABELS),
  
  // Геттеры для labels
  getGenderLabel: (value) => getEnumLabel(value, GENDER_LABELS),
  getLocalityTypeLabel: (value) => getEnumLabel(value, LOCALITY_TYPE_LABELS),
  getMaritalStatusLabel: (value) => getEnumLabel(value, MARITAL_STATUS_LABELS),
  getEducationLevelLabel: (value) => getEnumLabel(value, EDUCATION_LEVEL_LABELS),
  getProfileTypeLabel: (value) => getEnumLabel(value, PROFILE_TYPE_LABELS),
  getLipPositionLabel: (value) => getEnumLabel(value, LIP_POSITION_LABELS),
  getChinShiftLabel: (value) => getEnumLabel(value, CHIN_SHIFT_LABELS)
};

export default PatientEnums;
