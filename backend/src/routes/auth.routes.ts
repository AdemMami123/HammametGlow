import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, async (_req, res) => {
  res.status(501).json({ success: false, message: 'Registration endpoint not implemented yet' });
});

router.post('/login', authLimiter, async (_req, res) => {
  res.status(501).json({ success: false, message: 'Login endpoint not implemented yet' });
});

router.post('/logout', authMiddleware, async (_req, res) => {
  res.status(501).json({ success: false, message: 'Logout endpoint not implemented yet' });
});

router.get('/me', authMiddleware, async (_req, res) => {
  res.status(501).json({ success: false, message: 'Get current user endpoint not implemented yet' });
});

export default router;
