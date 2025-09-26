import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate, requirePropertyOwnership } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Dashboard routes
router.get('/', DashboardController.getDashboardData);
router.get('/analytics', DashboardController.getAnalytics);
router.get('/properties/:propertyId', requirePropertyOwnership, DashboardController.getPropertyDashboard);

export default router;