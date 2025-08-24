const { Router } = require('express');
const {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomBeds
} = require('../controllers/room.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/rooms - Get all rooms
router.get('/', getRooms);

// GET /api/rooms/:id - Get room by ID
router.get('/:id', getRoom);

// POST /api/rooms - Create new room
router.post('/', createRoom);

// PUT /api/rooms/:id - Update room
router.put('/:id', updateRoom);

// DELETE /api/rooms/:id - Delete room
router.delete('/:id', deleteRoom);

// GET /api/rooms/:id/beds - Get all beds for a room
router.get('/:id/beds', getRoomBeds);

module.exports = router;
