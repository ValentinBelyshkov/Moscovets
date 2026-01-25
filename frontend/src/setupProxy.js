const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Determine the target based on environment
  // Note: This is only used during development, not in production Docker builds
  const target = process.env.REACT_APP_URL_API || 'http://backend:5001';
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: target,
      changeOrigin: true,
    })
  );
};