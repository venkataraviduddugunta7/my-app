const { Router } = require('express');
const {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyStats
} = require('../controllers/property.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/properties - Get all properties for user
router.get('/', getProperties);

// POST /api/properties - Create new property
router.post('/', createProperty);

// GET /api/properties/:id - Get property by ID
router.get('/:id', getProperty);

// PUT /api/properties/:id - Update property
router.put('/:id', authorize('OWNER', 'MANAGER'), updateProperty);

// DELETE /api/properties/:id - Delete property
router.delete('/:id', authorize('OWNER'), deleteProperty);

// GET /api/properties/:id/stats - Get property statistics
router.get('/:id/stats', getPropertyStats);

module.exports = router; 