import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';
import { authenticate, requirePropertyOwnership } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

// All routes require authentication and property ownership
router.use(authenticate);
router.use('/', requirePropertyOwnership);

// Floor management
router.post('/floors', RoomController.createFloor);
router.get('/floors', RoomController.getFloors);

// Room management
router.post('/floors/:floorId/rooms', RoomController.createRoom);
router.get('/floors/:floorId/rooms', RoomController.getRooms);

// Bed management
router.post('/floors/:floorId/rooms/:roomId/beds', RoomController.createBed);
router.get('/floors/:floorId/rooms/:roomId/beds', RoomController.getBeds);
router.put('/floors/:floorId/rooms/:roomId/beds/:bedId/status', RoomController.updateBedStatus);

// Utility routes
router.get('/available-beds', RoomController.getAvailableBeds);

export default router;