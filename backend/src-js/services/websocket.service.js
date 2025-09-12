const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.propertyRooms = new Map(); // propertyId -> Set of socketIds
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'development' 
          ? ['http://localhost:3000', 'http://localhost:3001'] 
          : process.env.ALLOWED_ORIGINS?.split(',') || [],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, email: true, fullName: true, role: true, isActive: true }
        });

        if (!user || !user.isActive) {
          return next(new Error('Invalid or inactive user'));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    this.setupEventHandlers();
    console.log('🔌 WebSocket service initialized');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`👤 User ${socket.user.fullName} connected (${socket.id})`);
      this.connectedUsers.set(socket.id, socket.user);

      // Join property-specific rooms
      socket.on('join-property', async (propertyId) => {
        try {
          // Verify user has access to this property
          const property = await prisma.property.findFirst({
            where: {
              id: propertyId,
              ownerId: socket.userId
            }
          });

          if (property) {
            socket.join(`property:${propertyId}`);
            
            // Track property rooms
            if (!this.propertyRooms.has(propertyId)) {
              this.propertyRooms.set(propertyId, new Set());
            }
            this.propertyRooms.get(propertyId).add(socket.id);

            socket.emit('joined-property', { propertyId, propertyName: property.name });
            console.log(`🏠 User ${socket.user.fullName} joined property ${property.name}`);
          } else {
            socket.emit('error', { message: 'Access denied to property' });
          }
        } catch (error) {
          socket.emit('error', { message: 'Failed to join property' });
        }
      });

      // Leave property room
      socket.on('leave-property', (propertyId) => {
        socket.leave(`property:${propertyId}`);
        if (this.propertyRooms.has(propertyId)) {
          this.propertyRooms.get(propertyId).delete(socket.id);
        }
        socket.emit('left-property', { propertyId });
      });

      // Real-time dashboard subscription
      socket.on('subscribe-dashboard', (propertyId) => {
        socket.join(`dashboard:${propertyId}`);
        console.log(`📊 User subscribed to dashboard updates for property ${propertyId}`);
      });

      // Real-time bed status subscription
      socket.on('subscribe-beds', (propertyId) => {
        socket.join(`beds:${propertyId}`);
        console.log(`🛏️ User subscribed to bed updates for property ${propertyId}`);
      });

      // Real-time payment subscription
      socket.on('subscribe-payments', (propertyId) => {
        socket.join(`payments:${propertyId}`);
        console.log(`💰 User subscribed to payment updates for property ${propertyId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`👋 User ${socket.user.fullName} disconnected`);
        this.connectedUsers.delete(socket.id);
        
        // Clean up property rooms
        for (const [propertyId, socketIds] of this.propertyRooms.entries()) {
          socketIds.delete(socket.id);
          if (socketIds.size === 0) {
            this.propertyRooms.delete(propertyId);
          }
        }
      });
    });
  }

  // Broadcast methods for real-time updates
  broadcastDashboardUpdate(propertyId, data) {
    if (this.io) {
      this.io.to(`dashboard:${propertyId}`).emit('dashboard-update', {
        type: 'stats',
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  broadcastBedUpdate(propertyId, bedData) {
    if (this.io) {
      this.io.to(`beds:${propertyId}`).emit('bed-update', {
        type: 'bed-status-change',
        data: bedData,
        timestamp: new Date().toISOString()
      });
    }
  }

  broadcastTenantUpdate(propertyId, tenantData, action = 'update') {
    if (this.io) {
      this.io.to(`property:${propertyId}`).emit('tenant-update', {
        type: action, // 'create', 'update', 'delete', 'vacate'
        data: tenantData,
        timestamp: new Date().toISOString()
      });
    }
  }

  broadcastPaymentUpdate(propertyId, paymentData, action = 'update') {
    if (this.io) {
      this.io.to(`payments:${propertyId}`).emit('payment-update', {
        type: action,
        data: paymentData,
        timestamp: new Date().toISOString()
      });
    }
  }

  broadcastActivity(propertyId, activity) {
    if (this.io) {
      this.io.to(`property:${propertyId}`).emit('new-activity', {
        ...activity,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Send notification to specific user
  sendNotification(userId, notification) {
    if (this.io) {
      // Find all sockets for this user
      const userSockets = Array.from(this.connectedUsers.entries())
        .filter(([socketId, user]) => user.id === userId)
        .map(([socketId]) => socketId);

      userSockets.forEach(socketId => {
        this.io.to(socketId).emit('notification', {
          ...notification,
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  // Broadcast system-wide maintenance notifications
  broadcastMaintenance(message, type = 'info') {
    if (this.io) {
      this.io.emit('system-notification', {
        type,
        message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get connected users count for a property
  getPropertyUserCount(propertyId) {
    return this.propertyRooms.get(propertyId)?.size || 0;
  }

  // Get all connected users
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  // Emergency broadcast (for critical alerts)
  emergencyBroadcast(propertyId, alert) {
    if (this.io) {
      this.io.to(`property:${propertyId}`).emit('emergency-alert', {
        ...alert,
        priority: 'CRITICAL',
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Singleton instance
const webSocketService = new WebSocketService();

module.exports = webSocketService;
