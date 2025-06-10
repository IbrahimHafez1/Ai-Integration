import express from 'express';
import { handleSlackEvents } from '../controllers/slackController.js';
import { saveSlackToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/events', handleSlackEvents);
router.get('/save-token', saveSlackToken);

export default router;
