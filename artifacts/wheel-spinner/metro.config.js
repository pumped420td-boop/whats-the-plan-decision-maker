const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const artifactPrefix = '/artifacts/wheel-spinner';
const defaultEnhanceMiddleware = config.server?.enhanceMiddleware;

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const enhancedMiddleware = defaultEnhanceMiddleware
      ? defaultEnhanceMiddleware(middleware, server)
      : middleware;

    return (request, response, next) => {
      if (request.url === artifactPrefix || request.url.startsWith(`${artifactPrefix}/`)) {
        request.url = request.url.slice(artifactPrefix.length) || '/';
      }
      return enhancedMiddleware(request, response, next);
    };
  },
};

module.exports = config;
