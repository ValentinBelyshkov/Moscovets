import React, { useState, useEffect } from 'react';
import './PresentationGenerator.css';

const PresentationGenerator = ({ patient }) => {
  const [medicalData, setMedicalData] = useState(null);
  const [presentationSlides, setPresentationSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlides, setSelectedSlides] = useState({});
  const [exportFormat, setExportFormat] = useState('html'); // Изменено по умолчанию
  const [previewMode, setPreviewMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);

  // Загрузка медицинских данных из localStorage
  useEffect(() => {
    const loadMedicalData = async () => {
      try {
        setLoading(true);
        
        const savedData = localStorage.getItem(`medical_card_${patient?.id || 'demo'}`);
        
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setMedicalData(parsedData);
          generatePresentationSlides(parsedData);
        } else {
          const demoData = getDemoMedicalData();
          setMedicalData(demoData);
          generatePresentationSlides(demoData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading medical data:', error);
        setLoading(false);
      }
    };

    if (patient?.id) {
      loadMedicalData();
    } else {
      const demoData = getDemoMedicalData();
      setMedicalData(demoData);
      generatePresentationSlides(demoData);
      setLoading(false);
    }
  }, [patient?.id]);

  // Демо-данные по образцу презентации
  const getDemoMedicalData = () => ({
    personalInfo: {
      fullName: 'Замойская Светлана Сергеевна',
      birthDate: '27.10.2010',
      examinationDate: '10.11.2025',
      complaints: 'эстетический дефект',
      doctor: 'Митрофанова Елена Александровна'
    },
    anamnesis: {
      pregnancyIssues: { trimester: 'нет', details: '' },
      birthType: 'в срок',
      feedingType: { type: 'естественное', artificialFrom: null },
      firstTeethMonths: 6,
      teethChangeYears: 6,
      badHabits: { exists: false, habits: [] },
      familyAnomalies: { exists: false, relatives: [] },
      pastDiseases: { exists: false, diseases: [] },
      previousOrthoTreatment: { exists: false, duration: null, appliances: [] },
      generalHealth: 'удовлетворительное'
    },
    photoAnalysis: {
      frontal: {
        faceWidth: 140,
        faceHeight: 120,
        facialIndex: 85.7,
        chinPosition: 'правильное',
        lipClosure: 'сомкнуты',
        gumSmile: 'нет симптома',
        midline: 'совпадает',
        comments: 'Гармоничные лицевые пропорции',
        photos: ['без улыбки', 'с приоткрытым ртом', 'с улыбкой']
      },
      profile45: {
        symmetry: 'удовлетворительная',
        headShape: 'мезоцефалическая',
        faceShape: 'среднее лицо',
        comments: 'Нормальная симметрия',
        photos: ['без улыбки', 'с приоткрытым ртом', 'с улыбкой']
      },
      profile: {
        profileType: 'прямой',
        nasolabialAngle: 100,
        mentolabialAngle: 130,
        chinPosition: 'правильное',
        upperLipPosition: 'правильное',
        lowerLipPosition: 'правильное',
        comments: 'Прямой профиль',
        photos: ['без улыбки', 'с приоткрытым ртом', 'с улыбкой']
      }
    },
    intraoralAnalysis: {
      occlusion: {
        sagittal: {
          molarsRight: 'I класс',
          molarsLeft: 'I класс',
          caninesRight: 'I класс',
          caninesLeft: 'I класс',
          incisorRelationship: 'в норме'
        },
        vertical: {
          anterior: 'глубокая резцовая окклюзия',
          deepOcclusion: '> 1/3',
          verticalOverlap: 5.3,
          norm: '2.5 мм ± 2.0 мм'
        },
        transversal: {
          midlineShift: 'нет',
          crossbite: 'отсутствует'
        }
      },
      dentalCondition: 'постоянный прикус',
      comments: 'Супрапозиция 1.3, 2.3. Сужение верхнего и нижнего зубных рядов.'
    },
    anthropometry: {
      dentalFormula: {
        upperJaw: {
          '16': 10, '15': 10, '14': 7, '13': 7.1, '12': 7.9, '11': 7.2,
          '21': 9.9, '22': 9.5, '23': 7, '24': 7.8, '25': 7, '26': 7
        },
        lowerJaw: {
          '36': 10.8, '35': 11.1, '34': 6.8, '33': 7, '32': 7, '31': 5.8,
          '41': 5.5, '42': 5.6, '43': 5.9, '44': 7.1, '45': 7.1, '46': 7
        }
      },
      toothDevelopmentStage: 'Период смены зубов',
      jawDimensions: {
        maxillaryWidth: 60.4,
        mandibularWidth: 55.4
      }
    },
    cephalometry: {
      frontalTRG: {
        symmetry: 'асимметрия 3.4 мм влево',
        chinDeviation: 'влево на 3.4 мм',
        measurements: {
          'J-J': { value: 60.4, norm: '58.0±3.0 мм', interpretation: 'Норма' },
          'Md-Md': { value: 55.4, norm: '53.0±3.0 мм', interpretation: 'Норма' }
        }
      },
      lateralTRG: {
        skeletalClass: 'I скелетный класс с тенденцией ко II классу',
        parameters: {
          'SNA': { value: 78.2, norm: '82.0±3.0°', interpretation: 'Ретрогнатия' },
          'SNB': { value: 74.3, norm: '80.0±3.0°', interpretation: 'Ретрогнатия' },
          'ANB': { value: 4.0, norm: '2.0±2.0°', interpretation: 'I класс с тенденцией к II' },
          'Wits': { value: 2.2, norm: '-0.4±2.5 мм', interpretation: 'II скелетный класс' }
        }
      }
    },
    ctAnalysis: {
      optg: {
        findings: 'Все зубы присутствуют, патологий не выявлено'
      },
      tmj: {
        right: 'центральное верхнее положение',
        left: 'заднее верхнее положение',
        symmetry: 'асимметрия положения суставных головок'
      },
      axialCuts: {
        tonguePosition: 'нормальное',
        airway: 'без сужений'
      }
    },
    diagnoses: [
      { id: 1, diagnosis: 'Ретрогнатия верхней челюсти', severity: 'умеренная', code: 'K07.0' },
      { id: 2, diagnosis: 'Ретрогнатия нижней челюсти', severity: 'умеренная', code: 'K07.0' },
      { id: 3, diagnosis: 'Глубокая резцовая окклюзия', severity: 'умеренная', code: 'K07.2' },
      { id: 4, diagnosis: 'Сужение верхнего зубного ряда', severity: 'легкое', code: 'K07.3' },
      { id: 5, diagnosis: 'Сужение нижнего зубного ряда', severity: 'легкое', code: 'K07.3' }
    ],
    treatmentPlan: {
      complexity: 'средней сложности',
      estimatedDuration: '18-24 месяца',
      phases: [
        {
          phase: 1,
          name: 'Диагностика и подготовка',
          duration: '1 месяц',
          procedures: ['Полная диагностика', 'Профессиональная гигиена']
        },
        {
          phase: 2,
          name: 'Расширение и выравнивание',
          duration: '6-8 месяцев',
          procedures: ['Расширение верхнего зубного ряда', 'Выравнивание зубов']
        },
        {
          phase: 3,
          name: 'Детализация и коррекция',
          duration: '8-10 месяцев',
          procedures: ['Детализация окклюзии', 'Коррекция положения зубов']
        },
        {
          phase: 4,
          name: 'Стабилизация и ретенция',
          duration: '6 месяцев',
          procedures: ['Снятие аппаратуры', 'Фиксация результатов']
        }
      ]
    },
    conclusions: [
      'Скелетный I класс',
      'Нейтральный тип роста',
      'Высота нижней трети лица по Ricketts в норме',
      'Ретрогнатия верхней и нижней челюстей',
      'Глубокая резцовая окклюзия',
      'Вертикальное резцовое перекрытие увеличено до 5.3 мм',
      'Сагиттальное резцовое перекрытие в норме',
      'Сужение верхнего и нижнего зубных рядов',
      'Воздухоносные пути без патологий',
      'Асимметрия положения ВНЧС'
    ]
  });

  // Генерация слайдов презентации по образцу
  const generatePresentationSlides = (data) => {
    const slides = [];
    
    // Слайд 1: Титульный лист
    slides.push({
      number: 1,
      title: 'Ортодонтическое обследование',
      type: 'title',
      content: {
        patientName: data.personalInfo?.fullName || patient?.fullName,
        birthDate: data.personalInfo?.birthDate,
        examinationDate: data.personalInfo?.examinationDate,
        complaints: data.personalInfo?.complaints,
        doctor: data.personalInfo?.doctor,
        age: '15 лет'
      },
      description: 'Титульный слайд с основной информацией о пациенте'
    });
    
    // Слайд 2: Анамнез
    slides.push({
      number: 2,
      title: 'Анамнез',
      type: 'anamnesis',
      content: data.anamnesis || {},
      description: 'Анамнестические данные пациента'
    });
    
    // Слайд 3: Фото лица в анфас
    slides.push({
      number: 3,
      title: 'Фото лица в анфас',
      type: 'frontal_photos',
      content: {
        photos: data.photoAnalysis?.frontal?.photos || ['без улыбки', 'с приоткрытым ртом', 'с улыбкой'],
        analysis: data.photoAnalysis?.frontal
      },
      description: '3 фотографии анфас с анализом лицевых пропорций'
    });
    
    // Слайд 4: Фото лица в профиль
    slides.push({
      number: 4,
      title: 'Фото лица в профиль',
      type: 'profile_photos',
      content: {
        photos: data.photoAnalysis?.profile?.photos || ['без улыбки', 'с приоткрытым ртом', 'с улыбкой'],
        analysis: data.photoAnalysis?.profile
      },
      description: '3 фотографии профиль с определением типа профиля'
    });
    
    // Слайд 5: Внутриротовые фотографии
    slides.push({
      number: 5,
      title: 'Внутриротовые фотографии',
      type: 'intraoral_photos',
      content: {
        photoTypes: ['Сомкнутый рот', 'Приоткрытый рот', 'Сбоку 90° слева', 'Сбоку 90° справа'],
        analysis: data.intraoralAnalysis
      },
      description: '4 внутриротовые фотографии с анализом окклюзии'
    });
    
    // Слайд 6: 3D модель черепа
    slides.push({
      number: 6,
      title: '3D модель черепа с мягкими тканями',
      type: '3d_model',
      content: {
        description: '3D изображение черепа и мягких тканей',
        notes: 'Все выводы по данной диагностической информации, а также выбор метода лечения и составление плана лечения пациента является обязанностью лечащего врача.'
      },
      description: 'Трехмерная модель черепа и мягких тканей'
    });
    
    // Слайд 7: ОПТГ
    slides.push({
      number: 7,
      title: 'Ортопантомограмма (ОПТГ)',
      type: 'optg',
      content: data.ctAnalysis?.optg || {},
      description: 'ОПТГ с оценкой состояния зубов и костной ткани'
    });
    
    // Слайд 8: Срезы зубов
    slides.push({
      number: 8,
      title: 'Срезы зубов верхней и нижней челюсти',
      type: 'tooth_slices',
      content: data.ctAnalysis?.axialCuts || {},
      description: 'Аксиальные срезы зубных рядов'
    });
    
    // Слайд 9: ВНЧС
    slides.push({
      number: 9,
      title: 'КТ анализ: ВНЧС',
      type: 'tmj',
      content: data.ctAnalysis?.tmj || {},
      description: 'Анализ височно-нижнечелюстных суставов'
    });
    
    // Слайд 10: Симметрия лицевого отдела
    slides.push({
      number: 10,
      title: 'Симметрия лицевого отдела черепа',
      type: 'symmetry',
      content: {
        symmetry: data.cephalometry?.frontalTRG?.symmetry || 'асимметрия 3.4 мм влево',
        chinDeviation: data.cephalometry?.frontalTRG?.chinDeviation || 'влево на 3.4 мм'
      },
      description: 'Анализ симметрии лицевого отдела'
    });
    
    // Слайд 11: ТРГ в боковой проекции
    slides.push({
      number: 11,
      title: 'ТРГ в боковой проекции',
      type: 'lateral_trg',
      content: data.cephalometry?.lateralTRG || {},
      description: 'Телерентгенограмма в боковой проекции с трассировкой'
    });
    
    // Слайд 12: Расчет ТРГ
    slides.push({
      number: 12,
      title: 'Расчет ТРГ в боковой проекции',
      type: 'trg_calculation',
      content: {
        skeletalClass: data.cephalometry?.lateralTRG?.skeletalClass || 'I скелетный класс с тенденцией ко II классу',
        parameters: data.cephalometry?.lateralTRG?.parameters || {}
      },
      description: 'Расчет параметров по методике Picasso'
    });
    
    // Слайд 13: Воздухоносные пути
    slides.push({
      number: 13,
      title: 'Воздухоносные пути',
      type: 'airway',
      content: {
        airwayStatus: data.ctAnalysis?.axialCuts?.airway || 'без сужений',
        analysis: 'Уменьшения объема и сужения воздухоносных путей не выявлено.'
      },
      description: 'Анализ воздухоносных путей'
    });
    
    // Слайд 14: Диагноз
    slides.push({
      number: 14,
      title: 'Диагноз',
      type: 'diagnosis',
      content: {
        diagnoses: data.diagnoses || []
      },
      description: 'Ортодонтические диагнозы пациента'
    });
    
    // Слайд 15: Выводы
    slides.push({
      number: 15,
      title: 'Выводы',
      type: 'conclusions',
      content: {
        conclusions: data.conclusions || []
      },
      description: 'Основные выводы по обследованию'
    });
    
    // Инициализируем все слайды как выбранные
    const initialSelection = {};
    slides.forEach(slide => {
      initialSelection[slide.number] = true;
    });
    setSelectedSlides(initialSelection);
    setPresentationSlides(slides);
  };

  const handleSlideToggle = (slideNumber) => {
    setSelectedSlides(prev => ({
      ...prev,
      [slideNumber]: !prev[slideNumber]
    }));
  };

  const handleSelectAll = () => {
    const allSelected = {};
    presentationSlides.forEach(slide => {
      allSelected[slide.number] = true;
    });
    setSelectedSlides(allSelected);
  };

  const handleDeselectAll = () => {
    const noneSelected = {};
    presentationSlides.forEach(slide => {
      noneSelected[slide.number] = false;
    });
    setSelectedSlides(noneSelected);
  };

  const handleGeneratePresentation = () => {
    const selectedSlideNumbers = Object.keys(selectedSlides)
      .filter(key => selectedSlides[key])
      .map(key => parseInt(key));
    
    const selectedSlidesData = presentationSlides
      .filter(slide => selectedSlideNumbers.includes(slide.number))
      .map(slide => ({
        ...slide,
        patient: medicalData?.personalInfo || patient
      }));
    
    const presentationData = {
      patient: medicalData?.personalInfo || patient,
      slides: selectedSlidesData,
      generatedAt: new Date().toISOString(),
      totalSlides: selectedSlidesData.length,
      format: exportFormat
    };
    
    // Сохраняем в localStorage
    localStorage.setItem(`presentation_${patient?.id || 'demo'}`, JSON.stringify(presentationData));
    
    // Показываем preview
    setPreviewMode(true);
    setCurrentSlide(0);
    
    alert(`✅ Презентация успешно сгенерирована!\n\n📊 Статистика:\n• Выбрано слайдов: ${selectedSlidesData.length}\n• Формат: ${exportFormat.toUpperCase()}\n• Пациент: ${presentationData.patient.fullName}`);
  };

  const handleExportPresentation = () => {
    const presentationData = JSON.parse(localStorage.getItem(`presentation_${patient?.id || 'demo'}`) || '{}');
    
    if (exportFormat === 'html') {
      // Создаем полную HTML презентацию
      const htmlContent = createFullHTMLPresentation(presentationData);
      const dataStr = `<!DOCTYPE html>\n${htmlContent}`;
      const dataBlob = new Blob([dataStr], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Презентация_${presentationData.patient.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
      link.click();
      URL.revokeObjectURL(url);
      
      // Также показываем предпросмотр
      setShowHtmlPreview(true);
    } else {
      alert(`Для формата ${exportFormat.toUpperCase()} требуется подключение к внешнему API. В этом примере доступен только HTML экспорт.`);
    }
  };

  const createFullHTMLPresentation = (data) => {
    const slides = data.slides || [];
    
    return `
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ортодонтическая презентация: ${data.patient?.fullName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        
        .presentation-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 30px rgba(0,0,0,0.1);
        }
        
        .slide {
            min-height: 100vh;
            padding: 40px;
            position: relative;
            page-break-after: always;
        }
        
        .slide-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 3px solid #2c3e50;
        }
        
        .slide-title {
            font-size: 28px;
            color: #2c3e50;
            font-weight: bold;
        }
        
        .slide-number {
            font-size: 18px;
            color: #7f8c8d;
            background: #ecf0f1;
            padding: 5px 15px;
            border-radius: 20px;
        }
        
        .patient-info-header {
            position: absolute;
            top: 20px;
            right: 40px;
            font-size: 14px;
            color: #7f8c8d;
        }
        
        .footer-note {
            position: absolute;
            bottom: 20px;
            width: calc(100% - 80px);
            font-size: 12px;
            color: #95a5a6;
            text-align: center;
            font-style: italic;
            border-top: 1px solid #ecf0f1;
            padding-top: 10px;
        }
        
        /* Стили для титульного слайда */
        .title-slide {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .title-slide .slide-title {
            color: white;
            font-size: 48px;
            margin-bottom: 30px;
        }
        
        .title-slide .patient-name {
            font-size: 36px;
            margin: 20px 0;
        }
        
        .title-slide .patient-details {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            margin-top: 30px;
            max-width: 600px;
        }
        
        /* Стили для слайдов с диагнозами */
        .diagnosis-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        
        .diagnosis-item {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }
        
        .diagnosis-item h4 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        /* Стили для слайдов с выводами */
        .conclusions-list {
            list-style: none;
            margin-top: 30px;
        }
        
        .conclusions-list li {
            padding: 15px;
            margin-bottom: 10px;
            background: #f8f9fa;
            border-radius: 8px;
            position: relative;
            padding-left: 40px;
        }
        
        .conclusions-list li:before {
            content: "✓";
            position: absolute;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: #2ecc71;
            font-weight: bold;
        }
        
        /* Стили для фото-слайдов */
        .photos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        
        .photo-item {
            background: #ecf0f1;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        
        .photo-placeholder {
            width: 200px;
            height: 150px;
            background: #bdc3c7;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #7f8c8d;
            border-radius: 4px;
        }
        
        /* Стили для таблиц данных */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .data-table th, .data-table td {
            padding: 12px 15px;
            border: 1px solid #ddd;
            text-align: left;
        }
        
        .data-table th {
            background-color: #2c3e50;
            color: white;
        }
        
        .data-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        /* Адаптивность для печати */
        @media print {
            body {
                background: white;
            }
            
            .slide {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            
            .presentation-container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="presentation-container">
        ${slides.map((slide, index) => `
        <div class="slide slide-${slide.type}">
            <div class="patient-info-header">
                ${data.patient?.fullName} • ${data.patient?.examinationDate}
            </div>
            
            <div class="slide-header">
                <h1 class="slide-title">${slide.title}</h1>
                <div class="slide-number">Слайд ${index + 1}/${slides.length}</div>
            </div>
            
            ${renderHTMLSlideContent(slide)}
            
            <div class="footer-note">
                Все выводы по данной диагностической информации, а также выбор метода лечения и составление плана лечения пациента является обязанностью лечащего врача.
            </div>
        </div>
        `).join('')}
    </div>
</body>
</html>
    `;
  };

  const renderHTMLSlideContent = (slide) => {
    const content = slide.content;
    
    switch (slide.type) {
      case 'title':
        return `
          <div class="slide-content">
            <div class="patient-name">${content.patientName}</div>
            <div class="patient-details">
              <p><strong>Дата рождения:</strong> ${content.birthDate} (${content.age || '15 лет'})</p>
              <p><strong>Дата обследования:</strong> ${content.examinationDate}</p>
              <p><strong>Жалобы:</strong> ${content.complaints}</p>
              <p><strong>Лечащий врач:</strong> ${content.doctor}</p>
            </div>
          </div>
        `;
      
      case 'anamnesis':
        const anamnesis = content;
        return `
          <div class="slide-content">
            <div class="data-table-container">
              <table class="data-table">
                <tr>
                  <th>Параметр</th>
                  <th>Значение</th>
                </tr>
                <tr>
                  <td>Нарушение здоровья матери при беременности</td>
                  <td>${anamnesis.pregnancyIssues?.trimester || 'нет'}</td>
                </tr>
                <tr>
                  <td>Роды</td>
                  <td>${anamnesis.birthType || 'в срок'}</td>
                </tr>
                <tr>
                  <td>Вскармливание</td>
                  <td>${anamnesis.feedingType?.type || 'естественное'}</td>
                </tr>
                <tr>
                  <td>Прорезывание первых зубов</td>
                  <td>${anamnesis.firstTeethMonths || 6} месяцев</td>
                </tr>
                <tr>
                  <td>Смена зубов</td>
                  <td>${anamnesis.teethChangeYears || 6} лет</td>
                </tr>
                <tr>
                  <td>Общее состояние здоровья</td>
                  <td>${anamnesis.generalHealth || 'удовлетворительное'}</td>
                </tr>
              </table>
            </div>
          </div>
        `;
      
      case 'diagnosis':
        const diagnoses = content.diagnoses || [];
        return `
          <div class="slide-content">
            <h3>Ортодонтические диагнозы:</h3>
            <div class="diagnosis-list">
              ${diagnoses.map(d => `
                <div class="diagnosis-item">
                  <h4>${d.diagnosis}</h4>
                  <p><strong>Степень тяжести:</strong> ${d.severity}</p>
                  <p><strong>Код МКБ-10:</strong> ${d.code}</p>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      
      case 'conclusions':
        const conclusions = content.conclusions || [];
        return `
          <div class="slide-content">
            <h3>Основные выводы:</h3>
            <ul class="conclusions-list">
              ${conclusions.map(c => `<li>${c}</li>`).join('')}
            </ul>
          </div>
        `;
      
      case 'frontal_photos':
        const photos = content.photos || [];
        return `
          <div class="slide-content">
            <h3>Фотографии лица анфас:</h3>
            <div class="photos-grid">
              ${photos.map(photo => `
                <div class="photo-item">
                  <div class="photo-placeholder">[ФОТО]</div>
                  <p>${photo}</p>
                </div>
              `).join('')}
            </div>
            ${content.analysis ? `
              <div style="margin-top: 30px;">
                <h4>Анализ:</h4>
                <p>${content.analysis.comments || 'Гармоничные лицевые пропорции'}</p>
                <p><strong>Лицевой индекс:</strong> ${content.analysis.facialIndex || 85.7}%</p>
              </div>
            ` : ''}
          </div>
        `;
      
      case 'lateral_trg':
        const params = content.parameters || {};
        return `
          <div class="slide-content">
            <h3>Телерентгенограмма в боковой проекции</h3>
            <p><strong>Скелетный класс:</strong> ${content.skeletalClass || 'I скелетный класс с тенденцией ко II классу'}</p>
            
            ${Object.keys(params).length > 0 ? `
              <table class="data-table" style="margin-top: 20px;">
                <tr>
                  <th>Параметр</th>
                  <th>Значение</th>
                  <th>Норма</th>
                  <th>Интерпретация</th>
                </tr>
                ${Object.entries(params).map(([key, value]) => `
                  <tr>
                    <td>${key}</td>
                    <td>${value.value}</td>
                    <td>${value.norm}</td>
                    <td>${value.interpretation}</td>
                  </tr>
                `).join('')}
              </table>
            ` : ''}
          </div>
        `;
      
      case 'airway':
        return `
          <div class="slide-content">
            <h3>Анализ воздухоносных путей</h3>
            <div class="photo-item" style="max-width: 500px; margin: 30px auto;">
              <div class="photo-placeholder" style="width: 400px; height: 250px;">[КТ СРЕЗ ВОЗДУХОНОСНЫХ ПУТЕЙ]</div>
            </div>
            <p style="text-align: center; margin-top: 20px;">
              <strong>Результат:</strong> ${content.airwayStatus || 'без сужений'}
            </p>
            <p style="text-align: center;">${content.analysis || 'Уменьшения объема и сужения воздухоносных путей не выявлено.'}</p>
          </div>
        `;
      
      case 'optg':
        return `
          <div class="slide-content">
            <h3>Ортопантомограмма (ОПТГ)</h3>
            <div class="photo-item" style="max-width: 600px; margin: 30px auto;">
              <div class="photo-placeholder" style="width: 500px; height: 300px;">[ИЗОБРАЖЕНИЕ ОПТГ]</div>
            </div>
            <p style="text-align: center; margin-top: 20px;">
              <strong>Заключение:</strong> ${content.findings || 'Все зубы присутствуют, патологий не выявлено'}
            </p>
          </div>
        `;
      
      default:
        return `
          <div class="slide-content">
            <h3>${slide.title}</h3>
            <p>${slide.description}</p>
            ${content ? `<pre style="margin-top: 20px; background: #f8f9fa; padding: 15px; border-radius: 5px; overflow: auto;">${JSON.stringify(content, null, 2)}</pre>` : ''}
          </div>
        `;
    }
  };

  const renderSlidePreview = (slide) => {
    const content = slide.content;
    
    switch (slide.type) {
      case 'title':
        return (
          <div className="slide-preview title-slide">
            <h3>Титульный лист</h3>
            <div className="patient-photo-preview">
              <div className="photo-placeholder">📷</div>
            </div>
            <div className="patient-info">
              <div><strong>Пациент:</strong> {content.patientName}</div>
              <div><strong>Дата рождения:</strong> {content.birthDate}</div>
              <div><strong>Дата исследования:</strong> {content.examinationDate}</div>
              <div><strong>Жалобы:</strong> {content.complaints}</div>
            </div>
          </div>
        );
      
      case 'anamnesis':
        return (
          <div className="slide-preview anamnesis-slide">
            <h3>Анамнез</h3>
            <div className="anamnesis-grid">
              <div className="anamnesis-item">
                <strong>Роды:</strong>
                <span>{content.birthType || 'в срок'}</span>
              </div>
              <div className="anamnesis-item">
                <strong>Вскармливание:</strong>
                <span>{content.feedingType?.type || 'естественное'}</span>
              </div>
              <div className="anamnesis-item">
                <strong>Первые зубы:</strong>
                <span>{content.firstTeethMonths || 6} мес.</span>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="slide-preview generic-slide">
            <h3>{slide.title}</h3>
            <div className="slide-description">{slide.description}</div>
          </div>
        );
    }
  };

  const nextSlide = () => {
    const selectedSlideNumbers = Object.keys(selectedSlides)
      .filter(key => selectedSlides[key])
      .map(key => parseInt(key));
    
    if (currentSlide < selectedSlideNumbers.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleShowHtmlPreview = () => {
    const presentationData = JSON.parse(localStorage.getItem(`presentation_${patient?.id || 'demo'}`) || '{}');
    const htmlContent = createFullHTMLPresentation(presentationData);
    const newWindow = window.open();
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  };

  if (loading) {
    return (
      <div className="presentation-generator loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка данных для презентации...</p>
        </div>
      </div>
    );
  }

  if (showHtmlPreview) {
    const presentationData = JSON.parse(localStorage.getItem(`presentation_${patient?.id || 'demo'}`) || '{}');
    const htmlContent = createFullHTMLPresentation(presentationData);
    
    return (
      <div className="html-preview-container">
        <div className="preview-controls">
          <button onClick={() => setShowHtmlPreview(false)} className="btn-back">
            ← Вернуться к редактору
          </button>
          <button onClick={() => {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Презентация_${presentationData.patient?.fullName.replace(/\s+/g, '_')}.html`;
            link.click();
          }} className="btn-download">
            📥 Скачать HTML файл
          </button>
        </div>
        <iframe 
          srcDoc={htmlContent}
          title="Предпросмотр презентации"
          style={{ width: '100%', height: '80vh', border: '1px solid #ccc', borderRadius: '8px' }}
        />
      </div>
    );
  }

  return (
    <div className="presentation-generator">
      <div className="presentation-header">
        <h2>🚀 Генератор ортодонтических презентаций</h2>
        <div className="header-info">
          <div className="patient-badge">
            <span className="patient-name">Пациент: {medicalData?.personalInfo?.fullName || patient?.fullName || 'Замойская Светлана Сергеевна'}</span>
            <span className="patient-id">Дата: {medicalData?.personalInfo?.examinationDate || '10.11.2025'}</span>
          </div>
          <div className="slides-count">
            Слайдов: {presentationSlides.length}
          </div>
        </div>
      </div>

      {!previewMode ? (
        <>
          <div className="presentation-controls">
            <div className="format-selection">
              <h3>Формат экспорта</h3>
              <div className="format-options">
                <label className={`format-option ${exportFormat === 'html' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="format"
                    value="html"
                    checked={exportFormat === 'html'}
                    onChange={(e) => setExportFormat(e.target.value)}
                  />
                  <span className="format-icon">🌐</span>
                  <span className="format-name">HTML презентация</span>
                </label>
                
                <label className={`format-option ${exportFormat === 'pptx' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="format"
                    value="pptx"
                    checked={exportFormat === 'pptx'}
                    onChange={(e) => setExportFormat(e.target.value)}
                  />
                  <span className="format-icon">📊</span>
                  <span className="format-name">PowerPoint (PPTX)*</span>
                </label>
                
                <label className={`format-option ${exportFormat === 'pdf' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={exportFormat === 'pdf'}
                    onChange={(e) => setExportFormat(e.target.value)}
                  />
                  <span className="format-icon">📄</span>
                  <span className="format-name">PDF документ*</span>
                </label>
              </div>
              <p style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '10px' }}>
                * Для PPTX и PDF требуется подключение к API. Доступен HTML экспорт.
              </p>
            </div>

            <div className="selection-actions">
              <button onClick={handleSelectAll} className="btn-select-all">
                ✅ Выбрать все слайды
              </button>
              <button onClick={handleDeselectAll} className="btn-deselect-all">
                ❌ Отменить все
              </button>
            </div>
          </div>

          <div className="slides-selection-section">
            <h3>Выбор слайдов для презентации</h3>
            <div className="selection-stats">
              <span className="selected-count">
                Выбрано: {Object.values(selectedSlides).filter(v => v).length} из {presentationSlides.length}
              </span>
              <span className="selection-hint">
                ⓘ Все данные автоматически подгружаются из медицинской карты
              </span>
            </div>

            <div className="slides-grid">
              {presentationSlides.map(slide => (
                <div key={slide.number} className={`slide-card ${selectedSlides[slide.number] ? 'selected' : ''}`}>
                  <div className="slide-card-header">
                    <label className="slide-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedSlides[slide.number]}
                        onChange={() => handleSlideToggle(slide.number)}
                      />
                      <span className="slide-number">Слайд {slide.number}</span>
                    </label>
                    <span className="slide-type-badge">{slide.type.replace('_', ' ')}</span>
                  </div>
                  
                  <div className="slide-card-body">
                    <h4 className="slide-title">{slide.title}</h4>
                    <p className="slide-description">{slide.description}</p>
                    
                    <div className="slide-preview-small">
                      {renderSlidePreview(slide)}
                    </div>
                  </div>
                  
                  <div className="slide-card-footer">
                    <div className="slide-status">
                      {selectedSlides[slide.number] ? '✅ Включен' : '❌ Выключен'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="generate-section">
            <button onClick={handleGeneratePresentation} className="btn-generate">
              🚀 Сгенерировать презентацию
            </button>
            
            <div className="generation-info">
              <p>Презентация будет создана в формате HTML и готов к экспорту.</p>
              <p>Полученный HTML файл можно открыть в браузере, распечатать или импортировать в PowerPoint.</p>
            </div>
          </div>
        </>
      ) : (
        <div className="presentation-preview">
          <div className="preview-controls">
            <button onClick={() => setPreviewMode(false)} className="btn-back">
              ← Вернуться к выбору слайдов
            </button>
            
            <div className="slide-navigation">
              <button onClick={prevSlide} disabled={currentSlide === 0} className="btn-nav">
                ← Предыдущий
              </button>
              <span className="slide-counter">
                Слайд {currentSlide + 1} из {Object.values(selectedSlides).filter(v => v).length}
              </span>
              <button onClick={nextSlide} 
                disabled={currentSlide >= Object.values(selectedSlides).filter(v => v).length - 1} 
                className="btn-nav">
                Следующий →
              </button>
            </div>
          </div>

          <div className="preview-container">
            <div className="preview-slide">
              {(() => {
                const selectedSlideNumbers = Object.keys(selectedSlides)
                  .filter(key => selectedSlides[key])
                  .map(key => parseInt(key));
                
                const currentSlideData = presentationSlides.find(
                  slide => slide.number === selectedSlideNumbers[currentSlide]
                );
                
                if (currentSlideData) {
                  return (
                    <div className="slide-full-preview">
                      <div className="slide-header">
                        <h2>Слайд {currentSlideData.number}: {currentSlideData.title}</h2>
                        <span className="slide-type">{currentSlideData.type}</span>
                      </div>
                      <div className="slide-content-full">
                        {renderSlidePreview(currentSlideData)}
                      </div>
                      <div className="slide-footer">
                        <div className="patient-info-small">
                          {medicalData?.personalInfo?.fullName} • {medicalData?.personalInfo?.examinationDate}
                        </div>
                        <div className="footer-note">
                          Все выводы по данной диагностической информации, а также выбор метода лечения и составление плана лечения пациента является обязанностью лечащего врача.
                        </div>
                      </div>
                    </div>
                  );
                }
                return <div>Слайд не найден</div>;
              })()}
            </div>
          </div>

          <div className="preview-actions">
            <button onClick={handleExportPresentation} className="btn-export">
              📥 Скачать HTML презентацию
            </button>
            
            <button onClick={handleShowHtmlPreview} className="btn-preview-html">
              👁️ Предпросмотр в браузере
            </button>
          </div>
        </div>
      )}

      <div className="presentation-info-section">
        <h3>📋 Особенности HTML презентации</h3>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon">🎯</div>
            <div className="info-content">
              <h4>Структура как в примере</h4>
              <p>15 слайдов с титульным листом, диагнозами, анализами и выводами</p>
            </div>
          </div>
          
          <div className="info-card">
            <div className="info-icon">🖨️</div>
            <div className="info-content">
              <h4>Готово к печати</h4>
              <p>Оптимизированные стили для печати и экспорта в PDF</p>
            </div>
          </div>
          
          <div className="info-card">
            <div className="info-icon">💻</div>
            <div className="info-content">
              <h4>Совместимость</h4>
              <p>Открывается в любом браузере, можно импортировать в PowerPoint</p>
            </div>
          </div>
          
          <div className="info-card">
            <div className="info-icon">📊</div>
            <div className="info-content">
              <h4>Профессиональный дизайн</h4>
              <p>Чистый, медицинский дизайн с учетом специфики ортодонтии</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationGenerator;