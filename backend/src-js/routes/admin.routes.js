const { Router } = require('express');
const {
  getAllUsers,
  getUserStats,
  updateUserStatus,
  deleteUser,
  getPendingApprovals
} = require('../controllers/admin.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole(['ADMIN']));

// User Management
router.get('/users', getAllUsers);
router.get('/users/stats', getUserStats);
router.get('/users/pending', getPendingApprovals);
router.put('/users/status', updateUserStatus);
router.delete('/users', deleteUser);

module.exports = router;
