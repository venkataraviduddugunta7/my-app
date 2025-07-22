const { Router } = require('express');
const {
  getBeds,
  getBed,
  createBed,
  updateBed,
  deleteBed,
  assignTenant,
  unassignTenant
} = require('../controllers/bed.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/beds - Get all beds
router.get('/', getBeds);

// GET /api/beds/:id - Get bed by ID
router.get('/:id', getBed);

// POST /api/beds - Create new bed
router.post('/', authorize('OWNER', 'MANAGER'), createBed);

// PUT /api/beds/:id - Update bed
router.put('/:id', authorize('OWNER', 'MANAGER'), updateBed);

// DELETE /api/beds/:id - Delete bed
router.delete('/:id', authorize('OWNER', 'MANAGER'), deleteBed);

// PUT /api/beds/:id/assign - Assign tenant to bed
router.put('/:id/assign', authorize('OWNER', 'MANAGER'), assignTenant);

// PUT /api/beds/:id/unassign - Remove tenant from bed
router.put('/:id/unassign', authorize('OWNER', 'MANAGER'), unassignTenant);

module.exports = router;
