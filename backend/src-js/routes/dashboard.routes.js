const { Router } = require('express');
const {
  getDashboardStats,
  getRecentActivities,
  getOccupancyTrends,
  getRevenueTrends,
  getUserDashboardSettings,
  updateUserDashboardSettings
} = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

// GET /api/dashboard/stats - Get comprehensive dashboard statistics
router.get('/stats', authenticate, getDashboardStats);

// GET /api/dashboard/activities - Get recent activities
router.get('/activities', authenticate, getRecentActivities);

// GET /api/dashboard/occupancy-trends - Get occupancy trends
router.get('/occupancy-trends', authenticate, getOccupancyTrends);

// GET /api/dashboard/revenue-trends - Get revenue trends
router.get('/revenue-trends', authenticate, getRevenueTrends);

// GET /api/dashboard/user-settings - Get user dashboard settings
router.get('/user-settings', authenticate, getUserDashboardSettings);

// PUT /api/dashboard/user-settings - Update user dashboard settings
router.put('/user-settings', authenticate, updateUserDashboardSettings);

module.exports = router;
