import { Router } from 'express';
import {
  getFloors,
  getFloor,
  createFloor,
  updateFloor,
  deleteFloor,
  getFloorRooms
} from '../controllers/floor.controller';

const router = Router();

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

// GET /api/floors/:id/rooms - Get all rooms for a floor
router.get('/:id/rooms', getFloorRooms);

export default router; 