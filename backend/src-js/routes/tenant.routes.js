const { Router } = require('express');
const {
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  assignBed,
  vacateTenant
} = require('../controllers/tenant.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

// GET /api/tenants - Get all tenants
router.get('/', getTenants);

// GET /api/tenants/:id - Get tenant by ID
router.get('/:id', getTenant);

// POST /api/tenants - Create new tenant (requires authentication)
router.post('/', authenticate, authorize('OWNER', 'MANAGER'), createTenant);

// PUT /api/tenants/:id - Update tenant (requires authentication)
router.put('/:id', authenticate, authorize('OWNER', 'MANAGER'), updateTenant);

// PUT /api/tenants/:id/assign-bed - Assign bed to tenant
router.put('/:id/assign-bed', authenticate, authorize('OWNER', 'MANAGER'), assignBed);

// PUT /api/tenants/:id/vacate - Vacate tenant (requires authentication)
router.put('/:id/vacate', authenticate, authorize('OWNER', 'MANAGER'), vacateTenant);

// DELETE /api/tenants/:id - Delete tenant (requires authentication)
router.delete('/:id', authenticate, authorize('OWNER', 'MANAGER'), deleteTenant);

module.exports = router;
