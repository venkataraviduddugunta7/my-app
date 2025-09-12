const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const compression = require('compression');
const dotenv = require('dotenv');
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const webSocketService = require('./services/websocket.service');
const logger = require('./services/logger.service');
const schedulerService = require('./services/scheduler.service');

// Import routes
const authRoutes = require('./routes/auth.routes');
const propertyRoutes = require('./routes/property.routes');
const floorRoutes = require('./routes/floor.routes');
const roomRoutes = require('./routes/room.routes');
const bedRoutes = require('./routes/bed.routes');
const tenantRoutes = require('./routes/tenant.routes');
const paymentRoutes = require('./routes/payment.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const settingsRoutes = require('./routes/settings.routes');
const analyticsRoutes = require('./routes/analytics.routes');

// Import middleware
const { errorHandler } = require('./middleware/error.middleware');
const { notFound } = require('./middleware/notFound.middleware');

// Load environment variables
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Rate limiting - More generous limits for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '300000'), // 5 minutes (reduced window)
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '500'), // 500 requests per window (increased)
  message: {
    error: {
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '300000') / 1000)
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks and development
    if (process.env.NODE_ENV === 'development' && req.ip === '::1') {
      return true;
    }
    return req.path === '/health';
  }
});

// Initialize WebSocket service
webSocketService.initialize(server);

// Performance and Security Middleware
app.use(compression()); // Gzip compression
app.use(helmet()); // Security headers

// Slow down middleware for additional protection
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // Allow 100 requests per windowMs without delay
  delayMs: 500 // Add 500ms delay per request after delayAfter
});

app.use(speedLimiter);

// Apply rate limiting conditionally
if (process.env.NODE_ENV !== 'development' || process.env.ENABLE_RATE_LIMIT === 'true') {
  app.use(limiter); // Rate limiting
} else {
  console.log('⚠️  Rate limiting disabled for development');
}
// CORS configuration - Allow all localhost origins in development
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or direct server access)
    if (!origin) return callback(null, true);
    
    // In development, allow all localhost origins
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // For production, use allowed origins from env
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:3000'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));
// Custom Morgan logging with Winston
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim(), { type: 'http' })
  }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Get system stats
    const connectedUsers = webSocketService.getConnectedUsers().length;
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.status(200).json({
      status: 'OK',
      message: 'PG Management API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      uptime: `${Math.floor(uptime / 60)} minutes`,
      database: 'connected',
      websocket: {
        status: 'active',
        connectedUsers
      },
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`
      }
    });
  } catch (error) {
    logger.errorWithContext(error, { endpoint: 'health' });
    res.status(503).json({
      status: 'ERROR',
      message: 'Service unavailable',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔌 WebSocket enabled for real-time updates`);
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket enabled for real-time updates`);
      
      // Start scheduler service in production
      if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
        schedulerService.start();
        logger.info(`⏰ Scheduler service started`);
        console.log(`⏰ Scheduler service started`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  
  // Stop scheduler service
  schedulerService.stop();
  
  // Disconnect WebSocket
  if (webSocketService.io) {
    webSocketService.io.close();
  }
  
  // Disconnect database
  await prisma.$disconnect();
  
  logger.info('Server shutdown complete');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down server...');
  
  // Stop scheduler service
  schedulerService.stop();
  
  // Disconnect WebSocket
  if (webSocketService.io) {
    webSocketService.io.close();
  }
  
  // Disconnect database
  await prisma.$disconnect();
  
  logger.info('Server shutdown complete');
  process.exit(0);
});

// Export for testing
module.exports = { app, server, prisma, webSocketService, schedulerService };

startServer(); 