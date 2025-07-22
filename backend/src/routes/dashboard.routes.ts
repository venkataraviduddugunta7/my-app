import { Router } from 'express';
const router = Router();
router.get('/stats', (req, res) => res.json({ message: 'Get dashboard stats - coming soon' }));
router.get('/activities', (req, res) => res.json({ message: 'Get recent activities - coming soon' }));
export default router;
