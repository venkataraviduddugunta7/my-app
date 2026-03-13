const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/notification.controller');

const router = Router();

router.use(authenticate);

router.get('/', listNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllNotificationsRead);
router.put('/:id/read', markNotificationRead);

module.exports = router;
