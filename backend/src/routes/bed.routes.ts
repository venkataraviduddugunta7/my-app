import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.json({ message: 'Get beds - coming soon' }));
router.get('/:id', (req, res) => res.json({ message: 'Get bed by ID - coming soon' }));
router.post('/', (req, res) => res.json({ message: 'Create bed - coming soon' }));
router.put('/:id', (req, res) => res.json({ message: 'Update bed - coming soon' }));
router.delete('/:id', (req, res) => res.json({ message: 'Delete bed - coming soon' }));
export default router;
