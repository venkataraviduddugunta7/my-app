const { Router } = require('express');
const {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  markPaymentPaid,
  getPaymentStats
} = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

// GET /api/payments/stats - Get payment statistics
router.get('/stats', authenticate, getPaymentStats);

// GET /api/payments - Get all payments
router.get('/', getPayments);

// GET /api/payments/:id - Get payment by ID
router.get('/:id', getPayment);

// POST /api/payments - Create new payment (requires authentication)
router.post('/', authenticate, authorize('OWNER', 'MANAGER'), createPayment);

// PUT /api/payments/:id - Update payment (requires authentication)
router.put('/:id', authenticate, authorize('OWNER', 'MANAGER'), updatePayment);

// DELETE /api/payments/:id - Delete payment (requires authentication)
router.delete('/:id', authenticate, authorize('OWNER', 'MANAGER'), deletePayment);

// PUT /api/payments/:id/mark-paid - Mark payment as paid (requires authentication)
router.put('/:id/mark-paid', authenticate, authorize('OWNER', 'MANAGER'), markPaymentPaid);

module.exports = router;
