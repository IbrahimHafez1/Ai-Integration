import express from 'express';
import { checkSlackConnection, handleSlackEvents } from '../controllers/slackController.js';
import { ensureAuth } from '../middleware/auth.js';
import { handleSlackCallback, redirectToSlack } from '../controllers/authController.js';

const router = express.Router();

router.post('/events', ensureAuth, handleSlackEvents);
router.get('slack/check', ensureAuth, checkSlackConnection);
router.get('/slack', ensureAuth, redirectToSlack);
router.get('/slack/callback', ensureAuth, handleSlackCallback);

export default router;
