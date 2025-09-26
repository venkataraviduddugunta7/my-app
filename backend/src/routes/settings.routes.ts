import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticate, requirePropertyOwnership } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User settings
router.get('/user', SettingsController.getUserSettings);
router.put('/user', SettingsController.updateUserSettings);

// Dashboard settings
router.get('/dashboard', SettingsController.getDashboardSettings);
router.put('/dashboard', SettingsController.updateDashboardSettings);

// Property settings
router.get('/properties/:propertyId', requirePropertyOwnership, SettingsController.getPropertySettings);
router.put('/properties/:propertyId', requirePropertyOwnership, SettingsController.updatePropertySettings);

// System settings
router.get('/system', SettingsController.getSystemSettings);

// Data management
router.get('/export', SettingsController.exportUserData);
router.post('/reset', SettingsController.resetUserSettings);

export default router;