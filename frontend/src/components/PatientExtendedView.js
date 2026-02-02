/**
 * Компонент для отображения расширенных данных пациента
 * Показывает все поля в удобочитаемом формате
 */

import React from 'react';
import PatientEnums from '../constants/patientEnums';

const PatientExtendedView = ({ patient }) => {
  if (!patient) {
    return <div>Данные пациента не найдены</div>;
  }

  // Проверка, есть ли хоть какие-то данные в секции
  const hasRegistrationData = patient.registration_republic || patient.registration_city || 
    patient.registration_street || patient.registration_phone;
  
  const hasSocialData = patient.locality_type || patient.marital_status || patient.education_level;
  
  const hasCephalometryFrontalData = patient.cephalometry_zy_zy || patient.cephalometry_n_me || 
    patient.cephalometry_n_sn || patient.face_symmetric !== null || patient.chin_shift;
  
  const hasCephalometryProfileData = patient.profile_type || patient.upper_lip_position;

  return (
    <div className="patient-extended-view">
      {/* Основные данные */}
      <section className="view-section">
        <h3>Основные данные</h3>
        <div className="data-grid">
          <div className="data-item">
            <span className="label">ФИО:</span>
            <span className="value">{patient.full_name}</span>
          </div>
          <div className="data-item">
            <span className="label">Дата рождения:</span>
            <span className="value">{patient.birth_date}</span>
          </div>
          <div className="data-item">
            <span className="label">Пол:</span>
            <span className="value">{PatientEnums.getGenderLabel(patient.gender)}</span>
          </div>
          {patient.contact_info && (
            <div className="data-item">
              <span className="label">Контакты:</span>
              <span className="value">{patient.contact_info}</span>
            </div>
          )}
        </div>
      </section>

      {/* Место регистрации */}
      {hasRegistrationData && (
        <section className="view-section">
          <h3>Место регистрации</h3>
          <div className="data-grid">
            {patient.registration_republic && (
              <div className="data-item">
                <span className="label">Республика/Область:</span>
                <span className="value">{patient.registration_republic}</span>
              </div>
            )}
            {patient.registration_district && (
              <div className="data-item">
                <span className="label">Район:</span>
                <span className="value">{patient.registration_district}</span>
              </div>
            )}
            {patient.registration_city && (
              <div className="data-item">
                <span className="label">Город:</span>
                <span className="value">{patient.registration_city}</span>
              </div>
            )}
            {patient.registration_settlement && (
              <div className="data-item">
                <span className="label">Населенный пункт:</span>
                <span className="value">{patient.registration_settlement}</span>
              </div>
            )}
            {(patient.registration_street || patient.registration_house || patient.registration_apartment) && (
              <div className="data-item">
                <span className="label">Адрес:</span>
                <span className="value">
                  {[
                    patient.registration_street && `ул. ${patient.registration_street}`,
                    patient.registration_house && `д. ${patient.registration_house}`,
                    patient.registration_apartment && `кв. ${patient.registration_apartment}`
                  ].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            {patient.registration_phone && (
              <div className="data-item">
                <span className="label">Телефон:</span>
                <span className="value">{patient.registration_phone}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Социально-демографические данные */}
      {hasSocialData && (
        <section className="view-section">
          <h3>Социально-демографические данные</h3>
          <div className="data-grid">
            {patient.locality_type && (
              <div className="data-item">
                <span className="label">Местность:</span>
                <span className="value">{PatientEnums.getLocalityTypeLabel(patient.locality_type)}</span>
              </div>
            )}
            {patient.marital_status && (
              <div className="data-item">
                <span className="label">Семейное положение:</span>
                <span className="value">{PatientEnums.getMaritalStatusLabel(patient.marital_status)}</span>
              </div>
            )}
            {patient.education_level && (
              <div className="data-item">
                <span className="label">Образование:</span>
                <span className="value">{PatientEnums.getEducationLevelLabel(patient.education_level)}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Кефалометрия - лицо анфас */}
      {hasCephalometryFrontalData && (
        <section className="view-section">
          <h3>19.1. Осмотр лица - Анфас</h3>
          <div className="data-grid">
            {patient.cephalometry_zy_zy && (
              <div className="data-item">
                <span className="label">zy-zy:</span>
                <span className="value">{patient.cephalometry_zy_zy} мм</span>
              </div>
            )}
            {patient.cephalometry_n_me && (
              <div className="data-item">
                <span className="label">n-me:</span>
                <span className="value">{patient.cephalometry_n_me} мм</span>
              </div>
            )}
            {patient.cephalometry_n_sn && (
              <div className="data-item">
                <span className="label">n-sn:</span>
                <span className="value">{patient.cephalometry_n_sn} мм</span>
              </div>
            )}
          </div>
          
          <div className="data-grid">
            {patient.face_symmetric !== null && (
              <div className="data-item">
                <span className="label">Симметричное лицо:</span>
                <span className="value">{patient.face_symmetric ? 'Да' : 'Нет'}</span>
              </div>
            )}
            {patient.chin_shift && (
              <div className="data-item">
                <span className="label">Смещение подбородка:</span>
                <span className="value">{PatientEnums.getChinShiftLabel(patient.chin_shift)}</span>
              </div>
            )}
            {patient.mental_fold_pronounced !== null && (
              <div className="data-item">
                <span className="label">Надподбородочная складка:</span>
                <span className="value">{patient.mental_fold_pronounced ? 'Выражена' : 'Не выражена'}</span>
              </div>
            )}
            {patient.lips_closed !== null && (
              <div className="data-item">
                <span className="label">Губы сомкнуты:</span>
                <span className="value">{patient.lips_closed ? 'Да' : 'Нет'}</span>
              </div>
            )}
            {patient.gummy_smile !== null && (
              <div className="data-item">
                <span className="label">Десневая улыбка:</span>
                <span className="value">{patient.gummy_smile ? 'Есть' : 'Нет'}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Кефалометрия - лицо в профиль */}
      {hasCephalometryProfileData && (
        <section className="view-section">
          <h3>19.2. Осмотр лица - Профиль</h3>
          <div className="data-grid">
            {patient.profile_type && (
              <div className="data-item">
                <span className="label">Тип профиля:</span>
                <span className="value">{PatientEnums.getProfileTypeLabel(patient.profile_type)}</span>
              </div>
            )}
            {patient.upper_lip_position && (
              <div className="data-item">
                <span className="label">Верхняя губа:</span>
                <span className="value">{PatientEnums.getLipPositionLabel(patient.upper_lip_position)}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Временные метки */}
      {(patient.created_at || patient.updated_at) && (
        <section className="view-section metadata">
          <div className="data-grid">
            {patient.created_at && (
              <div className="data-item">
                <span className="label">Создано:</span>
                <span className="value">{new Date(patient.created_at).toLocaleString('ru-RU')}</span>
              </div>
            )}
            {patient.updated_at && (
              <div className="data-item">
                <span className="label">Обновлено:</span>
                <span className="value">{new Date(patient.updated_at).toLocaleString('ru-RU')}</span>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default PatientExtendedView;
