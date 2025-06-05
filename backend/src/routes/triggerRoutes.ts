import express from 'express';
import {
  createTriggerConfig,
  getTriggerConfigs,
  updateTriggerConfig,
  deleteTriggerConfig,
} from '../controllers/triggerController.js';
import { ensureAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', ensureAuth, getTriggerConfigs);
router.post('/', ensureAuth, createTriggerConfig);
router.patch('/:configId', ensureAuth, updateTriggerConfig);
router.delete('/:configId', ensureAuth, deleteTriggerConfig);

export default router;
