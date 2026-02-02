# Примеры использования расширенных полей пациента

## Содержание
1. [Импорты](#импорты)
2. [Использование констант](#использование-констант)
3. [Форма создания/редактирования](#форма-созданияредактирования)
4. [Отображение данных](#отображение-данных)
5. [Работа с API](#работа-с-api)

## Импорты

```javascript
// Константы enum
import PatientEnums from '../constants/patientEnums';

// Компоненты
import PatientExtendedForm from '../components/PatientExtendedForm';
import PatientExtendedView from '../components/PatientExtendedView';

// Стили
import '../styles/patientExtended.css';

// Сервисы
import patientService from '../services/patientService';
```

## Использование констант

### В select-полях

```javascript
function GenderSelect() {
  const [gender, setGender] = useState('');

  return (
    <select value={gender} onChange={(e) => setGender(e.target.value)}>
      <option value="">Выберите пол</option>
      {PatientEnums.getGenderOptions().map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
```

### Получение label для отображения

```javascript
function PatientInfo({ patient }) {
  return (
    <div>
      <p>Пол: {PatientEnums.getGenderLabel(patient.gender)}</p>
      <p>Образование: {PatientEnums.getEducationLevelLabel(patient.education_level)}</p>
      <p>Тип профиля: {PatientEnums.getProfileTypeLabel(patient.profile_type)}</p>
    </div>
  );
}
```

### Все доступные методы

```javascript
// Геттеры для options (для select)
PatientEnums.getGenderOptions()
PatientEnums.getLocalityTypeOptions()
PatientEnums.getMaritalStatusOptions()
PatientEnums.getEducationLevelOptions()
PatientEnums.getProfileTypeOptions()
PatientEnums.getLipPositionOptions()
PatientEnums.getChinShiftOptions()

// Геттеры для labels (для отображения)
PatientEnums.getGenderLabel(value)
PatientEnums.getLocalityTypeLabel(value)
PatientEnums.getMaritalStatusLabel(value)
PatientEnums.getEducationLevelLabel(value)
PatientEnums.getProfileTypeLabel(value)
PatientEnums.getLipPositionLabel(value)
PatientEnums.getChinShiftLabel(value)
```

## Форма создания/редактирования

### Создание нового пациента

```javascript
import React, { useState } from 'react';
import PatientExtendedForm from '../components/PatientExtendedForm';
import patientService from '../services/patientService';

function CreatePatientPage() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      const newPatient = await patientService.createPatient(formData);
      console.log('Пациент создан:', newPatient);
      // Перенаправление или уведомление
      window.location.href = `#/patients/${newPatient.id}`;
    } catch (err) {
      setError('Ошибка при создании пациента: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Новый пациент</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div>Сохранение...</div>}
      <PatientExtendedForm 
        onSubmit={handleSubmit}
        onCancel={() => window.history.back()}
      />
    </div>
  );
}
```

### Редактирование существующего пациента

```javascript
import React, { useState, useEffect } from 'react';
import PatientExtendedForm from '../components/PatientExtendedForm';
import patientService from '../services/patientService';

function EditPatientPage({ patientId }) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPatient();
  }, [patientId]);

  const loadPatient = async () => {
    try {
      const data = await patientService.getPatientById(patientId);
      setPatient(data);
    } catch (err) {
      setError('Ошибка загрузки данных пациента');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      const updatedPatient = await patientService.updatePatient(patientId, formData);
      console.log('Пациент обновлен:', updatedPatient);
      setPatient(updatedPatient);
      // Уведомление об успехе
      alert('Данные успешно сохранены');
    } catch (err) {
      setError('Ошибка при обновлении пациента: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!patient) return <div>Пациент не найден</div>;

  return (
    <div>
      <h1>Редактирование: {patient.full_name}</h1>
      <PatientExtendedForm 
        initialData={patient}
        onSubmit={handleSubmit}
        onCancel={() => window.history.back()}
      />
    </div>
  );
}
```

## Отображение данных

### Просмотр карточки пациента

```javascript
import React, { useState, useEffect } from 'react';
import PatientExtendedView from '../components/PatientExtendedView';
import patientService from '../services/patientService';

function PatientDetailsPage({ patientId }) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatient();
  }, [patientId]);

  const loadPatient = async () => {
    try {
      const data = await patientService.getPatientById(patientId);
      setPatient(data);
    } catch (err) {
      console.error('Ошибка загрузки пациента:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Карточка пациента</h1>
        <button onClick={() => window.location.href = `#/patients/${patientId}/edit`}>
          Редактировать
        </button>
      </div>
      <PatientExtendedView patient={patient} />
    </div>
  );
}
```

### Компактное отображение в списке

```javascript
import React from 'react';
import PatientEnums from '../constants/patientEnums';

function PatientListItem({ patient }) {
  const age = new Date().getFullYear() - new Date(patient.birth_date).getFullYear();

  return (
    <div className="patient-list-item">
      <div className="patient-main-info">
        <h3>{patient.full_name}</h3>
        <span className="patient-meta">
          {age} лет, {PatientEnums.getGenderLabel(patient.gender)}
        </span>
      </div>
      
      {patient.registration_city && (
        <div className="patient-secondary-info">
          <span>📍 {patient.registration_city}</span>
        </div>
      )}
      
      {patient.education_level && (
        <div className="patient-tag">
          {PatientEnums.getEducationLevelLabel(patient.education_level)}
        </div>
      )}
    </div>
  );
}
```

## Работа с API

### Создание пациента через API

```javascript
const createPatient = async () => {
  const patientData = {
    full_name: "Иванов Иван Иванович",
    birth_date: "1985-05-15",
    gender: "male",
    contact_info: "+7 (999) 123-45-67",
    
    // Место регистрации
    registration_city: "Москва",
    registration_street: "Ленина",
    registration_house: "10",
    
    // Социально-демографические данные
    locality_type: "urban",
    marital_status: "registered_marriage",
    education_level: "higher",
    
    // Кефалометрия
    cephalometry_zy_zy: 145.5,
    cephalometry_n_me: 120.3,
    face_symmetric: true,
    profile_type: "straight"
  };

  try {
    const response = await patientService.createPatient(patientData);
    console.log('Создан пациент:', response);
    return response;
  } catch (error) {
    console.error('Ошибка:', error);
    throw error;
  }
};
```

### Частичное обновление пациента

```javascript
const updateCephalometry = async (patientId) => {
  const updateData = {
    // Обновляем только кефалометрические данные
    cephalometry_zy_zy: 146.0,
    cephalometry_n_me: 121.0,
    profile_type: "convex"
  };

  try {
    const response = await patientService.updatePatient(patientId, updateData);
    console.log('Обновлены данные:', response);
    return response;
  } catch (error) {
    console.error('Ошибка:', error);
    throw error;
  }
};
```

### Фильтрация пациентов

```javascript
const filterPatients = (patients, filters) => {
  return patients.filter(patient => {
    // Фильтр по полу
    if (filters.gender && patient.gender !== filters.gender) {
      return false;
    }
    
    // Фильтр по образованию
    if (filters.education_level && patient.education_level !== filters.education_level) {
      return false;
    }
    
    // Фильтр по местности
    if (filters.locality_type && patient.locality_type !== filters.locality_type) {
      return false;
    }
    
    // Фильтр по городу
    if (filters.city && !patient.registration_city?.includes(filters.city)) {
      return false;
    }
    
    return true;
  });
};

// Использование
const filteredPatients = filterPatients(allPatients, {
  gender: 'male',
  education_level: 'higher',
  locality_type: 'urban'
});
```

### Поиск по пациентам

```javascript
const searchPatients = (patients, searchTerm) => {
  const term = searchTerm.toLowerCase();
  
  return patients.filter(patient => {
    // Поиск по ФИО
    if (patient.full_name?.toLowerCase().includes(term)) {
      return true;
    }
    
    // Поиск по городу
    if (patient.registration_city?.toLowerCase().includes(term)) {
      return true;
    }
    
    // Поиск по телефону
    if (patient.contact_info?.includes(searchTerm)) {
      return true;
    }
    
    return false;
  });
};
```

## Валидация данных

### Пример валидации формы

```javascript
const validatePatientData = (data) => {
  const errors = {};

  // Обязательные поля
  if (!data.full_name || data.full_name.trim() === '') {
    errors.full_name = 'ФИО обязательно для заполнения';
  }

  if (!data.birth_date) {
    errors.birth_date = 'Дата рождения обязательна';
  } else {
    const birthDate = new Date(data.birth_date);
    const today = new Date();
    if (birthDate > today) {
      errors.birth_date = 'Дата рождения не может быть в будущем';
    }
  }

  if (!data.gender) {
    errors.gender = 'Пол обязателен для заполнения';
  }

  // Валидация кефалометрических измерений
  if (data.cephalometry_zy_zy && (data.cephalometry_zy_zy < 0 || data.cephalometry_zy_zy > 300)) {
    errors.cephalometry_zy_zy = 'Значение должно быть от 0 до 300 мм';
  }

  if (data.cephalometry_n_me && (data.cephalometry_n_me < 0 || data.cephalometry_n_me > 300)) {
    errors.cephalometry_n_me = 'Значение должно быть от 0 до 300 мм';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Использование
const { isValid, errors } = validatePatientData(formData);
if (!isValid) {
  console.error('Ошибки валидации:', errors);
  // Показать ошибки пользователю
}
```

## Экспорт данных

### Экспорт в CSV

```javascript
const exportPatientToCSV = (patient) => {
  const headers = [
    'ФИО',
    'Дата рождения',
    'Пол',
    'Город',
    'Образование',
    'zy-zy (мм)',
    'n-me (мм)',
    'Тип профиля'
  ];

  const row = [
    patient.full_name,
    patient.birth_date,
    PatientEnums.getGenderLabel(patient.gender),
    patient.registration_city || '',
    PatientEnums.getEducationLevelLabel(patient.education_level) || '',
    patient.cephalometry_zy_zy || '',
    patient.cephalometry_n_me || '',
    PatientEnums.getProfileTypeLabel(patient.profile_type) || ''
  ];

  const csv = [headers.join(','), row.join(',')].join('\n');
  
  // Скачать файл
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `patient_${patient.id}.csv`;
  link.click();
};
```

## Интеграция с DataContext

```javascript
import { useContext } from 'react';
import { DataContext } from '../contexts/DataContext';

function PatientDataIntegration({ patientId }) {
  const { updatePatientData } = useContext(DataContext);

  const handleSave = async (formData) => {
    const savedPatient = await patientService.updatePatient(patientId, formData);
    
    // Обновляем контекст
    updatePatientData(savedPatient);
    
    // Сохраняем в localStorage
    localStorage.setItem(`patient_${patientId}`, JSON.stringify(savedPatient));
  };

  return (
    <PatientExtendedForm onSubmit={handleSave} />
  );
}
```
