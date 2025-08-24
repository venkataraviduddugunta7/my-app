const { Router } = require('express');
const {
  getDashboardStats,
  getRecentActivities,
  getOccupancyTrends,
  getRevenueTrends,
  getUserDashboardSettings,
  updateUserDashboardSettings
} = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', getDashboardStats);

// GET /api/dashboard/activities - Get recent activities
router.get('/activities', getRecentActivities);

// GET /api/dashboard/occupancy-trends - Get occupancy trends
router.get('/occupancy-trends', getOccupancyTrends);

// GET /api/dashboard/revenue-trends - Get revenue trends
router.get('/revenue-trends', getRevenueTrends);

// GET /api/dashboard/user-settings - Get user settings
router.get('/user-settings', getUserDashboardSettings);

// PUT /api/dashboard/user-settings - Update user settings
router.put('/user-settings', updateUserDashboardSettings);

module.exports = router;
