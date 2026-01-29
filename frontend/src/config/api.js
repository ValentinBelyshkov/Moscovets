// Centralized API configuration
// This file provides a consistent way to get the API base URL across all services

/**
 * Gets the API base URL from environment variables
 * Throws an error if REACT_APP_URL_API is not configured
 * @returns {string} The API base URL
 */
export const getApiBaseUrl = () => {
  // First try runtime config (from env-config.js)
  if (typeof window !== 'undefined' && window._env_ && window._env_.REACT_APP_URL_API) {
    return window._env_.REACT_APP_URL_API;
  }
  
  // Fallback to build-time environment variable
  if (process.env.REACT_APP_URL_API) {
    return process.env.REACT_APP_URL_API;
  }
  
  // Throw error if not configured - don't use hardcoded defaults
  throw new Error(
    'REACT_APP_URL_API не настроен. Пожалуйста, установите переменную окружения REACT_APP_URL_API.\n' +
    'Например: REACT_APP_URL_API=http://109.196.102.193:5001'
  );
};

/**
 * Gets the full API base URL including /api/v1 path
 * @returns {string} The full API base URL with /api/v1
 */
export const getApiV1BaseUrl = () => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/api/v1`;
};

export default {
  getApiBaseUrl,
  getApiV1BaseUrl,
};
