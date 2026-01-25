import axios from 'axios';

// Use runtime configuration with fallback to build-time environment variable
const getApiBaseUrl = () => {
  // First try runtime config (from env-config.js)
  if (typeof window !== 'undefined' && window._env_ && window._env_.REACT_APP_URL_API) {
    return window._env_.REACT_APP_URL_API;
  }
  // Fallback to build-time environment variable
  return process.env.REACT_APP_URL_API || 'http://109.196.102.193:5001';
};

const API_BASE_URL = `${getApiBaseUrl()}/api/v1`;

class ModelingService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Добавляем интерцептор для добавления токена авторизации
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  // Загрузка 3D модели
  async uploadModel(file, patientId, modelType, modelFormat) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', patientId);
    formData.append('model_type', modelType);
    formData.append('model_format', modelFormat);

    try {
      const response = await this.api.post('/modeling/upload-model', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Получение списка 3D моделей
  async getModels(patientId = null, modelType = null, skip = 0, limit = 100) {
    try {
      const params = { skip, limit };
      if (patientId) params.patient_id = patientId;
      if (modelType) params.model_type = modelType;

      const response = await this.api.get('/modeling/models', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Получение 3D модели по ID
  async getModel(modelId) {
    try {
      const response = await this.api.get(`/modeling/models/${modelId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Анализ 3D модели
  async analyzeModel(modelId) {
    try {
      const response = await this.api.post(`/modeling/analyze-model`, { model_id: modelId });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Создание сессии моделирования
  async createModelingSession(sessionData) {
    try {
      const response = await this.api.post('/modeling/sessions', sessionData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Получение списка сессий моделирования
  async getModelingSessions(patientId = null, skip = 0, limit = 100) {
    try {
      const params = { skip, limit };
      if (patientId) params.patient_id = patientId;

      const response = await this.api.get('/modeling/sessions', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Получение сессии моделирования с моделями
  async getModelingSession(sessionId) {
    try {
      const response = await this.api.get(`/modeling/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Добавление модели в сессию
  async addModelToSession(sessionId, modelType, modelId) {
    try {
      const response = await this.api.post(`/modeling/sessions/${sessionId}/add-model`, {
        model_type: modelType,
        model_id: modelId,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Сборка моделей
  async assembleModels(sessionId, autoAlign = true, tolerance = 0.1) {
    try {
      const response = await this.api.post('/modeling/assemble-models', {
        session_id: sessionId,
        auto_align: autoAlign,
        tolerance: tolerance,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Создание окклюзионной накладки
  async createOcclusionPad(sessionId, padThickness = 2.0, marginOffset = 0.5, cementGap = 0.1) {
    try {
      const response = await this.api.post('/modeling/create-occlusion-pad', {
        session_id: sessionId,
        pad_thickness: padThickness,
        margin_offset: marginOffset,
        cement_gap: cementGap,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Экспорт модели
  async exportModel(sessionId, modelType, exportFormat, includeTextures = false) {
    try {
      const response = await this.api.post('/modeling/export-model', {
        session_id: sessionId,
        model_type: modelType,
        export_format: exportFormat,
        include_textures: includeTextures,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Скачивание 3D модели
  async downloadModel(modelId) {
    try {
      const response = await this.api.get(`/modeling/models/${modelId}/download`, {
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Скачивание экспортированной модели
  async downloadExportedModel(filename) {
    try {
      const response = await this.api.get(`/modeling/download-export/${filename}`, {
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Обработка ошибок
  handleError(error) {
    if (error.response) {
      // Ошибка ответа от сервера
      const message = error.response.data?.detail || error.response.data?.message || 'Server error';
      return new Error(message);
    } else if (error.request) {
      // Ошибка запроса (нет ответа)
      return new Error('Network error. Please check your connection.');
    } else {
      // Другая ошибка
      return new Error(error.message || 'An error occurred');
    }
  }

  // Вспомогательные методы для работы с файлами
  getModelFileUrl(modelId) {
    return `${API_BASE_URL}/modeling/models/${modelId}/download`;
  }

  getExportFileUrl(filename) {
    return `${API_BASE_URL}/modeling/download-export/${filename}`;
  }

  // Константы для типов моделей
  static MODEL_TYPES = {
    UPPER_JAW: 'upper_jaw',
    LOWER_JAW: 'lower_jaw',
    BITE_1: 'bite_1',
    BITE_2: 'bite_2',
    OCCLUSION_PAD: 'occlusion_pad',
  };

  // Константы для форматов моделей
  static MODEL_FORMATS = {
    STL: 'stl',
    OBJ: 'obj',
  };

  // Константы для статусов моделирования
  static MODELING_STATUSES = {
    UPLOADED: 'uploaded',
    ASSEMBLED: 'assembled',
    PAD_CREATED: 'pad_created',
    EDITED: 'edited',
    EXPORTED: 'exported',
  };
}

// Создаем экземпляр сервиса
const modelingService = new ModelingService();

export default modelingService;