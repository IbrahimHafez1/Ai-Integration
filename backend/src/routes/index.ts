import { Router } from 'express';
import userRoutes from './userRoutes.js';
import logRoutes from './logRoutes.js';
import slackRoutes from './slackRoutes.js';
import authRoutes from './authRoutes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

router.use('/user', userRoutes);
router.use('/slack', slackRoutes);
router.use('/auth', authRoutes);
router.use('/logs', logRoutes);

export default router;
