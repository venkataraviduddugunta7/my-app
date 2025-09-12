const express = require('express');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const analyticsService = require('../services/analytics.service');
const logger = require('../services/logger.service');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/analytics/dashboard/:propertyId - Get comprehensive dashboard analytics
router.get('/dashboard/:propertyId', asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { period = '30d' } = req.query;

  const analytics = await analyticsService.getDashboardAnalytics(propertyId, period);

  logger.api(req.method, req.originalUrl, 200, Date.now() - req.startTime, req.user.id);

  res.status(200).json({
    success: true,
    data: analytics
  });
}));

// GET /api/analytics/occupancy/:propertyId - Get occupancy analytics
router.get('/occupancy/:propertyId', asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: { message: 'startDate and endDate are required' }
    });
  }

  const analytics = await analyticsService.getOccupancyAnalytics(
    propertyId, 
    new Date(startDate), 
    new Date(endDate)
  );

  res.status(200).json({
    success: true,
    data: analytics
  });
}));

// GET /api/analytics/revenue/:propertyId - Get revenue analytics
router.get('/revenue/:propertyId', asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: { message: 'startDate and endDate are required' }
    });
  }

  const analytics = await analyticsService.getRevenueAnalytics(
    propertyId, 
    new Date(startDate), 
    new Date(endDate)
  );

  res.status(200).json({
    success: true,
    data: analytics
  });
}));

// GET /api/analytics/tenants/:propertyId - Get tenant analytics
router.get('/tenants/:propertyId', asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: { message: 'startDate and endDate are required' }
    });
  }

  const analytics = await analyticsService.getTenantAnalytics(
    propertyId, 
    new Date(startDate), 
    new Date(endDate)
  );

  res.status(200).json({
    success: true,
    data: analytics
  });
}));

// GET /api/analytics/export/:propertyId - Export analytics data
router.get('/export/:propertyId', asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { startDate, endDate, format = 'json' } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: { message: 'startDate and endDate are required' }
    });
  }

  const data = await analyticsService.exportAnalytics(
    propertyId,
    new Date(startDate),
    new Date(endDate),
    format
  );

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${propertyId}-${startDate}-${endDate}.csv`);
    res.send(data);
  } else {
    res.status(200).json({
      success: true,
      data
    });
  }

  logger.business('analytics_exported', {
    propertyId,
    format,
    startDate,
    endDate,
    exportedBy: req.user.id
  });
}));

// DELETE /api/analytics/cache/:propertyId - Clear analytics cache
router.delete('/cache/:propertyId', asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  analyticsService.clearCache(propertyId);

  logger.business('analytics_cache_cleared', {
    propertyId,
    clearedBy: req.user.id
  });

  res.status(200).json({
    success: true,
    message: 'Analytics cache cleared successfully'
  });
}));

// GET /api/analytics/insights/:propertyId - Get business insights
router.get('/insights/:propertyId', asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { period = '30d' } = req.query;

  const analytics = await analyticsService.getDashboardAnalytics(propertyId, period);

  res.status(200).json({
    success: true,
    data: {
      insights: analytics.insights,
      kpis: analytics.kpis,
      period: analytics.period
    }
  });
}));

module.exports = router;
