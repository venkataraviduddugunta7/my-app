import { Router } from 'express';

const router = Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint - coming soon' });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint - coming soon' });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout endpoint - coming soon' });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  res.json({ message: 'Get user profile - coming soon' });
});

export default router; 