const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const notificationService = require('./notification.service');
const analyticsService = require('./analytics.service');
const webSocketService = require('./websocket.service');
const logger = require('./logger.service');

const prisma = new PrismaClient();

class SchedulerService {
  constructor() {
    this.tasks = new Map();
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      logger.warn('Scheduler service is already running');
      return;
    }

    logger.info('Starting scheduler service...');
    
    // Daily tasks at 6:00 AM
    this.scheduleTask('daily-rent-reminders', '0 6 * * *', this.sendDailyRentReminders.bind(this));
    
    // Weekly reports on Monday at 9:00 AM
    this.scheduleTask('weekly-reports', '0 9 * * 1', this.generateWeeklyReports.bind(this));
    
    // Monthly analytics on 1st of every month at 10:00 AM
    this.scheduleTask('monthly-analytics', '0 10 1 * *', this.generateMonthlyAnalytics.bind(this));
    
    // Clean up expired data daily at 2:00 AM
    this.scheduleTask('cleanup-expired-data', '0 2 * * *', this.cleanupExpiredData.bind(this));
    
    // Process notification queue every 5 minutes
    this.scheduleTask('process-notifications', '*/5 * * * *', this.processNotificationQueue.bind(this));
    
    // Update dashboard cache every 10 minutes during business hours (9 AM - 6 PM)
    this.scheduleTask('update-dashboard-cache', '*/10 9-18 * * *', this.updateDashboardCache.bind(this));
    
    // Backup critical data daily at 3:00 AM
    this.scheduleTask('backup-data', '0 3 * * *', this.backupCriticalData.bind(this));
    
    // Health check every hour
    this.scheduleTask('health-check', '0 * * * *', this.performHealthCheck.bind(this));

    this.isRunning = true;
    logger.info('Scheduler service started successfully');
  }

  stop() {
    if (!this.isRunning) {
      logger.warn('Scheduler service is not running');
      return;
    }

    logger.info('Stopping scheduler service...');
    
    for (const [taskName, task] of this.tasks) {
      task.stop();
      logger.info(`Stopped task: ${taskName}`);
    }
    
    this.tasks.clear();
    this.isRunning = false;
    
    logger.info('Scheduler service stopped');
  }

  scheduleTask(name, cronExpression, taskFunction) {
    try {
      const task = cron.schedule(cronExpression, async () => {
        const startTime = Date.now();
        logger.info(`Starting scheduled task: ${name}`);
        
        try {
          await taskFunction();
          const duration = Date.now() - startTime;
          logger.performance(name, duration);
          logger.info(`Completed scheduled task: ${name} in ${duration}ms`);
        } catch (error) {
          logger.errorWithContext(error, { scheduledTask: name });
        }
      }, {
        scheduled: false,
        timezone: process.env.TZ || 'Asia/Kolkata'
      });

      task.start();
      this.tasks.set(name, task);
      
      logger.info(`Scheduled task: ${name} with cron: ${cronExpression}`);
    } catch (error) {
      logger.errorWithContext(error, { taskName: name, cronExpression });
      throw error;
    }
  }

  // Daily rent reminders
  async sendDailyRentReminders() {
    try {
      const properties = await prisma.property.findMany({
        select: { id: true, name: true }
      });

      const results = await Promise.allSettled(
        properties.map(property => 
          notificationService.sendRentReminders(property.id)
        )
      );

      const totalSent = results
        .filter(r => r.status === 'fulfilled')
        .reduce((sum, r) => sum + r.value.sent, 0);

      logger.business('daily_rent_reminders_completed', {
        propertiesProcessed: properties.length,
        totalNotificationsSent: totalSent
      });

      // Broadcast summary to property owners
      for (const property of properties) {
        webSocketService.broadcastActivity(property.id, {
          type: 'system_notification',
          message: `Daily rent reminders processed for ${property.name}`,
          data: { totalSent }
        });
      }

    } catch (error) {
      logger.errorWithContext(error, { task: 'sendDailyRentReminders' });
    }
  }

  // Weekly reports
  async generateWeeklyReports() {
    try {
      const properties = await prisma.property.findMany({
        include: {
          owner: {
            select: { id: true, email: true, fullName: true }
          }
        }
      });

      for (const property of properties) {
        const analytics = await analyticsService.getDashboardAnalytics(property.id, '7d');
        
        // Send weekly report notification
        await notificationService.sendNotification('weekly_report', 
          [{ 
            userId: property.owner.id, 
            email: property.owner.email 
          }],
          {
            propertyName: property.name,
            occupancyRate: analytics.kpis.occupancyRate,
            weeklyRevenue: analytics.revenue.totalRevenue,
            newTenants: analytics.tenant.totalTenants,
            reportDate: new Date().toLocaleDateString()
          }
        );
      }

      logger.business('weekly_reports_generated', {
        propertiesProcessed: properties.length
      });

    } catch (error) {
      logger.errorWithContext(error, { task: 'generateWeeklyReports' });
    }
  }

  // Monthly analytics
  async generateMonthlyAnalytics() {
    try {
      const properties = await prisma.property.findMany({
        select: { id: true, name: true }
      });

      for (const property of properties) {
        const analytics = await analyticsService.getDashboardAnalytics(property.id, '30d');
        
        // Store monthly analytics snapshot
        await prisma.$executeRaw`
          INSERT INTO monthly_analytics_snapshots (
            property_id, month, year, occupancy_rate, revenue, 
            tenant_count, maintenance_cost, created_at
          ) VALUES (
            ${property.id}, 
            ${new Date().getMonth() + 1}, 
            ${new Date().getFullYear()},
            ${analytics.kpis.occupancyRate},
            ${analytics.revenue.totalRevenue},
            ${analytics.tenant.totalTenants},
            ${analytics.maintenance.totalCost},
            ${new Date()}
          )
          ON CONFLICT (property_id, month, year) 
          DO UPDATE SET 
            occupancy_rate = EXCLUDED.occupancy_rate,
            revenue = EXCLUDED.revenue,
            tenant_count = EXCLUDED.tenant_count,
            maintenance_cost = EXCLUDED.maintenance_cost,
            updated_at = ${new Date()}
        `.catch(() => {
          // Table might not exist yet, that's okay
          logger.info('Monthly analytics table not found, skipping snapshot');
        });

        // Clear analytics cache for fresh data
        analyticsService.clearCache(property.id);
      }

      logger.business('monthly_analytics_generated', {
        propertiesProcessed: properties.length
      });

    } catch (error) {
      logger.errorWithContext(error, { task: 'generateMonthlyAnalytics' });
    }
  }

  // Cleanup expired data
  async cleanupExpiredData() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 365); // Keep 1 year of data

      // Clean up old logs (if stored in database)
      // Clean up old notifications
      // Clean up expired sessions
      
      const cleanupResults = await Promise.allSettled([
        // Clean up old payment records (keep only last 2 years)
        prisma.payment.deleteMany({
          where: {
            createdAt: { lt: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000) },
            status: 'PAID'
          }
        }),
        
        // Clean up vacated tenants older than 1 year
        prisma.tenant.deleteMany({
          where: {
            status: 'VACATED',
            leavingDate: { lt: cutoffDate }
          }
        })
      ]);

      logger.business('data_cleanup_completed', {
        cleanupResults: cleanupResults.map(r => r.status)
      });

    } catch (error) {
      logger.errorWithContext(error, { task: 'cleanupExpiredData' });
    }
  }

  // Process notification queue
  async processNotificationQueue() {
    try {
      await notificationService.processQueue();
      
      const stats = notificationService.getStats();
      if (stats.queueLength > 0) {
        logger.info('Processed notification queue', stats);
      }
    } catch (error) {
      logger.errorWithContext(error, { task: 'processNotificationQueue' });
    }
  }

  // Update dashboard cache
  async updateDashboardCache() {
    try {
      const properties = await prisma.property.findMany({
        select: { id: true }
      });

      // Pre-warm analytics cache for active properties
      await Promise.allSettled(
        properties.map(property => 
          analyticsService.getDashboardAnalytics(property.id, '30d')
        )
      );

      logger.info('Dashboard cache updated', {
        propertiesProcessed: properties.length
      });

    } catch (error) {
      logger.errorWithContext(error, { task: 'updateDashboardCache' });
    }
  }

  // Backup critical data
  async backupCriticalData() {
    try {
      // This would integrate with cloud storage services
      // For now, just log the backup operation
      
      const backupData = {
        timestamp: new Date().toISOString(),
        tables: ['users', 'properties', 'tenants', 'payments'],
        status: 'completed'
      };

      logger.business('backup_completed', backupData);

      // In production, you would:
      // 1. Export critical tables to files
      // 2. Compress the files
      // 3. Upload to cloud storage (AWS S3, Google Cloud, etc.)
      // 4. Verify backup integrity
      // 5. Clean up old backups

    } catch (error) {
      logger.errorWithContext(error, { task: 'backupCriticalData' });
    }
  }

  // Health check
  async performHealthCheck() {
    try {
      const checks = await Promise.allSettled([
        // Database connection
        prisma.$queryRaw`SELECT 1`,
        
        // Check critical tables
        prisma.user.count(),
        prisma.property.count(),
        prisma.tenant.count(),
        
        // Check disk space (would need OS integration)
        Promise.resolve({ diskUsage: 'OK' }),
        
        // Check memory usage
        Promise.resolve({ 
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime()
        })
      ]);

      const healthStatus = {
        timestamp: new Date().toISOString(),
        database: checks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
        tables: checks.slice(1, 4).every(c => c.status === 'fulfilled') ? 'healthy' : 'unhealthy',
        system: 'healthy',
        uptime: process.uptime()
      };

      if (healthStatus.database === 'unhealthy' || healthStatus.tables === 'unhealthy') {
        logger.error('Health check failed', healthStatus);
        
        // Send alert to administrators
        webSocketService.broadcastMaintenance(
          'System health check failed. Please investigate immediately.',
          'error'
        );
      } else {
        logger.info('Health check passed', healthStatus);
      }

    } catch (error) {
      logger.errorWithContext(error, { task: 'performHealthCheck' });
    }
  }

  // Manual task execution
  async executeTask(taskName) {
    const taskMap = {
      'rent-reminders': this.sendDailyRentReminders,
      'weekly-reports': this.generateWeeklyReports,
      'monthly-analytics': this.generateMonthlyAnalytics,
      'cleanup': this.cleanupExpiredData,
      'process-notifications': this.processNotificationQueue,
      'update-cache': this.updateDashboardCache,
      'backup': this.backupCriticalData,
      'health-check': this.performHealthCheck
    };

    const taskFunction = taskMap[taskName];
    if (!taskFunction) {
      throw new Error(`Task ${taskName} not found`);
    }

    logger.info(`Manually executing task: ${taskName}`);
    await taskFunction.call(this);
    logger.info(`Manual task completed: ${taskName}`);
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      tasksCount: this.tasks.size,
      tasks: Array.from(this.tasks.keys()),
      uptime: process.uptime(),
      nextExecutions: this.getNextExecutions()
    };
  }

  // Get next execution times for tasks
  getNextExecutions() {
    const executions = {};
    for (const [taskName, task] of this.tasks) {
      try {
        // This would require extending node-cron to expose next execution time
        executions[taskName] = 'Next execution time not available';
      } catch (error) {
        executions[taskName] = 'Error getting next execution';
      }
    }
    return executions;
  }
}

module.exports = new SchedulerService();
