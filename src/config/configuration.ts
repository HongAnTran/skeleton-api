export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
    logging:
      process.env.DATABASE_LOGGING === 'true' ||
      process.env.NODE_ENV === 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key',
  },
  cors: {
    enabled: process.env.APP_CORS_ENABLED !== 'false',
    origin: process.env.APP_CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
    ],
  },
  helmet: {
    enabled: process.env.APP_HELMET_ENABLED !== 'false',
  },
  swagger: {
    enabled:
      process.env.SWAGGER_ENABLED === 'true' ||
      process.env.NODE_ENV !== 'production',
    path: process.env.SWAGGER_PATH || 'docs',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 10,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  health: {
    timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT, 10) || 5000,
  },
  kiotviet: {
    retailer: process.env.KIOTVIET_RETAILER,
    clientId: process.env.KIOTVIET_CLIENT_ID,
    clientSecret: process.env.KIOTVIET_CLIENT_SECRET,
  },
});
