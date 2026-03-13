const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/error.middleware');
const appNotificationService = require('../services/app-notification.service');

const prisma = new PrismaClient();

const listNotifications = asyncHandler(async (req, res) => {
  const { propertyId, limit = 12, unreadOnly = 'false' } = req.query;
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);

  const where = {
    userId: req.user.id,
  };

  if (String(unreadOnly).toLowerCase() === 'true') {
    where.isRead = false;
  }

  if (propertyId) {
    where.OR = [{ propertyId }, { propertyId: null }];
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    take: pageSize,
  });

  res.status(200).json({
    success: true,
    data: notifications,
  });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const { propertyId } = req.query;
  const where = {
    userId: req.user.id,
    isRead: false,
  };

  if (propertyId) {
    where.OR = [{ propertyId }, { propertyId: null }];
  }

  const count = await prisma.notification.count({ where });

  res.status(200).json({
    success: true,
    data: {
      count,
    },
  });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updated = await appNotificationService.markRead(req.user.id, id);

  if (!updated.count) {
    return res.status(404).json({
      success: false,
      error: { message: 'Notification not found' },
    });
  }

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
  });
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const { propertyId = null } = req.body || {};
  const updated = await appNotificationService.markAllRead(req.user.id, propertyId);

  res.status(200).json({
    success: true,
    data: {
      updated: updated.count,
    },
    message: 'Notifications marked as read',
  });
});

module.exports = {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
};
