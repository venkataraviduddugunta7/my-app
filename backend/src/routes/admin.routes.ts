import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole(['ADMIN']));

// User Management
router.get('/users', AdminController.getAllUsers);
router.get('/users/stats', AdminController.getUserStats);
router.get('/users/pending', AdminController.getPendingApprovals);
router.put('/users/status', AdminController.updateUserStatus);
router.put('/users/role', AdminController.updateUserRole);
router.delete('/users', AdminController.deleteUser);

// Admin Activity
router.get('/activity', AdminController.getAdminActivity);

export default router;
