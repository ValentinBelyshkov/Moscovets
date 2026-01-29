const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Determine the target based on environment
  // Note: This is only used during development, not in production Docker builds
  const target = process.env.REACT_APP_URL_API;
  
  if (!target) {
    throw new Error(
      'REACT_APP_URL_API не настроен. Пожалуйста, установите переменную окружения REACT_APP_URL_API.\n' +
      'Например: REACT_APP_URL_API=http://backend:5001 (для Docker) или REACT_APP_URL_API=http://localhost:8000 (для локальной разработки)'
    );
  }
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: target,
      changeOrigin: true,
    })
  );
};