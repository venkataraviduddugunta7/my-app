const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logEntry = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logEntry += ` | Meta: ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      logEntry += `\nStack: ${stack}`;
    }
    
    return logEntry;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'pg-management' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
    
    // Application log file
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 7,
    }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let logEntry = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          logEntry += ` ${JSON.stringify(meta)}`;
        }
        return logEntry;
      })
    )
  }));
}

// Custom methods for different types of logs
logger.api = (method, url, statusCode, duration, userId = null) => {
  logger.info('API Request', {
    type: 'api',
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    userId
  });
};

logger.auth = (action, userId, email, ip) => {
  logger.info('Auth Event', {
    type: 'auth',
    action,
    userId,
    email,
    ip
  });
};

logger.business = (event, data) => {
  logger.info('Business Event', {
    type: 'business',
    event,
    ...data
  });
};

logger.security = (event, details) => {
  logger.warn('Security Event', {
    type: 'security',
    event,
    ...details
  });
};

logger.performance = (operation, duration, metadata = {}) => {
  const level = duration > 1000 ? 'warn' : 'info';
  logger[level]('Performance Metric', {
    type: 'performance',
    operation,
    duration: `${duration}ms`,
    ...metadata
  });
};

logger.websocket = (event, socketId, userId, data = {}) => {
  logger.info('WebSocket Event', {
    type: 'websocket',
    event,
    socketId,
    userId,
    ...data
  });
};

// Error reporting with context
logger.errorWithContext = (error, context = {}) => {
  logger.error(error.message || error, {
    type: 'error',
    stack: error.stack,
    ...context
  });
};

module.exports = logger;
