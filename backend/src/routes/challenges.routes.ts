import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { challengeLimiter, uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.get('/', async (_req, res) => {
  res.status(501).json({ success: false, message: 'Get all challenges endpoint not implemented yet' });
});

router.get('/:id', async (_req, res) => {
  res.status(501).json({ success: false, message: 'Get challenge by ID endpoint not implemented yet' });
});

// Protected routes
router.post('/', authMiddleware, requireRole('admin', 'business'), challengeLimiter, uploadLimiter, async (_req, res) => {
  res.status(501).json({ success: false, message: 'Create challenge endpoint not implemented yet' });
});

router.put('/:id', authMiddleware, requireRole('admin', 'business'), challengeLimiter, async (_req, res) => {
  res.status(501).json({ success: false, message: 'Update challenge endpoint not implemented yet' });
});

router.delete('/:id', authMiddleware, requireRole('admin', 'business'), async (_req, res) => {
  res.status(501).json({ success: false, message: 'Delete challenge endpoint not implemented yet' });
});

router.post('/:id/participate', authMiddleware, async (_req, res) => {
  res.status(501).json({ success: false, message: 'Participate in challenge endpoint not implemented yet' });
});

export default router;
