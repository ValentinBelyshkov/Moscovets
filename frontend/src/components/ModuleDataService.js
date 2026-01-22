// services/ModuleDataService.js
export class ModuleDataService {
  // Получение данных из всех модулей
  static async getAllModuleData(patientId) {
    try {
      // Возвращаем mock данные напрямую, без рекурсивных вызовов
      return {
        patientId: patientId,
        modules: {
          biometry: this.generateMockBiometryData(patientId),
          cephalometry: this.generateMockCephalometryData(patientId),
          photometry: this.generateMockPhotometryData(patientId),
          ct: this.generateMockCTData(patientId),
          modeling: this.generateMockModelingData(patientId)
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting module data:', error);
      return this.getFallbackData(patientId);
    }
  }

  // Отдельные методы для генерации mock данных (без рекурсии)
  static generateMockBiometryData(patientId) {
    const savedData = localStorage.getItem(`biometry_${patientId}`);
    if (savedData) {
      return JSON.parse(savedData);
    }

    return {
      patientId: patientId,
      analysisDate: new Date().toISOString(),
      toothMeasurements: {
        upperJaw: {
          '16': 10, '15': 10, '14': 7, '13': 7.1, '12': 7.9, '11': 7.2,
          '21': 9.9, '22': 9.5, '23': 7, '24': 7.8, '25': 7, '26': 7
        },
        lowerJaw: {
          '36': 10.8, '35': 11.1, '34': 6.8, '33': 7, '32': 7, '31': 5.8,
          '41': 5.5, '42': 5.6, '43': 5.9, '44': 7.1, '45': 7.1, '46': 7
        }
      },
      analyses: {
        tonIndex: 1.33,
        tonInterpretation: 'Норма',
        boltonAnalysis: {
          anteriorRatio: 77.2,
          interpretation: 'Соотношение в норме'
        },
        pontAnalysis: {
          upperPremolar: {
            actualWidth: 32.5,
            normalWidth: 33.1,
            interpretation: 'Незначительное сужение'
          }
        },
        korkhausAnalysis: {
          upperSegment: {
            actualLength: 45.2,
            normalLength: 46.0,
            interpretation: 'В пределах нормы'
          }
        }
      },
      symmetryAnalysis: {
        upperDifference: 0.5,
        lowerDifference: 0.3,
        interpretation: 'Незначительная асимметрия'
      },
      speeCurve: {
        depth: 1.5,
        interpretation: 'В норме'
      }
    };
  }

  static generateMockCephalometryData(patientId) {
    const savedData = localStorage.getItem(`cephalometry_${patientId}`);
    if (savedData) {
      return JSON.parse(savedData);
    }

    return {
      patientId: patientId,
      analysisDate: new Date().toISOString(),
      projectionType: 'lateral',
      lateralMeasurements: {
        angles: {
          SNA: { value: 82.5, norm: '80-84°', interpretation: 'Норма' },
          SNB: { value: 80.0, norm: '78-82°', interpretation: 'Норма' },
          ANB: { value: 2.5, norm: '0-4°', interpretation: 'Норма' },
          NSBa: { value: 132.0, norm: '130-133°', interpretation: 'Норма' },
          NL_NSL: { value: 7.0, norm: '5-9°', interpretation: 'Норма' },
          ML_NSL: { value: 32.0, norm: '30-34°', interpretation: 'Норма' },
          NL_ML: { value: 24.0, norm: '22-26°', interpretation: 'Норма' },
          gonialAngle: { value: 128.0, norm: '115-135°', interpretation: 'Норма' }
        },
        linear: {
          antUpperFaceHeight: { value: 50.0, norm: '47.5-52.5mm', interpretation: 'Норма' },
          antLowerFaceHeight: { value: 65.0, norm: '60.5-69.5mm', interpretation: 'Норма' },
          witsAppraisal: { value: 1.0, norm: '1mm', interpretation: 'Норма' },
          aSnp: { value: 52.0, norm: 'NSL*0.7', interpretation: 'Норма' },
          goGn: { value: 94.0, norm: 'NS+6', interpretation: 'Норма' },
          sGoNMe: { value: 63.5, norm: '62-65%', interpretation: 'Норма' }
        }
      },
      frontalMeasurements: {
        widths: {
          jjMaxillary: { value: 68.0, norm: '65-70mm', interpretation: 'Норма' },
          u6u6Dental: { value: 48.0, norm: '46-50mm', interpretation: 'Норма' },
          l6l6Dental: { value: 45.0, norm: '43-47mm', interpretation: 'Норма' },
          agAgMandibular: { value: 62.0, norm: '60-64mm', interpretation: 'Норма' },
          bigonialWidth: { value: 95.0, norm: '90-100mm', interpretation: 'Норма' },
          bicondylarWidth: { value: 110.0, norm: '105-115mm', interpretation: 'Норма' }
        },
        heights: {
          facialHeight: { value: 120.0, norm: '115-125mm', interpretation: 'Норма' },
          upperFacialHeight: { value: 70.0, norm: '68-72mm', interpretation: 'Норма' },
          lowerFacialHeight: { value: 50.0, norm: '48-52mm', interpretation: 'Норма' }
        },
        symmetry: {
          coGoLeft: { value: 55.0, norm: '53-57mm', interpretation: 'Норма' },
          coGoRight: { value: 56.0, norm: '53-57mm', interpretation: 'Слегка ассиметрично' },
          goMeLeft: { value: 78.0, norm: '76-80mm', interpretation: 'Норма' },
          goMeRight: { value: 77.5, norm: '76-80mm', interpretation: 'Норма' }
        }
      },
      diagnoses: [
        'Нормогнатический прикус',
        'Соотношение челюстей по I скелетному классу',
        'Нормальное положение подбородка'
      ]
    };
  }

  static generateMockPhotometryData(patientId) {
    const savedData = localStorage.getItem(`photometry_${patientId}`);
    if (savedData) {
      return JSON.parse(savedData);
    }

    return {
      patientId: patientId,
      analysisDate: new Date().toISOString(),
      photos: {
        frontal: null,
        profile: null,
        frontalSmile: null,
        profileSmile: null,
        intraoralUpper: null,
        intraoralLower: null,
        intraoralFrontal: null,
        intraoralRight: null,
        intraoralLeft: null
      },
      measurements: {
        facial: {
          facialHeight: { value: 120.0, norm: '115-125mm', interpretation: 'Норма' },
          facialWidth: { value: 140.0, norm: '135-145mm', interpretation: 'Норма' },
          lipCompetence: { value: true, interpretation: 'Губы сомкнуты' },
          smileLine: { value: 'Соответствует', interpretation: 'Улыбка гармонична' },
          facialSymmetry: { value: 'Удовлетворительная', interpretation: 'Незначительная асимметрия' }
        },
        profile: {
          nasolabialAngle: { value: 100.0, norm: '90-110°', interpretation: 'Норма' },
          mentolabialAngle: { value: 130.0, norm: '120-140°', interpretation: 'Норма' },
          facialConvexity: { value: 'Прямой', interpretation: 'Нормальный профиль' },
          lipProjection: { value: 'Нормальная', interpretation: 'Губы в норме' }
        },
        intraoral: {
          midlineUpper: { value: 'Совпадает', interpretation: 'Средняя линия совпадает' },
          midlineLower: { value: 'Совпадает', interpretation: 'Средняя линия совпадает' },
          overjet: { value: 2.0, norm: '1-3mm', interpretation: 'Норма' },
          overbite: { value: 2.5, norm: '1-3mm', interpretation: 'Норма' },
          curveOfSpee: { value: 'Плоская', norm: 'Плоская-слегка выражена', interpretation: 'Норма' }
        }
      },
      diagnoses: [
        'Гармоничные лицевые пропорции',
        'Прямой профиль лица',
        'Нормальное соотношение губ'
      ]
    };
  }

  static generateMockCTData(patientId) {
    const savedData = localStorage.getItem(`ct_${patientId}`);
    if (savedData) {
      return JSON.parse(savedData);
    }

    return {
      patientId: patientId,
      analysisDate: new Date().toISOString(),
      measurements: {
        tmj: {
          rightClosedX: { value: 12.0, norm: '10-14mm', interpretation: 'Норма' },
          rightClosedY: { value: 8.0, norm: '6-10mm', interpretation: 'Норма' },
          leftClosedX: { value: 11.5, norm: '10-14mm', interpretation: 'Норма' },
          leftClosedY: { value: 8.2, norm: '6-10mm', interpretation: 'Норма' },
          condylePosition: { value: 'Центричное', interpretation: 'Норма' }
        },
        toothSections: {
          upperWidth: { value: 7.5, norm: '7-8mm', interpretation: 'Норма' },
          lowerWidth: { value: 6.8, norm: '6-7mm', interpretation: 'Норма' },
          boneThicknessUpper: { value: 1.5, norm: '1-2mm', interpretation: 'Норма' },
          boneThicknessLower: { value: 1.8, norm: '1.5-2.5mm', interpretation: 'Норма' }
        },
        penAnalysis: {
          molarInclinationUpper: { value: 90.0, norm: '85-95°', interpretation: 'Норма' },
          molarInclinationLower: { value: 92.0, norm: '88-98°', interpretation: 'Норма' }
        },
        basalWidth: {
          upper: { value: 45.0, norm: '43-47mm', interpretation: 'Норма' },
          lower: { value: 42.0, norm: '40-44mm', interpretation: 'Норма' },
          deficit: { value: 3.0, norm: '2-4mm', interpretation: 'Норма' }
        },
        airway: {
          tonguePosition: { value: 'Нормальное', interpretation: 'Язык в правильном положении' },
          airwayVolume: { value: 25.0, norm: '20-30cm³', interpretation: 'Норма' },
          narrowestPoint: { value: 8.0, norm: '>6mm', interpretation: 'Норма' }
        }
      },
      diagnoses: [
        'Нормальное положение суставных головок',
        'Достаточный объем костной ткани',
        'Проходимость воздухоносных путей в норме'
      ]
    };
  }

  static generateMockModelingData(patientId) {
    const savedData = localStorage.getItem(`modeling_${patientId}`);
    if (savedData) {
      return JSON.parse(savedData);
    }

    return {
      patientId: patientId,
      analysisDate: new Date().toISOString(),
      models: {
        skull: null,
        maxilla: null,
        mandible: null,
        teeth: null,
        setup: null
      },
      simulations: {
        initial: {
          description: 'Исходное положение',
          issues: ['Скученность фронтальных зубов', 'Глубокая окклюзия']
        },
        predicted: {
          description: 'Прогнозируемый результат',
          improvements: ['Устранение скученности', 'Нормализация окклюзии'],
          treatmentTime: '18-24 месяца'
        },
        setup: {
          description: 'Setup-модель',
          toothMovements: [
            { tooth: '11', movement: 'Дистализация 2mm' },
            { tooth: '21', movement: 'Дистализация 2mm' },
            { tooth: '31', movement: 'Мезиализация 1mm' },
            { tooth: '41', movement: 'Мезиализация 1mm' }
          ]
        }
      },
      treatmentPlan: {
        phases: [
          {
            phase: 1,
            duration: '6-8 месяцев',
            procedures: ['Сепарация', 'Наклейка брекетов', 'Нить 0.014 NiTi']
          },
          {
            phase: 2,
            duration: '6-8 месяцев',
            procedures: ['Прямые дуги', 'Коррекция наклона', 'Закрытие промежутков']
          },
          {
            phase: 3,
            duration: '6-8 месяцев',
            procedures: ['Детализация', 'Финиширование', 'Ретенция']
          }
        ],
        appliances: ['Брекет-система Damon Q', 'Эластики II класса', 'Транспалатинальная дуга'],
        retention: ['Небный ретейнер', 'Каппа на нижнюю челюсть']
      },
      diagnoses: [
        'Скученность зубов',
        'Глубокая резцовая окклюзия',
        'Рекомендовано ортодонтическое лечение брекет-системой'
      ]
    };
  }

  // Методы для получения отдельных данных
  static getBiometryData(patientId) {
    return this.generateMockBiometryData(patientId);
  }

  static getCephalometryData(patientId) {
    return this.generateMockCephalometryData(patientId);
  }

  static getPhotometryData(patientId) {
    return this.generateMockPhotometryData(patientId);
  }

  static getCTData(patientId) {
    return this.generateMockCTData(patientId);
  }

  static getModelingData(patientId) {
    return this.generateMockModelingData(patientId);
  }

  // Методы для mock данных (для совместимости)
  static getMockBiometryData(patientId) {
    return this.generateMockBiometryData(patientId);
  }

  static getMockCephalometryData(patientId) {
    return this.generateMockCephalometryData(patientId);
  }

  static getMockPhotometryData(patientId) {
    return this.generateMockPhotometryData(patientId);
  }

  static getMockCTData(patientId) {
    return this.generateMockCTData(patientId);
  }

  static getMockModelingData(patientId) {
    return this.generateMockModelingData(patientId);
  }

  // Fallback данные
  static getFallbackData(patientId) {
    return {
      patientId: patientId,
      modules: {},
      timestamp: new Date().toISOString()
    };
  }

  // Методы для работы с данными
  static getMedicalCardData(patientId, additionalData = {}) {
    return {
      patientId: patientId,
      personalInfo: {
        fullName: 'Иванов Иван Иванович',
        birthDate: '1990-01-01',
        gender: 'Мужской',
        contactInfo: 'example@email.com',
        examinationDate: new Date().toLocaleDateString('ru-RU'),
        complaints: 'эстетический дефект'
      },
      moduleData: {},
      medicalHistory: [
        {
          date: '2024-01-15',
          module: 'biometry',
          diagnosis: 'Сужение зубных рядов',
          treatment: 'Рекомендовано ортодонтическое лечение'
        },
        {
          date: '2024-01-10',
          module: 'cephalometry',
          diagnosis: 'Нормогнатический прикус',
          treatment: 'Наблюдение'
        }
      ],
      treatments: [],
      labResults: [],
      diagnoses: [],
      ...additionalData
    };
  }

  static async getIntegratedOrthodonticData(patientId, modules = {}) {
    return {
      patientId: patientId,
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
          headShapeIndex: 80.5,
          chinPosition: 'правильное',
          chinFold: 'нормальная',
          lipClosure: 'сомкнуты',
          gumSmile: 'нет симптома',
          pupilLine: 'горизонтальная',
          midline: 'совпадает',
          occlusalLine: 'параллельна зрачковой линии',
          comments: 'Гармоничные лицевые пропорции'
        },
        profile45: {
          symmetry: 'удовлетворительная',
          headShape: 'мезоцефалическая',
          faceShape: 'среднее лицо',
          zygomaticProminence: 'нормальная',
          gonialAngle: 'нормальный',
          comments: 'Нормальная симметрия'
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
          comments: 'Прямой профиль'
        }
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
        indices: {
          tonIndex: { value: 1.33, norm: '1.30-1.35', interpretation: 'Норма' },
          boltonAnalysis: {
            anterior: { ratio: 77.2, norm: '77.2±1.65%', interpretation: 'Соотношение в норме' }
          }
        }
      },
      diagnoses: [
        {
          id: 1,
          category: 'Зубные ряды',
          diagnosis: 'Сужение верхнего зубного ряда',
          severity: 'умеренное',
          code: 'K07.2',
          confirmed: true
        },
        {
          id: 2,
          category: 'Окклюзионные',
          diagnosis: 'Глубокая резцовая окклюзия',
          severity: 'умеренная',
          code: 'K07.2',
          confirmed: true
        }
      ],
      treatmentPlan: {
        complexity: 'средней сложности',
        estimatedDuration: '18-24 месяца',
        phases: [
          {
            phase: 1,
            name: 'Подготовительный этап',
            duration: '1-2 месяца',
            objectives: ['Профессиональная гигиена', 'Санирование полости рта'],
            procedures: ['Снятие зубных отложений', 'Лечение кариеса'],
            appliances: []
          },
          {
            phase: 2,
            name: 'Выравнивание и нивелирование',
            duration: '6-8 месяцев',
            objectives: ['Устранение скученности', 'Выравнивание зубных рядов'],
            procedures: ['Сепарация', 'Наклейка брекетов'],
            appliances: ['Брекет-система Damon Q']
          }
        ],
        appliances: [
          'Брекет-система Damon Q',
          'Эластики II класса'
        ],
        retention: [
          'Небный ретейнер (фиксированный)',
          'Съемная каппа на ночь'
        ]
      }
    };
  }

  // Сохранение данных
  static saveBiometryData(patientId, data) {
    try {
      const savedData = {
        patientId: patientId,
        ...data,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(`biometry_${patientId}`, JSON.stringify(savedData));
      return true;
    } catch (error) {
      console.error('Error saving biometry data:', error);
      return false;
    }
  }

  static saveCephalometryData(patientId, data) {
    try {
      const savedData = {
        patientId: patientId,
        ...data,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(`cephalometry_${patientId}`, JSON.stringify(savedData));
      return true;
    } catch (error) {
      console.error('Error saving cephalometry data:', error);
      return false;
    }
  }

  static savePhotometryData(patientId, data) {
    try {
      const savedData = {
        patientId: patientId,
        ...data,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(`photometry_${patientId}`, JSON.stringify(savedData));
      return true;
    } catch (error) {
      console.error('Error saving photometry data:', error);
      return false;
    }
  }

  static saveCTData(patientId, data) {
    try {
      const savedData = {
        patientId: patientId,
        ...data,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(`ct_${patientId}`, JSON.stringify(savedData));
      return true;
    } catch (error) {
      console.error('Error saving CT data:', error);
      return false;
    }
  }

  static saveModelingData(patientId, data) {
    try {
      const savedData = {
        patientId: patientId,
        ...data,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(`modeling_${patientId}`, JSON.stringify(savedData));
      return true;
    } catch (error) {
      console.error('Error saving modeling data:', error);
      return false;
    }
  }

  static getPresentationData(patientId) {
    const biometryData = this.generateMockBiometryData(patientId);
    const cephalometryData = this.generateMockCephalometryData(patientId);
    const photometryData = this.generateMockPhotometryData(patientId);
    const ctData = this.generateMockCTData(patientId);
    const modelingData = this.generateMockModelingData(patientId);

    return {
      slide8: {
        title: 'Антропометрические исследования',
        data: {
          dentalFormula: {
            upperJaw: biometryData.toothMeasurements?.upperJaw || {},
            lowerJaw: biometryData.toothMeasurements?.lowerJaw || {}
          },
          toothDevelopmentStage: 'Период смены зубов',
          archDimensions: {
            upperArchLength: 45.2,
            lowerArchLength: 44.8,
            upperArchWidth: 32.5,
            lowerArchWidth: 31.8
          },
          analyses: biometryData.analyses || {}
        }
      },
      slide14: {
        title: 'Диагноз',
        diagnoses: [
          'Ретрогнатия верхней челюсти',
          'Ретрогнатия нижней челюсти',
          'Сужение верхнего зубного ряда',
          'Сужение нижнего зубного ряда',
          'Глубокая резцовая окклюзия'
        ]
      }
    };
  }
}