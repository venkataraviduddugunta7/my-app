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
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/payments - Get all payments
router.get('/', getPayments);

// GET /api/payments/stats - Get payment statistics
router.get('/stats', getPaymentStats);

// POST /api/payments - Create new payment
router.post('/', createPayment);

// PUT /api/payments/:id - Update payment
router.put('/:id', updatePayment);

// DELETE /api/payments/:id - Delete payment
router.delete('/:id', deletePayment);

// PUT /api/payments/:id/mark-paid - Mark payment as paid
router.put('/:id/mark-paid', markPaymentPaid);

// GET /api/payments/:id - Get payment by ID
router.get('/:id', getPayment);

module.exports = router;
