const { Router } = require('express');
const {
  getPropertySettings,
  updatePropertySettings,
  getPropertyRules,
  updatePropertyRules,
  getUserSettings,
  updateUserSettings
} = require('../controllers/settings.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Property Settings Routes
router.get('/property/:propertyId', getPropertySettings);
router.put('/property/:propertyId', updatePropertySettings);

// Property Rules Routes  
router.get('/property/:propertyId/rules', getPropertyRules);
router.put('/property/:propertyId/rules', updatePropertyRules);

// User Settings Routes
router.get('/user', getUserSettings);
router.put('/user', updateUserSettings);

module.exports = router;
