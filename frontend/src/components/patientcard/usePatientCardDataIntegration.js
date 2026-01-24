import { useCallback } from 'react';

export const usePatientCardDataIntegration = (patient) => {
  // Функция для получения интегрированных данных
  const getIntegratedMedicalData = useCallback((patientId, modules, storedData = {}) => {
    // Базовая структура интегрированных данных
    const integratedData = {
      patientId: patientId,

      // 1. Персональные данные (титульный лист)
      personalData: {
        fullName: patient?.full_name || patient?.fullName || (patientId === 'demo' ? 'Замойская Светлана Сергеевна' : 'Пациент'),
        birthDate: patient?.birth_date || patient?.birthDate || '27.10.2010',
        age: calculateAge(patient?.birth_date || patient?.birthDate || '2010-10-27'),
        examinationDate: new Date().toLocaleDateString('ru-RU'),
        doctor: 'Митрофанова Елена Александровна',
        complaints: patient?.complaints || 'эстетический дефект'
      },

      // 2. Анамнез
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
        generalHealth: 'удовлетворительное',
        hygiene: 'хорошая'
      },

      // 3. Фотометрический анализ
      photoAnalysis: {
        frontal: {
          faceWidth: 140,
          faceHeight: 120,
          facialIndex: 85.7,
          headShapeIndex: 80.5,
          chinPosition: 'правильное',
          chinFold: 'нормальная',
          lipClosure: 'сомкнуты',
          gumSmile: 'нет симптома',
          pupilLine: 'горизонтальная',
          midline: 'совпадает',
          occlusalLine: 'параллельна зрачковой линии',
          comments: 'Гармоничные лицевые пропорции',
          photos: ['без улыбки', 'с приоткрытым ртом', 'с улыбкой']
        },
        profile45: {
          symmetry: 'удовлетворительная',
          headShape: 'мезоцефалическая',
          faceShape: 'среднее лицо',
          zygomaticProminence: 'нормальная',
          gonialAngle: 'нормальный',
          comments: 'Нормальная симметрия',
          photos: ['без улыбки', 'с приоткрытым ртом', 'с улыбкой']
        },
        profile: {
          profileType: 'прямой',
          nasolabialAngle: 100,
          mentolabialAngle: 130,
          facialConvexity: 165,
          chinPosition: 'правильное',
          upperLipPosition: 'правильное',
          lowerLipPosition: 'правильное',
          eLine: { upperLip: -2, lowerLip: 0 },
          comments: 'Прямой профиль',
          photos: ['без улыбки', 'с приоткрытым ртом', 'с улыбкой']
        }
      },

      // 4. Внутриротовой анализ
      intraoralAnalysis: {
        occlusion: {
          sagittal: {
            molarsRight: 'I класс',
            molarsLeft: 'I класс',
            caninesRight: 'I класс',
            caninesLeft: 'I класс',
            incisorRelationship: 'в норме',
            sagittalGap: 0
          },
          vertical: {
            anterior: 'глубокая резцовая окклюзия',
            deepOcclusion: '> 1/3',
            verticalOverlap: 5.3,
            norm: '2.5 мм ± 2.0 мм'
          },
          transversal: {
            midlineShift: 'нет',
            crossbite: 'отсутствует',
            buccalOcclusion: 'в норме',
            lingualOcclusion: 'в норме'
          }
        },
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
        dentalCondition: 'постоянный прикус',
        comments: 'Сужение верхнего и нижнего зубных рядов. Трема 1.1-2.1'
      },

      // 5. Антропометрия/Биометрия
      anthropometry: {
        jawDimensions: {
          maxillaryWidth: 60.4,
          mandibularWidth: 55.4,
          maxillaryBase: 'норма',
          mandibularBase: 'норма'
        },
        indices: {
          tonIndex: { value: 1.33, norm: '1.30-1.35', interpretation: 'Норма' },
          boltonAnalysis: {
            anterior: { ratio: 77.2, norm: '77.2±1.65%', interpretation: 'Соотношение в норме' },
            overall: { ratio: 91.3, norm: '91.3±1.91%', interpretation: 'Соотношение в норме' }
          }
        },
        toothSizes: 'соответствуют норме',
        detailedBiometry: null
      },

      // 6. Цефалометрический анализ
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
            'Wits': { value: 2.2, norm: '-0.4±2.5 мм', interpretation: 'II скелетный класс' },
            'MP-SN': { value: 36.3, norm: '32.0±4.0°', interpretation: 'Ретроинклинация' },
            'Interincisal': { value: 145.1, norm: '130.0±6.0°', interpretation: 'Увеличен' }
          },
          jawPositions: {
            maxilla: { position: 'ретрогнатия', inclination: 'нормоинклинация' },
            mandible: { position: 'ретрогнатия', inclination: 'ретроинклинация' }
          },
          verticalParameters: {
            facialRatio: 0.78,
            lowerFaceHeight: 'в норме',
            ODI: { value: 69.3, norm: '74.5±5.0°', interpretation: 'Тенденция к вертикальной дизокклюзии' }
          }
        }
      },

      // 7. КТ анализ
      ctAnalysis: {
        optg: {
          findings: 'Все зубы присутствуют, патологий не выявлено',
          comments: 'Нормальная структура костной ткани'
        },
        tmj: {
          right: 'центральное верхнее положение',
          left: 'заднее верхнее положение',
          symmetry: 'асимметрия положения суставных головок'
        },
        axialCuts: {
          tonguePosition: 'нормальное',
          airway: 'без сужений',
          comments: 'Воздухоносные пути в норме'
        },
        boneStructure: 'нормальная плотность и объем'
      },

      // 8. 3D моделирование
      modeling3D: {
        skullModel: 'доступна 3D модель черепа',
        maxillaModel: 'доступна 3D модель верхней челюсти',
        mandibleModel: 'доступна 3D модель нижней челюсти',
        setupModel: 'доступна setup-модель',
        simulations: ['Исходное положение', 'Прогнозируемый результат', 'Setup-модель']
      },

      // 9. Диагнозы
      diagnoses: [
        {
          id: 1,
          category: 'Челюстно-лицевые',
          diagnosis: 'Ретрогнатия верхней челюсти',
          severity: 'умеренная',
          code: 'K07.0',
          confirmed: true
        },
        {
          id: 2,
          category: 'Челюстно-лицевые',
          diagnosis: 'Ретрогнатия нижней челюсти',
          severity: 'умеренная',
          code: 'K07.0',
          confirmed: true
        },
        {
          id: 3,
          category: 'Окклюзионные',
          diagnosis: 'Глубокая резцовая окклюзия',
          severity: 'умеренная',
          code: 'K07.2',
          confirmed: true
        },
        {
          id: 4,
          category: 'Зубные ряды',
          diagnosis: 'Сужение верхнего зубного ряда',
          severity: 'легкое',
          code: 'K07.3',
          confirmed: true
        },
        {
          id: 5,
          category: 'Зубные ряды',
          diagnosis: 'Сужение нижнего зубного ряда',
          severity: 'легкое',
          code: 'K07.3',
          confirmed: true
        }
      ],

      // 10. План лечения
      treatmentPlan: {
        complexity: 'средней сложности',
        estimatedDuration: '18-24 месяца',
        objectives: [
          'Коррекция ретрогнатии',
          'Устранение глубокой окклюзии',
          'Расширение зубных рядов',
          'Нормализация окклюзионных соотношений'
        ],
        phases: [
          {
            phase: 1,
            name: 'Диагностика и подготовка',
            duration: '1 месяц',
            procedures: ['Полная диагностика', 'Профессиональная гигиена', 'Санация полости рта']
          },
          {
            phase: 2,
            name: 'Расширение и выравнивание',
            duration: '6-8 месяцев',
            procedures: ['Расширение верхнего зубного ряда', 'Выравнивание зубов', 'Нормализация окклюзии']
          },
          {
            phase: 3,
            name: 'Детализация и коррекция',
            duration: '8-10 месяцев',
            procedures: ['Детализация окклюзии', 'Коррекция положения зубов', 'Контроль прогресса']
          },
          {
            phase: 4,
            name: 'Стабилизация и ретенция',
            duration: '6 месяцев',
            procedures: ['Снятие аппаратуры', 'Фиксация результатов', 'Ретенционный период']
          }
        ],
        appliances: [
          'Брекет-система Damon Q',
          'Расширяющий аппарат',
          'Эластики II класса'
        ],
        retention: [
          'Небный ретейнер (фиксированный)',
          'Съемная каппа на ночь',
          'Контрольные осмотры каждые 6 месяцев'
        ]
      },

      // 11. Выводы/Заключение
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
    };

    // Интеграция данных из реальных модулей если они есть
    if (modules) {
      // Объединение данных из фотометрии
      if (modules.photometry && modules.photometry.data) {
        integratedData.photoAnalysis.detailedPhotometry = modules.photometry.data;
      }

      // Объединение данных из биометрии
      if (modules.biometry && modules.biometry.data) {
        integratedData.anthropometry.detailedBiometry = modules.biometry.data;
      }

      // Объединение данных из цефалометрии
      if (modules.cephalometry && modules.cephalometry.data) {
        integratedData.cephalometry.detailedCephalometry = modules.cephalometry.data;
      }

      // Объединение данных из моделирования
      if (modules.modeling && modules.modeling.data) {
        integratedData.modeling3D.detailedModeling = modules.modeling.data;
      }

      // Объединение данных из КТ
      if (modules.ct && modules.ct.data) {
        integratedData.ctAnalysis.detailedCT = modules.ct.data;
      }
    }

    return integratedData;
  }, [patient]);

  return {
    getIntegratedMedicalData
  };
};

// Вспомогательная функция для расчета возраста
function calculateAge(birthDate) {
  if (!birthDate) return 15;

  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age || 15;
}
