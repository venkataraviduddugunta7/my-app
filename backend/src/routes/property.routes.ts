import { Router } from 'express';
import { PropertyController } from '../controllers/property.controller';
import { authenticate, requirePropertyOwnership } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Property CRUD operations
router.post('/', PropertyController.createProperty);
router.get('/', PropertyController.getProperties);
router.get('/:id', requirePropertyOwnership, PropertyController.getProperty);
router.put('/:id', requirePropertyOwnership, PropertyController.updateProperty);
router.delete('/:id', requirePropertyOwnership, PropertyController.deleteProperty);

// Property dashboard
router.get('/:id/dashboard', requirePropertyOwnership, PropertyController.getPropertyDashboard);

export default router;
