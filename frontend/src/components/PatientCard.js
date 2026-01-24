import React, { useState } from 'react';

const PatientCard = ({ patient, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);

  // Демонстрационные данные модулей
  const [modules] = useState([
    {
      id: 'photometry',
      name: 'Фотометрия',
      icon: '📷',
      color: 'bg-blue-500',
      hasData: true,
      lastResult: 'Анализ выполнен',
      date: '2024-01-15',
      measurements: {
        'Лицевой индекс': '84.5%',
        'Тип лица': 'Мезоцефалический',
        'Профиль': 'Прямой'
      }
    },
    {
      id: 'cephalometry',
      name: 'Цефалометрия',
      icon: '🦴',
      color: 'bg-emerald-500',
      hasData: true,
      lastResult: 'Скелетный I класс',
      date: '2024-01-15',
      measurements: {
        'SNA': '82°',
        'SNB': '80°',
        'ANB': '2°',
        'GoGn-SN': '32°'
      }
    },
    {
      id: 'biometry',
      name: 'Биометрия',
      icon: '📐',
      color: 'bg-purple-500',
      hasData: true,
      lastResult: 'Болтон: 77.2%',
      date: '2024-01-14',
      measurements: {
        'Тон-индекс': '0.85',
        'Общее сужение': '3.2 мм',
        'Прикус': 'Глубокий'
      }
    },
    {
      id: 'modeling',
      name: '3D Моделирование',
      icon: '🖥️',
      color: 'bg-amber-500',
      hasData: false,
      lastResult: 'Нет данных',
      date: null,
      measurements: {}
    },
    {
      id: 'ct',
      name: 'КТ Анализ',
      icon: '🩻',
      color: 'bg-rose-500',
      hasData: false,
      lastResult: 'Нет данных',
      date: null,
      measurements: {}
    }
  ]);

  // История болезни - демонстрационные данные
  const [medicalHistory] = useState([
    {
      id: 1,
      date: '2024-01-15',
      type: 'Фотометрия',
      doctor: 'Иванов А.С.',
      diagnosis: 'Симметричное лицо, прямой профиль',
      treatment: 'Рекомендовано ортодонтическое лечение',
      notes: 'Пациент жалоб не предъявляет'
    },
    {
      id: 2,
      date: '2024-01-15',
      type: 'Цефалометрия',
      doctor: 'Петрова Е.В.',
      diagnosis: 'Скелетный I класс, нейтральный рост',
      treatment: 'Показано лечение на брекетах',
      notes: 'Воздухоносные пути в норме'
    },
    {
      id: 3,
      date: '2024-01-14',
      type: 'Биометрия',
      doctor: 'Сидоров Д.М.',
      diagnosis: 'Несоответствие зубных рядов 77.2%',
      treatment: 'Расширение верхней челюсти',
      notes: 'Требуется сепарация 4.5 мм'
    },
    {
      id: 4,
      date: '2024-01-10',
      type: 'Консультация',
      doctor: 'Московец В.И.',
      diagnosis: 'Дистальная окклюзия, скученность',
      treatment: 'План лечения разработан',
      notes: 'Первичный осмотр, сбор анамнеза'
    }
  ]);

  // Группируем историю по датам
  const historyByDate = medicalHistory.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item);
    return acc;
  }, {});

  // Сортируем даты в обратном порядке
  const sortedDates = Object.keys(historyByDate).sort((a, b) => new Date(b) - new Date(a));

  // Вычисляем возраст пациента
  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Не указано';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Форматируем дату для отображения
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Модульные вкладки
  const moduleTabs = [
    { id: 'overview', label: 'Обзор', icon: '📊' },
    { id: 'photometry', label: 'Фотометрия', icon: '📷' },
    { id: 'cephalometry', label: 'Цефалометрия', icon: '🦴' },
    { id: 'biometry', label: 'Биометрия', icon: '📐' },
    { id: 'modeling', label: '3D Модели', icon: '🖥️' },
    { id: 'ct', label: 'КТ', icon: '🩻' },
    { id: 'history', label: 'История', icon: '📋' }
  ];

  // Получаем данные для конкретной даты
  const getHistoryForDate = (date) => {
    return historyByDate[date] || [];
  };

  // Переход к модулю
  const navigateToModule = (moduleId) => {
    const hashMap = {
      photometry: '#photometry',
      cephalometry: '#cephalometry',
      biometry: '#biometry',
      modeling: '#modeling',
      ct: '#ct'
    };
    if (hashMap[moduleId]) {
      window.location.hash = hashMap[moduleId];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Верхняя панель */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Медицинская карта пациента</h1>
                <p className="text-sm text-gray-500">Полная история диагностики и лечения</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Активный пациент
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Основная карточка пациента */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="flex flex-col lg:flex-row">
            {/* Левая часть - информация о пациенте */}
            <div className="flex-1 p-6 lg:p-8">
              <div className="flex items-start gap-6">
                {/* Аватар/фото по умолчанию */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>

                {/* Информация о пациенте */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {patient?.full_name || patient?.fullName || 'Иванова Мария Петровна'}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Дата рождения</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(patient?.birth_date || patient?.birthDate)} ({calculateAge(patient?.birth_date || patient?.birthDate || '1995-03-15')} лет)
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Пол</p>
                      <p className="font-medium text-gray-900">
                        {(() => {
                          const gender = patient?.gender;
                          if (!gender) return 'Женский';
                          if (gender === 'male' || gender === 'Male') return 'Мужской';
                          if (gender === 'female' || gender === 'Female') return 'Женский';
                          return gender;
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Телефон</p>
                      <p className="font-medium text-gray-900">{patient?.contact_info || patient?.contactInfo || '+7 (999) 123-45-67'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Дата обращения</p>
                      <p className="font-medium text-gray-900">{formatDate(patient?.created_at || patient?.lastVisit || new Date().toISOString())}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Лечащий врач</p>
                      <p className="font-medium text-gray-900">Иванов А.С.</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ID пациента</p>
                      <p className="font-medium text-gray-900">#{patient?.id || 1}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Жалобы и примечания */}
              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <h3 className="text-sm font-semibold text-amber-800 mb-2">📝 Жалобы пациента</h3>
                <p className="text-gray-700">{patient?.complaints || 'Неровные зубы, неправильный прикус, эстетический дефект'}</p>
              </div>

              {/* Статистика */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-blue-600">{modules.filter(m => m.hasData).length}</p>
                  <p className="text-sm text-blue-700">Исследований</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-green-600">{medicalHistory.length}</p>
                  <p className="text-sm text-green-700">Записей</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-purple-600">{sortedDates.length}</p>
                  <p className="text-sm text-purple-700">Визитов</p>
                </div>
              </div>
            </div>

            {/* Правая часть - фото пациента */}
            <div className="lg:w-80 p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 border-l border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Фотографии
              </h3>
              
              {/* Основное фото */}
              <div className="mb-4">
                <div className="aspect-square rounded-xl bg-gray-200 overflow-hidden shadow-inner flex items-center justify-center">
                  <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">Фото анфас</p>
              </div>

              {/* Миниатюры */}
              <div className="grid grid-cols-3 gap-2">
                <div className="aspect-square rounded-lg bg-gray-200 overflow-hidden flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="aspect-square rounded-lg bg-gray-200 overflow-hidden flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="aspect-square rounded-lg bg-gray-200 overflow-hidden flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              
              <button className="w-full mt-4 py-2 px-4 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Добавить фото
              </button>
            </div>
          </div>
        </div>

        {/* Вкладки модулей */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Навигация по вкладкам */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex min-w-max px-4">
              {moduleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.id === 'history' && (
                    <span className="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                      {medicalHistory.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Содержимое вкладок */}
          <div className="p-6">
            {/* Обзор */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Диагностические модули</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className={`p-5 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                        module.hasData
                          ? 'border-gray-200 hover:border-blue-300 bg-white'
                          : 'border-dashed border-gray-300 bg-gray-50'
                      }`}
                      onClick={() => navigateToModule(module.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${module.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                          {module.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900">{module.name}</h4>
                          <p className={`text-sm mt-1 ${module.hasData ? 'text-green-600' : 'text-gray-400'}`}>
                            {module.hasData ? '✓ Данные загружены' : '○ Нет данных'}
                          </p>
                          {module.hasData && (
                            <p className="text-xs text-gray-500 mt-1">{module.date}</p>
                          )}
                        </div>
                      </div>
                      
                      {module.hasData && Object.keys(module.measurements).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-2">Ключевые показатели:</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(module.measurements).slice(0, 3).map(([key, value]) => (
                              <span key={key} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Модули с детальными результатами */}
            {['photometry', 'cephalometry', 'biometry'].includes(activeTab) && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {modules.find(m => m.id === activeTab)?.name}
                  </h3>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    Последнее: {modules.find(m => m.id === activeTab)?.date}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Изображение */}
                  <div className="bg-gray-100 rounded-xl overflow-hidden">
                    <div className="aspect-video flex items-center justify-center">
                      <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>

                  {/* Результаты */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h4 className="font-semibold text-gray-900 mb-4">Результаты анализа</h4>
                    <div className="space-y-3">
                      {Object.entries(
                        modules.find(m => m.id === activeTab)?.measurements || {}
                      ).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                          <span className="text-gray-600">{key}</span>
                          <span className="font-semibold text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Заключение:</strong> {modules.find(m => m.id === activeTab)?.lastResult}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3D Модели */}
            {activeTab === 'modeling' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">3D Моделирование</h3>
                <div className="bg-gray-100 rounded-xl overflow-hidden">
                  <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="text-center">
                      <svg className="w-24 h-24 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                      </svg>
                      <p className="text-gray-400">3D модель будет отображаться здесь</p>
                      <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Загрузить модель
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* КТ */}
            {activeTab === 'ct' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">КТ Анализ</h3>
                <div className="bg-gray-100 rounded-xl overflow-hidden">
                  <div className="aspect-video flex items-center justify-center bg-gray-800">
                    <div className="text-center">
                      <svg className="w-24 h-24 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                      <p className="text-gray-400">Снимки КТ будут отображаться здесь</p>
                      <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Загрузить снимки
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* История болезни */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">История болезни</h3>
                
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Список дат */}
                  <div className="lg:w-1/3">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      По датам
                    </h4>
                    <div className="space-y-2">
                      {sortedDates.map((date) => (
                        <button
                          key={date}
                          onClick={() => setSelectedHistoryDate(date)}
                          className={`w-full p-4 rounded-xl text-left transition-all ${
                            selectedHistoryDate === date
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <p className="font-semibold">{formatDate(date)}</p>
                          <p className={`text-sm ${selectedHistoryDate === date ? 'text-blue-200' : 'text-gray-500'}`}>
                            {getHistoryForDate(date).length} записей
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Записи за выбранную дату */}
                  <div className="lg:w-2/3">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      {selectedHistoryDate ? formatDate(selectedHistoryDate) : 'Выберите дату'}
                    </h4>
                    
                    {selectedHistoryDate ? (
                      <div className="space-y-4">
                        {getHistoryForDate(selectedHistoryDate).map((record, index) => (
                          <div
                            key={record.id}
                            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  record.type === 'Фотометрия' ? 'bg-blue-100 text-blue-700' :
                                  record.type === 'Цефалометрия' ? 'bg-emerald-100 text-emerald-700' :
                                  record.type === 'Биометрия' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {record.type}
                                </span>
                                <span className="text-sm text-gray-500">{record.doctor}</span>
                              </div>
                              <span className="text-sm text-gray-400">#{index + 1}</span>
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs text-gray-500 uppercase">Диагноз</p>
                                <p className="text-gray-900">{record.diagnosis}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase">Лечение/назначения</p>
                                <p className="text-gray-900">{record.treatment}</p>
                              </div>
                              {record.notes && (
                                <div>
                                  <p className="text-xs text-gray-500 uppercase">Примечания</p>
                                  <p className="text-gray-600 text-sm">{record.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-8 text-center">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500">Выберите дату для просмотра записей</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <button
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            onClick={() => navigateToModule('photometry')}
          >
            <span>📷</span> Фотометрия
          </button>
          <button
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            onClick={() => navigateToModule('cephalometry')}
          >
            <span>🦴</span> Цефалометрия
          </button>
          <button
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            onClick={() => navigateToModule('biometry')}
          >
            <span>📐</span> Биометрия
          </button>
          <button
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            onClick={() => navigateToModule('modeling')}
          >
            <span>🖥️</span> 3D Модели
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientCard;
