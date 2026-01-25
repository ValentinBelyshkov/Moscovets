// Runtime environment configuration
window._env_ = window._env_ || {};

// Default values - use backend URL directly
// Services will append /api/v1/... paths
window._env_.REACT_APP_URL_API = window._env_.REACT_APP_URL_API || 'http://109.196.102.193:5001';

// Allow overriding from query parameters for testing
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('api_url')) {
  window._env_.REACT_APP_URL_API = urlParams.get('api_url');
}

// Also check for common environment variable names for compatibility
if (window._env_.REACT_APP_API_URL && !window._env_.REACT_APP_URL_API) {
  window._env_.REACT_APP_URL_API = window._env_.REACT_APP_API_URL;
}