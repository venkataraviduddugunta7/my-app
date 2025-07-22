const { Router } = require('express');
const {
  getPropertySettings,
  updatePropertySettings,
  getTermsAndConditions,
  getUserSettings,
  updateUserSettings,
  getPropertyRules,
  updatePropertyRules,
  getDashboardSettings,
  updateDashboardSettings
} = require('../controllers/settings.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

// Property Settings Routes
router.get('/property/:propertyId', authenticate, getPropertySettings);
router.put('/property/:propertyId', authenticate, authorize('OWNER', 'MANAGER'), updatePropertySettings);

// Public Terms and Conditions (no auth required)
router.get('/terms/:propertyId', getTermsAndConditions);

// Property Rules Routes
router.get('/property/:propertyId/rules', getPropertyRules);
router.put('/property/:propertyId/rules', authenticate, authorize('OWNER', 'MANAGER'), updatePropertyRules);

// User Settings Routes
router.get('/user', authenticate, getUserSettings);
router.put('/user', authenticate, updateUserSettings);

// Dashboard Settings Routes
router.get('/dashboard', authenticate, getDashboardSettings);
router.put('/dashboard', authenticate, updateDashboardSettings);

module.exports = router;
