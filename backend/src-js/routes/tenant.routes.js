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
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/tenants - Get all tenants
router.get('/', getTenants);

// POST /api/tenants - Create new tenant
router.post('/', createTenant);

// PUT /api/tenants/:id - Update tenant
router.put('/:id', updateTenant);

// PUT /api/tenants/:id/assign-bed - Assign bed to tenant
router.put('/:id/assign-bed', assignBed);

// PUT /api/tenants/:id/vacate - Mark tenant as vacated
router.put('/:id/vacate', vacateTenant);

// DELETE /api/tenants/:id - Delete tenant
router.delete('/:id', deleteTenant);

// GET /api/tenants/:id - Get tenant by ID
router.get('/:id', getTenant);

module.exports = router;
