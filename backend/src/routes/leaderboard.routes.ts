import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/global', async (_req, res) => {
  res.status(501).json({ success: false, message: 'Get global leaderboard endpoint not implemented yet' });
});

router.get('/challenge/:challengeId', async (_req, res) => {
  res.status(501).json({ success: false, message: 'Get challenge leaderboard endpoint not implemented yet' });
});

router.get('/user/:userId/rank', authMiddleware, async (_req, res) => {
  res.status(501).json({ success: false, message: 'Get user rank endpoint not implemented yet' });
});

export default router;
