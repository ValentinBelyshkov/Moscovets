// services/ModuleDataService.js

export class ModuleDataService {
  
  // Получение всех данных модулей для пациента
  static async getAllModuleData(patientId) {
    try {
      console.log(`Loading all module data for patient ${patientId}`);
      
      // Проверяем localStorage для каждого модуля
      const modules = {};
      
      // Цефалометрия
      const cephalometryData = await this.getCephalometryData(patientId);
      if (cephalometryData) {
        modules.cephalometry = cephalometryData;
      }
      
      // Биометрия
      const biometryData = await this.getBiometryData(patientId);
      if (biometryData) {
        modules.biometry = biometryData;
      }
      
      // Фотометрия
      const photometryData = await this.getPhotometryData(patientId);
      if (photometryData) {
        modules.photometry = photometryData;
      }
      
      // КТ анализ
      const ctData = await this.getCTData(patientId);
      if (ctData) {
        modules.ct = ctData;
      }
      
      // Моделирование
      const modelingData = await this.getModelingData(patientId);
      if (modelingData) {
        modules.modeling = modelingData;
      }
      
      // Диагностика
      const diagnosticsData = await this.getDiagnosticsData(patientId);
      if (diagnosticsData) {
        modules.diagnostics = diagnosticsData;
      }
      
      // Лечение
      const treatmentData = await this.getTreatmentData(patientId);
      if (treatmentData) {
        modules.treatment = treatmentData;
      }
      
      return {
        modules,
        timestamp: new Date().toISOString(),
        patientId,
        moduleCount: Object.keys(modules).length
      };
      
    } catch (error) {
      console.error('Error loading module data:', error);
      return this.getMockModuleData(patientId);
    }
  }
  
  // Получение данных цефалометрии
  static async getCephalometryData(patientId) {
    try {
      // Проверяем localStorage
      const localData = localStorage.getItem(`cephalometry_${patientId}`);
      if (localData) {
        return JSON.parse(localData);
      }
      
      // Проверяем mock данные в localStorage
      const mockDataKey = `mock_cephalometry_${patientId}`;
      const mockData = localStorage.getItem(mockDataKey);
      if (mockData) {
        return JSON.parse(mockData);
      }
      
      // Если нет данных, возвращаем null
      return null;
      
    } catch (error) {
      console.error('Error loading cephalometry data:', error);
      return null;
    }
  }
  
  // Получение данных биометрии
  static async getBiometryData(patientId) {
    try {
      const localData = localStorage.getItem(`biometry_${patientId}`);
      return localData ? JSON.parse(localData) : null;
    } catch (error) {
      console.error('Error loading biometry data:', error);
      return null;
    }
  }
  
  // Получение данных фотометрии
  static async getPhotometryData(patientId) {
    try {
      const localData = localStorage.getItem(`photometry_${patientId}`);
      return localData ? JSON.parse(localData) : null;
    } catch (error) {
      console.error('Error loading photometry data:', error);
      return null;
    }
  }
  
  // Получение данных КТ
  static async getCTData(patientId) {
    try {
      const localData = localStorage.getItem(`ct_${patientId}`);
      return localData ? JSON.parse(localData) : null;
    } catch (error) {
      console.error('Error loading CT data:', error);
      return null;
    }
  }
  
  // Получение данных моделирования
  static async getModelingData(patientId) {
    try {
      const localData = localStorage.getItem(`modeling_${patientId}`);
      return localData ? JSON.parse(localData) : null;
    } catch (error) {
      console.error('Error loading modeling data:', error);
      return null;
    }
  }
  
  // Получение диагностических данных
  static async getDiagnosticsData(patientId) {
    try {
      const localData = localStorage.getItem(`diagnostics_${patientId}`);
      return localData ? JSON.parse(localData) : null;
    } catch (error) {
      console.error('Error loading diagnostics data:', error);
      return null;
    }
  }
  
  // Получение данных лечения
  static async getTreatmentData(patientId) {
    try {
      const localData = localStorage.getItem(`treatment_${patientId}`);
      return localData ? JSON.parse(localData) : null;
    } catch (error) {
      console.error('Error loading treatment data:', error);
      return null;
    }
  }
  
  // Сохранение цефалометрических данных
  static async saveCephalometryData(patientId, data) {
    try {
      console.log(`Saving cephalometry data for patient ${patientId}:`, data);
      
      // Сохраняем в localStorage
      localStorage.setItem(`cephalometry_${patientId}`, JSON.stringify({
        ...data,
        savedAt: new Date().toISOString(),
        patientId
      }));
      
      // Также сохраняем в мок-данные для демонстрации
      localStorage.setItem(`mock_cephalometry_${patientId}`, JSON.stringify({
        ...data,
        savedAt: new Date().toISOString(),
        patientId,
        isMock: true
      }));
      
      return {
        success: true,
        message: 'Данные цефалометрии успешно сохранены',
        timestamp: new Date().toISOString(),
        data
      };
      
    } catch (error) {
      console.error('Error saving cephalometry data:', error);
      return {
        success: false,
        message: 'Ошибка при сохранении данных',
        error: error.message
      };
    }
  }
  
  // Сохранение данных любого модуля
  static async saveModuleData(patientId, moduleType, data) {
    try {
      const key = `${moduleType}_${patientId}`;
      localStorage.setItem(key, JSON.stringify({
        ...data,
        savedAt: new Date().toISOString(),
        patientId,
        moduleType
      }));
      
      return {
        success: true,
        message: `Данные модуля ${moduleType} успешно сохранены`,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`Error saving ${moduleType} data:`, error);
      return {
        success: false,
        message: `Ошибка при сохранении данных модуля ${moduleType}`,
        error: error.message
      };
    }
  }
  
  // Получение данных для медицинской карты
  static getMedicalCardData(patientId, additionalData = {}) {
    const baseData = {
      patientId,
      personalInfo: {
        fullName: 'Иванов Иван Иванович',
        birthDate: '1990-05-15',
        gender: 'мужской',
        contactInfo: '+7 (999) 123-45-67',
        examinationDate: new Date().toLocaleDateString('ru-RU'),
        complaints: 'эстетический дефект, нарушение прикуса'
      },
      medicalHistory: [
        {
          date: '2024-01-15',
          module: 'cephalometry',
          diagnosis: 'Нормогнатический прикус',
          treatment: 'Рекомендовано ортодонтическое лечение'
        },
        {
          date: '2024-01-10',
          module: 'biometry',
          diagnosis: 'Сужение зубных рядов',
          treatment: 'Наблюдение'
        }
      ],
      treatments: [],
      labResults: [],
      diagnoses: []
    };
    
    // Добавляем дополнительные данные из модулей
    if (additionalData.cephalometry) {
      baseData.medicalHistory.push({
        date: additionalData.cephalometry.analysisDate || new Date().toISOString().split('T')[0],
        module: 'cephalometry',
        diagnosis: additionalData.cephalometry.conclusions?.[0] || 'Цефалометрический анализ',
        treatment: 'Анализ завершен, данные сохранены'
      });
    }
    
    // Добавляем integrated ортодонтические данные если есть
    if (additionalData.orthodonticData) {
      baseData.orthodonticData = additionalData.orthodonticData;
    }
    
    return baseData;
  }
  
  // Получение интегрированных ортодонтических данных
  static async getIntegratedOrthodonticData(patientId, modules) {
    try {
      // Собираем данные из всех модулей
      const integratedData = {
        patientId,
        analysisDate: new Date().toISOString().split('T')[0],
        
        // Анамнез (из базы данных или мок)
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
        
        // Фотометрический анализ
        photoAnalysis: modules.photometry || {
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
          }
        },
        
        // Цефалометрический анализ
        cephalometry: modules.cephalometry || null,
        
        // Биометрия
        biometry: modules.biometry || null,
        
        // Диагнозы
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
        
        // План лечения
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
      
      // Если есть цефалометрические данные, добавляем их в диагнозы
      if (modules.cephalometry && modules.cephalometry.conclusions) {
        modules.cephalometry.conclusions.forEach((conclusion, index) => {
          integratedData.diagnoses.push({
            id: integratedData.diagnoses.length + 1,
            category: 'Цефалометрические',
            diagnosis: conclusion,
            severity: 'информационный',
            code: 'Z01.0',
            confirmed: true
          });
        });
      }
      
      return integratedData;
      
    } catch (error) {
      console.error('Error integrating orthodontic data:', error);
      return this.getMockOrthodonticData(patientId);
    }
  }
  
  // Mock данные для демонстрации
  static getMockModuleData(patientId) {
    return {
      modules: {
        cephalometry: this.getMockCephalometryData(patientId),
        biometry: this.getMockBiometryData(patientId),
        photometry: this.getMockPhotometryData(patientId)
      },
      timestamp: new Date().toISOString(),
      patientId,
      moduleCount: 3
    };
  }
  
  static getMockCephalometryData(patientId) {
    return {
      patientId,
      analysisDate: '2024-01-20',
      projectionType: 'lateral',
      measurements: {
        SNA: { value: 82.5, unit: '°', norm: '80-84°', interpretation: 'Норма' },
        SNB: { value: 79.0, unit: '°', norm: '78-82°', interpretation: 'Норма' },
        ANB: { value: 3.5, unit: '°', norm: '0-4°', interpretation: 'Норма' },
        SN_Pg: { value: 82.0, unit: '°', norm: '82°', interpretation: 'Норма' },
        NSBa: { value: 131.5, unit: '°', norm: '130-133°', interpretation: 'Норма' },
        NL_NSL: { value: 7.2, unit: '°', norm: '5-9°', interpretation: 'Норма' },
        ML_NSL: { value: 32.1, unit: '°', norm: '30-34°', interpretation: 'Норма' },
        NL_ML: { value: 24.8, unit: '°', norm: '22-26°', interpretation: 'Норма' },
        GonialAngle: { value: 125.0, unit: '°', norm: '115-135°', interpretation: 'Норма' },
        U1_NL: { value: 110.5, unit: '°', norm: '105-115°', interpretation: 'Норма' },
        L1_ML: { value: 92.5, unit: '°', norm: '90-95°', interpretation: 'Норма' },
        SGo_NMe: { value: 63.5, unit: '%', norm: '62-65%', interpretation: 'Норма' }
      },
      conclusions: [
        "Нормогнатический тип строения черепа",
        "Нормальное соотношение челюстей",
        "Гармоничный лицевой профиль",
        "I скелетный класс по классификации Энгля"
      ],
      recommendations: [
        "Ортодонтическое лечение для коррекции окклюзии",
        "Мониторинг роста у подростков",
        "Контроль через 6 месяцев"
      ],
      points: {
        S: { x: 150, y: 200 },
        N: { x: 180, y: 180 },
        A: { x: 220, y: 250 },
        B: { x: 240, y: 280 }
      },
      scale: 2.5
    };
  }
  
  static getMockBiometryData(patientId) {
    return {
      patientId,
      analysisDate: '2024-01-18',
      measurements: {
        toothSizes: {
          upper: {
            '11': 8.5, '12': 7.0, '13': 7.8, '14': 7.2, '15': 7.0, '16': 10.5
          },
          lower: {
            '31': 5.2, '32': 6.0, '33': 6.8, '34': 7.0, '35': 7.5, '36': 11.0
          }
        },
        archWidth: {
          upper: 35.5,
          lower: 33.2
        },
        crowding: {
          upper: 3.5,
          lower: 4.2
        }
      }
    };
  }
  
  static getMockPhotometryData(patientId) {
    return {
      patientId,
      analysisDate: '2024-01-19',
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
      }
    };
  }
  
  static getMockOrthodonticData(patientId) {
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
          }
        ]
      }
    };
  }
}