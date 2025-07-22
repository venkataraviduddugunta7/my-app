const { Router } = require('express');
const {
  getFloors,
  getFloor,
  createFloor,
  updateFloor,
  deleteFloor,
  getFloorRooms
} = require('../controllers/floor.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/floors - Get all floors
router.get('/', getFloors);

// GET /api/floors/:id - Get floor by ID
router.get('/:id', getFloor);

// POST /api/floors - Create new floor
router.post('/', authorize('OWNER', 'MANAGER'), createFloor);

// PUT /api/floors/:id - Update floor
router.put('/:id', authorize('OWNER', 'MANAGER'), updateFloor);

// DELETE /api/floors/:id - Delete floor
router.delete('/:id', authorize('OWNER', 'MANAGER'), deleteFloor);

// GET /api/floors/:id/rooms - Get all rooms for a floor
router.get('/:id/rooms', getFloorRooms);

module.exports = router; 