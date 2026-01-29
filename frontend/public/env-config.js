// Runtime environment configuration
window._env_ = window._env_ || {};

// Allow overriding from query parameters for testing
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('api_url')) {
  window._env_.REACT_APP_URL_API = urlParams.get('api_url');
}

// Also check for common environment variable names for compatibility
if (window._env_.REACT_APP_API_URL && !window._env_.REACT_APP_URL_API) {
  window._env_.REACT_APP_URL_API = window._env_.REACT_APP_API_URL;
}

// Note: REACT_APP_URL_API must be set via build-time environment variables
// or injected by the deployment environment (e.g., via entrypoint script in Docker)