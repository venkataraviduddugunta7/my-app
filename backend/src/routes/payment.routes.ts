import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.json({ message: 'Get payments - coming soon' }));
router.get('/:id', (req, res) => res.json({ message: 'Get payment by ID - coming soon' }));
router.post('/', (req, res) => res.json({ message: 'Create payment - coming soon' }));
router.put('/:id', (req, res) => res.json({ message: 'Update payment - coming soon' }));
router.delete('/:id', (req, res) => res.json({ message: 'Delete payment - coming soon' }));
export default router;
