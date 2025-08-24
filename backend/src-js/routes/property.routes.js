const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty
} = require('../controllers/property.controller');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Property routes
router.get('/', getProperties);
router.get('/:id', getProperty);
router.post('/', createProperty);
router.put('/:id', updateProperty);
router.delete('/:id', deleteProperty);

module.exports = router; 