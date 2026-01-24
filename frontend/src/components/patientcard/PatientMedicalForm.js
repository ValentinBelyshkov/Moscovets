import React from 'react';

const PatientMedicalForm = ({ formData, onChange }) => {
  const handleChange = (e, fieldPath) => {
    const { name, value, type, checked } = e.target;
    
    if (fieldPath) {
      // Обработка вложенных полей (например, registration.city)
      onChange(e, fieldPath);
    } else if (type === 'checkbox') {
      // Для checkbox используем checked вместо value
      onChange({ target: { name, value: checked ? 'Да' : 'Нет' } });
    } else {
      onChange(e);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden mt-6">
      <div className="p-6 lg:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Медицинская карта пациента</h2>
        
        <form className="space-y-8">
          {/* СТРАНИЦА 1 - Личные данные */}
          <section className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">1. ФАМИЛИЯ, ИМЯ, ОТЧЕСТВО:</h3>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="ФИО"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">2. ПОЛ:</h3>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">муж.</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">жен.</span>
                </label>
              </div>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">3. ДАТА РОЖДЕНИЯ:</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="число"
                  name="birthDay"
                  value={formData.birthDay}
                  onChange={handleChange}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="месяц"
                  name="birthMonth"
                  value={formData.birthMonth}
                  onChange={handleChange}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="год"
                  name="birthYear"
                  value={formData.birthYear}
                  onChange={handleChange}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">4. МЕСТО РЕГИСТРАЦИИ:</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="республика, край, область"
                  value={formData.registration.republic}
                  onChange={(e) => handleChange(e, 'registration.republic')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="район"
                  value={formData.registration.region}
                  onChange={(e) => handleChange(e, 'registration.region')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="город"
                  value={formData.registration.city}
                  onChange={(e) => handleChange(e, 'registration.city')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="населенный пункт"
                  value={formData.registration.settlement}
                  onChange={(e) => handleChange(e, 'registration.settlement')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="улица"
                  value={formData.registration.street}
                  onChange={(e) => handleChange(e, 'registration.street')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="дом"
                    value={formData.registration.house}
                    onChange={(e) => handleChange(e, 'registration.house')}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="квартира"
                    value={formData.registration.apartment}
                    onChange={(e) => handleChange(e, 'registration.apartment')}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <input
                  type="text"
                  placeholder="тел."
                  value={formData.registration.phone}
                  onChange={(e) => handleChange(e, 'registration.phone')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">5. МЕСТНОСТЬ:</h3>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="locality"
                    value="urban"
                    checked={formData.locality === 'urban'}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">городская</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="locality"
                    value="rural"
                    checked={formData.locality === 'rural'}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">сельская</span>
                </label>
              </div>
            </div>
          </section>

          {/* СТРАНИЦА 2 - Дополнительная информация */}
          <section className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">6. СЕМЕЙНОЕ ПОЛОЖЕНИЕ:</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="maritalStatus"
                    value="married"
                    checked={formData.maritalStatus === 'married'}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">зарегистрированный брак</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="maritalStatus"
                    value="unregistered"
                    checked={formData.maritalStatus === 'unregistered'}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">незарегистрированный брак</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="maritalStatus"
                    value="single"
                    checked={formData.maritalStatus === 'single'}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">не состоит</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="maritalStatus"
                    value="unknown"
                    checked={formData.maritalStatus === 'unknown'}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">неизвестно</span>
                </label>
              </div>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">7. ОБРАЗОВАНИЕ:</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="education"
                    value="higher"
                    checked={formData.education === 'higher'}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">высшее</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="education"
                    value="incomplete_higher"
                    checked={formData.education === 'incomplete_higher'}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">неполное высшее</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="education"
                    value="secondary"
                    checked={formData.education === 'secondary'}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">среднее (полное)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="education"
                    value="basic"
                    checked={formData.education === 'basic'}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">начальное</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="education"
                    value="none"
                    checked={formData.education === 'none'}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">не имеет</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="education"
                    value="unknown"
                    checked={formData.education === 'unknown'}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">неизвестно</span>
                </label>
              </div>
            </div>
          </section>

          {/* СТРАНИЦА 3 - Кефалометрия */}
          <section className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">19. ОСМОТР ЛИЦА. КЕФАЛОМЕТРИЯ</h3>
              
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-3">19.1. Лицо анфас:</h4>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="zy-zy мм"
                      value={formData.faceFront.width}
                      onChange={(e) => handleChange(e, 'faceFront.width')}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="n-me мм"
                      value={formData.faceFront.heightNasal}
                      onChange={(e) => handleChange(e, 'faceFront.heightNasal')}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="n-sn мм"
                      value={formData.faceFront.heightSubnasal}
                      onChange={(e) => handleChange(e, 'faceFront.heightSubnasal')}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="faceFront.symmetry"
                        checked={formData.faceFront.symmetry === 'Да'}
                        onChange={(e) => handleChange(e, 'faceFront.symmetry')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-gray-700">Симметричное</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="faceFront.chinPosition"
                        checked={formData.faceFront.chinPosition === 'Вправо'}
                        onChange={(e) => handleChange(e, 'faceFront.chinPosition')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-gray-700">Подбородок смещен Вправо</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="faceFront.nasolabialFold"
                        checked={formData.faceFront.nasolabialFold === 'Да'}
                        onChange={(e) => handleChange(e, 'faceFront.nasolabialFold')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-gray-700">Выраженность надподбородочной складки</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="faceFront.lipClosure"
                        checked={formData.faceFront.lipClosure === 'Да'}
                        onChange={(e) => handleChange(e, 'faceFront.lipClosure')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-gray-700">Губы сомкнуты</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="faceFront.gumSmile"
                        checked={formData.faceFront.gumSmile === 'Да'}
                        onChange={(e) => handleChange(e, 'faceFront.gumSmile')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-gray-700">Симптом «десневой улыбки»</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-3">19.2. Лицо в профиль:</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Тип профиля:</p>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="faceProfile.type"
                          value="convex"
                          checked={formData.faceProfile.type === 'convex'}
                          onChange={handleChange}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700">Выпуклый</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="faceProfile.type"
                          value="concave"
                          checked={formData.faceProfile.type === 'concave'}
                          onChange={handleChange}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700">Вогнутый</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="faceProfile.type"
                          value="straight"
                          checked={formData.faceProfile.type === 'straight'}
                          onChange={handleChange}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700">Прямой</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Верхняя губа:</p>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="faceProfile.upperLip"
                          value="protruding"
                          checked={formData.faceProfile.upperLip === 'protruding'}
                          onChange={handleChange}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700">Выступает</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="faceProfile.upperLip"
                          value="retracted"
                          checked={formData.faceProfile.upperLip === 'retracted'}
                          onChange={handleChange}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700">Западает</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="faceProfile.upperLip"
                          value="normal"
                          checked={formData.faceProfile.upperLip === 'normal'}
                          onChange={handleChange}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700">Правильное</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Кнопка сохранения */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              onClick={() => {
                // Reset form if needed
              }}
            >
              Отменить
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              onClick={(e) => {
                e.preventDefault();
                console.log('Saving medical form:', formData);
              }}
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientMedicalForm;
