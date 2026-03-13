const { PrismaClient } = require('@prisma/client');
const webSocketService = require('./websocket.service');
const logger = require('./logger.service');

const prisma = new PrismaClient();

const toSocketType = (type = 'INFO') => {
  switch (String(type).toUpperCase()) {
    case 'SUCCESS':
      return 'success';
    case 'WARNING':
      return 'warning';
    case 'ERROR':
      return 'error';
    default:
      return 'info';
  }
};

class AppNotificationService {
  async createNotification(payload) {
    const notification = await prisma.notification.create({
      data: {
        title: payload.title,
        message: payload.message,
        type: payload.type || 'INFO',
        category: payload.category || 'SYSTEM',
        isRead: false,
        actionUrl: payload.actionUrl || null,
        entityType: payload.entityType || null,
        entityId: payload.entityId || null,
        metadata: payload.metadata || null,
        userId: payload.userId,
        propertyId: payload.propertyId || null,
      },
    });

    webSocketService.sendNotification(payload.userId, {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: toSocketType(notification.type),
      category: notification.category,
      isRead: notification.isRead,
      actionUrl: notification.actionUrl,
      entityType: notification.entityType,
      entityId: notification.entityId,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
    });

    logger.info('App notification created', {
      notificationId: notification.id,
      userId: payload.userId,
      propertyId: payload.propertyId || null,
      category: notification.category,
    });

    return notification;
  }

  async notifyPropertyOwner(propertyId, payload) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        ownerId: true,
      },
    });

    if (!property) {
      return null;
    }

    return this.createNotification({
      ...payload,
      userId: property.ownerId,
      propertyId: property.id,
      metadata: {
        propertyName: property.name,
        ...(payload.metadata || {}),
      },
    });
  }

  async markRead(userId, notificationId) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllRead(userId, propertyId = null) {
    const where = {
      userId,
      isRead: false,
    };

    if (propertyId) {
      where.OR = [{ propertyId }, { propertyId: null }];
    }

    return prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }
}

module.exports = new AppNotificationService();
