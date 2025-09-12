const webSocketService = require('./websocket.service');
const logger = require('./logger.service');

class NotificationService {
  constructor() {
    this.notificationQueue = [];
    this.templates = new Map();
    this.setupTemplates();
  }

  setupTemplates() {
    // Email/SMS templates
    this.templates.set('rent_reminder', {
      title: 'Rent Payment Reminder',
      message: 'Dear {tenantName}, your rent of ₹{amount} is due on {dueDate}. Please make the payment to avoid late fees.',
      priority: 'medium',
      channels: ['email', 'sms', 'push']
    });

    this.templates.set('payment_received', {
      title: 'Payment Received',
      message: 'Thank you {tenantName}! We have received your payment of ₹{amount} for {month}.',
      priority: 'low',
      channels: ['email', 'push']
    });

    this.templates.set('maintenance_scheduled', {
      title: 'Maintenance Scheduled',
      message: 'Maintenance work is scheduled for {date} in your room. Please be available or contact us.',
      priority: 'high',
      channels: ['email', 'sms', 'push']
    });

    this.templates.set('new_tenant_welcome', {
      title: 'Welcome to {propertyName}',
      message: 'Welcome {tenantName}! Your room {roomNumber} is ready. Here are the important details...',
      priority: 'medium',
      channels: ['email', 'push']
    });

    this.templates.set('payment_overdue', {
      title: 'Payment Overdue - Urgent',
      message: 'Dear {tenantName}, your rent payment of ₹{amount} is now {daysOverdue} days overdue. Please pay immediately.',
      priority: 'urgent',
      channels: ['email', 'sms', 'push']
    });

    this.templates.set('tenant_checkout', {
      title: 'Checkout Confirmation',
      message: 'Thank you {tenantName} for staying with us. Your checkout is confirmed for {checkoutDate}.',
      priority: 'medium',
      channels: ['email', 'push']
    });
  }

  // Send notification using template
  async sendNotification(templateKey, recipients, variables = {}, options = {}) {
    try {
      const template = this.templates.get(templateKey);
      if (!template) {
        throw new Error(`Template ${templateKey} not found`);
      }

      const notification = {
        id: this.generateNotificationId(),
        templateKey,
        title: this.replacePlaceholders(template.title, variables),
        message: this.replacePlaceholders(template.message, variables),
        priority: template.priority,
        channels: options.channels || template.channels,
        recipients: Array.isArray(recipients) ? recipients : [recipients],
        variables,
        timestamp: new Date().toISOString(),
        status: 'pending',
        attempts: 0,
        maxAttempts: options.maxAttempts || 3
      };

      // Add to queue
      this.notificationQueue.push(notification);

      // Process immediately for urgent notifications
      if (template.priority === 'urgent') {
        await this.processNotification(notification);
      }

      logger.info('Notification queued', {
        notificationId: notification.id,
        template: templateKey,
        recipients: recipients.length || 1
      });

      return notification.id;
    } catch (error) {
      logger.errorWithContext(error, { templateKey, recipients });
      throw error;
    }
  }

  // Process individual notification
  async processNotification(notification) {
    try {
      notification.attempts++;
      
      const results = await Promise.allSettled(
        notification.channels.map(channel => 
          this.sendViaChannel(channel, notification)
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (successful > 0) {
        notification.status = failed > 0 ? 'partial' : 'sent';
      } else {
        notification.status = 'failed';
      }

      // Log results
      logger.info('Notification processed', {
        notificationId: notification.id,
        status: notification.status,
        successful,
        failed,
        attempts: notification.attempts
      });

      // Retry failed notifications
      if (notification.status === 'failed' && notification.attempts < notification.maxAttempts) {
        setTimeout(() => this.processNotification(notification), 
          Math.pow(2, notification.attempts) * 1000); // Exponential backoff
      }

    } catch (error) {
      logger.errorWithContext(error, { notificationId: notification.id });
      notification.status = 'error';
    }
  }

  // Send via specific channel
  async sendViaChannel(channel, notification) {
    switch (channel) {
      case 'push':
        return this.sendPushNotification(notification);
      case 'email':
        return this.sendEmailNotification(notification);
      case 'sms':
        return this.sendSMSNotification(notification);
      case 'websocket':
        return this.sendWebSocketNotification(notification);
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  // Send push notification (via WebSocket)
  async sendPushNotification(notification) {
    for (const recipient of notification.recipients) {
      if (recipient.userId) {
        webSocketService.sendNotification(recipient.userId, {
          title: notification.title,
          message: notification.message,
          type: this.getPriorityType(notification.priority),
          data: notification.variables
        });
      } else if (recipient.propertyId) {
        webSocketService.broadcastActivity(recipient.propertyId, {
          type: 'notification',
          message: notification.message,
          priority: notification.priority,
          data: notification.variables
        });
      }
    }
    return { success: true, channel: 'push' };
  }

  // Send WebSocket notification
  async sendWebSocketNotification(notification) {
    return this.sendPushNotification(notification);
  }

  // Send email notification (placeholder - would integrate with email service)
  async sendEmailNotification(notification) {
    // Integration with email service (SendGrid, AWS SES, etc.)
    logger.info('Email notification sent', {
      notificationId: notification.id,
      recipients: notification.recipients.map(r => r.email).filter(Boolean)
    });
    
    return { success: true, channel: 'email' };
  }

  // Send SMS notification (placeholder - would integrate with SMS service)
  async sendSMSNotification(notification) {
    // Integration with SMS service (Twilio, AWS SNS, etc.)
    logger.info('SMS notification sent', {
      notificationId: notification.id,
      recipients: notification.recipients.map(r => r.phone).filter(Boolean)
    });
    
    return { success: true, channel: 'sms' };
  }

  // Replace placeholders in template
  replacePlaceholders(text, variables) {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  // Generate notification ID
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get priority type for UI
  getPriorityType(priority) {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'info';
    }
  }

  // Bulk notification methods
  async sendRentReminders(propertyId) {
    try {
      // Get tenants with overdue payments
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const overduePayments = await prisma.payment.findMany({
        where: {
          propertyId,
          status: 'PENDING',
          dueDate: { lt: new Date() }
        },
        include: {
          tenant: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true
            }
          }
        }
      });

      const notifications = overduePayments.map(payment => {
        const daysOverdue = Math.floor(
          (new Date() - new Date(payment.dueDate)) / (1000 * 60 * 60 * 24)
        );

        return this.sendNotification(
          daysOverdue > 7 ? 'payment_overdue' : 'rent_reminder',
          [{
            userId: payment.tenant.id,
            email: payment.tenant.email,
            phone: payment.tenant.phone
          }],
          {
            tenantName: payment.tenant.fullName,
            amount: payment.amount,
            dueDate: payment.dueDate.toLocaleDateString(),
            daysOverdue,
            month: payment.month
          }
        );
      });

      const results = await Promise.allSettled(notifications);
      
      logger.business('bulk_rent_reminders_sent', {
        propertyId,
        totalSent: results.filter(r => r.status === 'fulfilled').length,
        totalFailed: results.filter(r => r.status === 'rejected').length
      });

      return {
        sent: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length
      };

    } catch (error) {
      logger.errorWithContext(error, { action: 'sendRentReminders', propertyId });
      throw error;
    }
  }

  // Welcome new tenant
  async welcomeNewTenant(tenant, property) {
    return this.sendNotification('new_tenant_welcome', 
      [{
        userId: tenant.id,
        email: tenant.email,
        phone: tenant.phone
      }],
      {
        tenantName: tenant.fullName,
        propertyName: property.name,
        roomNumber: tenant.bed?.room?.roomNumber || 'TBD',
        checkInDate: tenant.joiningDate.toLocaleDateString()
      }
    );
  }

  // Maintenance notification
  async notifyMaintenance(tenants, maintenanceDetails) {
    const recipients = tenants.map(tenant => ({
      userId: tenant.id,
      email: tenant.email,
      phone: tenant.phone
    }));

    return this.sendNotification('maintenance_scheduled', recipients, {
      date: maintenanceDetails.scheduledDate,
      description: maintenanceDetails.description,
      duration: maintenanceDetails.estimatedDuration
    });
  }

  // Process notification queue (run periodically)
  async processQueue() {
    const pendingNotifications = this.notificationQueue.filter(n => n.status === 'pending');
    
    for (const notification of pendingNotifications) {
      await this.processNotification(notification);
    }

    // Clean up old notifications
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    this.notificationQueue = this.notificationQueue.filter(n => 
      new Date(n.timestamp).getTime() > cutoff
    );
  }

  // Get notification statistics
  getStats() {
    const total = this.notificationQueue.length;
    const byStatus = this.notificationQueue.reduce((acc, notif) => {
      acc[notif.status] = (acc[notif.status] || 0) + 1;
      return acc;
    }, {});

    const byPriority = this.notificationQueue.reduce((acc, notif) => {
      acc[notif.priority] = (acc[notif.priority] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      byStatus,
      byPriority,
      queueLength: this.notificationQueue.filter(n => n.status === 'pending').length
    };
  }
}

module.exports = new NotificationService();
