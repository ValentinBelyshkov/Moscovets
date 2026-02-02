/**
 * Компонент формы с расширенными полями пациента
 * Используется для создания/редактирования пациента с полной информацией
 */

import React, { useState } from 'react';
import PatientEnums from '../constants/patientEnums';

const PatientExtendedForm = ({ initialData = {}, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    // Основные поля
    full_name: initialData.full_name || '',
    birth_date: initialData.birth_date || '',
    gender: initialData.gender || '',
    contact_info: initialData.contact_info || '',
    
    // Место регистрации
    registration_republic: initialData.registration_republic || '',
    registration_district: initialData.registration_district || '',
    registration_city: initialData.registration_city || '',
    registration_settlement: initialData.registration_settlement || '',
    registration_street: initialData.registration_street || '',
    registration_house: initialData.registration_house || '',
    registration_apartment: initialData.registration_apartment || '',
    registration_phone: initialData.registration_phone || '',
    
    // Социально-демографические данные
    locality_type: initialData.locality_type || '',
    marital_status: initialData.marital_status || '',
    education_level: initialData.education_level || '',
    
    // Кефалометрия - лицо анфас
    cephalometry_zy_zy: initialData.cephalometry_zy_zy || '',
    cephalometry_n_me: initialData.cephalometry_n_me || '',
    cephalometry_n_sn: initialData.cephalometry_n_sn || '',
    face_symmetric: initialData.face_symmetric ?? null,
    chin_shift: initialData.chin_shift || '',
    mental_fold_pronounced: initialData.mental_fold_pronounced ?? null,
    lips_closed: initialData.lips_closed ?? null,
    gummy_smile: initialData.gummy_smile ?? null,
    
    // Кефалометрия - лицо в профиль
    profile_type: initialData.profile_type || '',
    upper_lip_position: initialData.upper_lip_position || ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Очищаем пустые строки и null значения
    const cleanedData = {};
    Object.keys(formData).forEach(key => {
      const value = formData[key];
      if (value !== '' && value !== null) {
        cleanedData[key] = value;
      }
    });
    
    onSubmit(cleanedData);
  };

  return (
    <form onSubmit={handleSubmit} className="patient-extended-form">
      {/* Основные данные */}
      <section className="form-section">
        <h3>1. Основные данные</h3>
        
        <div className="form-group">
          <label htmlFor="full_name">ФИО *</label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            placeholder="Фамилия Имя Отчество"
          />
        </div>

        <div className="form-group">
          <label htmlFor="birth_date">Дата рождения *</label>
          <input
            type="date"
            id="birth_date"
            name="birth_date"
            value={formData.birth_date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="gender">Пол *</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
          >
            <option value="">Выберите пол</option>
            {PatientEnums.getGenderOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="contact_info">Контактная информация</label>
          <input
            type="text"
            id="contact_info"
            name="contact_info"
            value={formData.contact_info}
            onChange={handleChange}
            placeholder="+7 (999) 123-45-67"
          />
        </div>
      </section>

      {/* Место регистрации */}
      <section className="form-section">
        <h3>4. Место регистрации</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="registration_republic">Республика, край, область</label>
            <input
              type="text"
              id="registration_republic"
              name="registration_republic"
              value={formData.registration_republic}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="registration_district">Район</label>
            <input
              type="text"
              id="registration_district"
              name="registration_district"
              value={formData.registration_district}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="registration_city">Город</label>
            <input
              type="text"
              id="registration_city"
              name="registration_city"
              value={formData.registration_city}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="registration_settlement">Населенный пункт</label>
            <input
              type="text"
              id="registration_settlement"
              name="registration_settlement"
              value={formData.registration_settlement}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="registration_street">Улица</label>
            <input
              type="text"
              id="registration_street"
              name="registration_street"
              value={formData.registration_street}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="registration_house">Дом</label>
            <input
              type="text"
              id="registration_house"
              name="registration_house"
              value={formData.registration_house}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="registration_apartment">Квартира</label>
            <input
              type="text"
              id="registration_apartment"
              name="registration_apartment"
              value={formData.registration_apartment}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="registration_phone">Телефон</label>
          <input
            type="tel"
            id="registration_phone"
            name="registration_phone"
            value={formData.registration_phone}
            onChange={handleChange}
            placeholder="+7 (999) 123-45-67"
          />
        </div>
      </section>

      {/* Социально-демографические данные */}
      <section className="form-section">
        <h3>5-7. Социально-демографические данные</h3>
        
        <div className="form-group">
          <label htmlFor="locality_type">Местность</label>
          <select
            id="locality_type"
            name="locality_type"
            value={formData.locality_type}
            onChange={handleChange}
          >
            <option value="">Не указано</option>
            {PatientEnums.getLocalityTypeOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="marital_status">Семейное положение</label>
          <select
            id="marital_status"
            name="marital_status"
            value={formData.marital_status}
            onChange={handleChange}
          >
            <option value="">Не указано</option>
            {PatientEnums.getMaritalStatusOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="education_level">Образование</label>
          <select
            id="education_level"
            name="education_level"
            value={formData.education_level}
            onChange={handleChange}
          >
            <option value="">Не указано</option>
            {PatientEnums.getEducationLevelOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Кефалометрия - лицо анфас */}
      <section className="form-section">
        <h3>19.1. Осмотр лица - Анфас</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="cephalometry_zy_zy">zy-zy (мм)</label>
            <input
              type="number"
              step="0.1"
              id="cephalometry_zy_zy"
              name="cephalometry_zy_zy"
              value={formData.cephalometry_zy_zy}
              onChange={handleChange}
              placeholder="145.5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cephalometry_n_me">n-me (мм)</label>
            <input
              type="number"
              step="0.1"
              id="cephalometry_n_me"
              name="cephalometry_n_me"
              value={formData.cephalometry_n_me}
              onChange={handleChange}
              placeholder="120.3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cephalometry_n_sn">n-sn (мм)</label>
            <input
              type="number"
              step="0.1"
              id="cephalometry_n_sn"
              name="cephalometry_n_sn"
              value={formData.cephalometry_n_sn}
              onChange={handleChange}
              placeholder="65.7"
            />
          </div>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="face_symmetric"
              checked={formData.face_symmetric || false}
              onChange={handleChange}
            />
            Симметричное лицо
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="chin_shift">Смещение подбородка</label>
          <select
            id="chin_shift"
            name="chin_shift"
            value={formData.chin_shift}
            onChange={handleChange}
          >
            <option value="">Не указано</option>
            {PatientEnums.getChinShiftOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="mental_fold_pronounced"
              checked={formData.mental_fold_pronounced || false}
              onChange={handleChange}
            />
            Выраженность надподбородочной складки
          </label>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="lips_closed"
              checked={formData.lips_closed || false}
              onChange={handleChange}
            />
            Губы сомкнуты
          </label>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="gummy_smile"
              checked={formData.gummy_smile || false}
              onChange={handleChange}
            />
            Симптом «десневой улыбки»
          </label>
        </div>
      </section>

      {/* Кефалометрия - лицо в профиль */}
      <section className="form-section">
        <h3>19.2. Осмотр лица - Профиль</h3>
        
        <div className="form-group">
          <label htmlFor="profile_type">Тип профиля</label>
          <select
            id="profile_type"
            name="profile_type"
            value={formData.profile_type}
            onChange={handleChange}
          >
            <option value="">Не указано</option>
            {PatientEnums.getProfileTypeOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="upper_lip_position">Верхняя губа</label>
          <select
            id="upper_lip_position"
            name="upper_lip_position"
            value={formData.upper_lip_position}
            onChange={handleChange}
          >
            <option value="">Не указано</option>
            {PatientEnums.getLipPositionOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Кнопки действий */}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Сохранить
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
};

export default PatientExtendedForm;
