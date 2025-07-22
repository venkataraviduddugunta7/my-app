import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.json({ message: 'Get settings - coming soon' }));
router.put('/terms', (req, res) => res.json({ message: 'Update terms - coming soon' }));
export default router;
