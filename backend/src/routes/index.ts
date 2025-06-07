import { Router } from 'express';
import userRoutes from './userRoutes.js';
import triggerRoutes from './triggerRoutes.js';
import logRoutes from './logRoutes.js';
import slackRoutes from './slackRoutes.js';

const router = Router();

router.use('/user', userRoutes);
router.use('/trigger', triggerRoutes);
router.use('/slack', slackRoutes);
router.use('/logs', logRoutes);

export default router;
