import { Router } from 'express';
import userRoutes from './userRoutes.js';
import logRoutes from './logRoutes.js';
import slackRoutes from './slackRoutes.js';

const router = Router();

router.use('/user', userRoutes);
router.use('/slack', slackRoutes);
router.use('/logs', logRoutes);

export default router;
