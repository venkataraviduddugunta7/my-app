const { Router } = require('express');
const {
  getFloors,
  getFloor,
  createFloor,
  updateFloor,
  deleteFloor
} = require('../controllers/floor.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/floors - Get all floors
router.get('/', getFloors);

// GET /api/floors/:id - Get floor by ID
router.get('/:id', getFloor);

// POST /api/floors - Create new floor
router.post('/', createFloor);

// PUT /api/floors/:id - Update floor
router.put('/:id', updateFloor);

// DELETE /api/floors/:id - Delete floor
router.delete('/:id', deleteFloor);

module.exports = router; 