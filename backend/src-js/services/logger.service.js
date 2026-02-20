const winston = require('winston');
const path = require('path');
const fs = require('fs');

// ✅ Elastic Beanstalk SAFE logs directory
const logsDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length) log += ` | ${JSON.stringify(meta)}`;
    if (stack) log += `\n${stack}`;
    return log;
  })
);

// Transports
const transports = [
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 5 * 1024 * 1024,
    maxFiles: 5,
  }),
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    maxsize: 5 * 1024 * 1024,
    maxFiles: 10,
  }),
];

// 👉 EB / Production → CloudWatch via stdout
if (process.env.NODE_ENV === 'production') {
  transports.push(new winston.transports.Console());
} else {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'pg-management' },
  transports,
});

// Helpers
logger.api = (method, url, statusCode, duration, userId = null) =>
  logger.info('API', { method, url, statusCode, duration, userId });

logger.auth = (action, userId, email, ip) =>
  logger.info('AUTH', { action, userId, email, ip });

logger.business = (event, data) =>
  logger.info('BUSINESS', { event, ...data });

logger.security = (event, details) =>
  logger.warn('SECURITY', { event, ...details });

logger.performance = (operation, duration, meta = {}) =>
  logger[duration > 1000 ? 'warn' : 'info']('PERF', { operation, duration, ...meta });

logger.websocket = (event, socketId, userId, data = {}) =>
  logger.info('WS', { event, socketId, userId, ...data });

logger.errorWithContext = (error, context = {}) =>
  logger.error(error.message || error, { stack: error.stack, ...context });

module.exports = logger;
