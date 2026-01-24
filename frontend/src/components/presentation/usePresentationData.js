export const usePresentationData = () => {
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

  const generateSlides = (data, patient) => {
    const slides = [];
    
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
    
    slides.push({
      number: 2,
      title: 'Анамнез',
      type: 'anamnesis',
      content: data.anamnesis || {},
      description: 'Анамнестические данные пациента'
    });
    
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
    
    slides.push({
      number: 7,
      title: 'Ортопантомограмма (ОПТГ)',
      type: 'optg',
      content: data.ctAnalysis?.optg || {},
      description: 'ОПТГ с оценкой состояния зубов и костной ткани'
    });
    
    slides.push({
      number: 8,
      title: 'Срезы зубов верхней и нижней челюсти',
      type: 'tooth_slices',
      content: data.ctAnalysis?.axialCuts || {},
      description: 'Аксиальные срезы зубных рядов'
    });
    
    slides.push({
      number: 9,
      title: 'КТ анализ: ВНЧС',
      type: 'tmj',
      content: data.ctAnalysis?.tmj || {},
      description: 'Анализ височно-нижнечелюстных суставов'
    });
    
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
    
    slides.push({
      number: 11,
      title: 'ТРГ в боковой проекции',
      type: 'lateral_trg',
      content: data.cephalometry?.lateralTRG || {},
      description: 'Телерентгенограмма в боковой проекции с трассировкой'
    });
    
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
    
    slides.push({
      number: 14,
      title: 'Диагноз',
      type: 'diagnosis',
      content: {
        diagnoses: data.diagnoses || []
      },
      description: 'Ортодонтические диагнозы пациента'
    });
    
    slides.push({
      number: 15,
      title: 'Выводы',
      type: 'conclusions',
      content: {
        conclusions: data.conclusions || []
      },
      description: 'Основные выводы по обследованию'
    });

    return slides;
  };

  return { getDemoMedicalData, generateSlides };
};
