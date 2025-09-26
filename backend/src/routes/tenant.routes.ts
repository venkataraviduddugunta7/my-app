import { Router } from 'express';
import { TenantController } from '../controllers/tenant.controller';
import { authenticate, requirePropertyOwnership } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

// All routes require authentication and property ownership
router.use(authenticate);
router.use('/', requirePropertyOwnership);

// Tenant CRUD operations
router.post('/', TenantController.createTenant);
router.get('/', TenantController.getTenants);
router.get('/:tenantId', TenantController.getTenant);
router.put('/:tenantId', TenantController.updateTenant);

// Tenant management operations
router.post('/:tenantId/relocate', TenantController.relocateTenant);
router.post('/:tenantId/vacate', TenantController.vacateTenant);

// Tenant payments
router.get('/:tenantId/payments', TenantController.getTenantPayments);

export default router;