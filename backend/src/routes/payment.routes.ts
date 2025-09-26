import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate, requirePropertyOwnership } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

// All routes require authentication and property ownership
router.use(authenticate);
router.use('/', requirePropertyOwnership);

// Payment operations
router.post('/', PaymentController.createPayment);
router.get('/', PaymentController.getPayments);
router.post('/:paymentId/record', PaymentController.recordPayment);
router.delete('/:paymentId', PaymentController.deletePayment);

// Bulk operations
router.post('/bulk', PaymentController.generateBulkPayments);

// Analytics and utilities
router.get('/analytics', PaymentController.getPaymentAnalytics);
router.post('/update-overdue', PaymentController.updateOverduePayments);

export default router;