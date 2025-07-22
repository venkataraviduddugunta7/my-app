import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => res.json({ message: 'Get rooms - coming soon' }));
router.get('/:id', (req, res) => res.json({ message: 'Get room by ID - coming soon' }));
router.post('/', (req, res) => res.json({ message: 'Create room - coming soon' }));
router.put('/:id', (req, res) => res.json({ message: 'Update room - coming soon' }));
router.delete('/:id', (req, res) => res.json({ message: 'Delete room - coming soon' }));

export default router;
