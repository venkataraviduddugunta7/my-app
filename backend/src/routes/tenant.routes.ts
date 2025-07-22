import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.json({ message: 'Get tenants - coming soon' }));
router.get('/:id', (req, res) => res.json({ message: 'Get tenant by ID - coming soon' }));
router.post('/', (req, res) => res.json({ message: 'Create tenant - coming soon' }));
router.put('/:id', (req, res) => res.json({ message: 'Update tenant - coming soon' }));
router.delete('/:id', (req, res) => res.json({ message: 'Delete tenant - coming soon' }));
export default router;
