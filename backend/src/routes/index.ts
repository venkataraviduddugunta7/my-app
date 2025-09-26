import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import propertyRoutes from './property.routes';
import roomRoutes from './room.routes';
import tenantRoutes from './tenant.routes';
import paymentRoutes from './payment.routes';
import documentRoutes from './document.routes';
import dashboardRoutes from './dashboard.routes';
import settingsRoutes from './settings.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'MY PG API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/properties', propertyRoutes);
router.use('/properties/:propertyId/rooms', roomRoutes);
router.use('/properties/:propertyId/tenants', tenantRoutes);
router.use('/properties/:propertyId/payments', paymentRoutes);
router.use('/properties/:propertyId/documents', documentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);

export default router;
