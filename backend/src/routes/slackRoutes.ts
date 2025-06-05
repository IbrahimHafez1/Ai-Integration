import express from 'express';
import { checkSlackConnection, handleSlackEvents } from '../controllers/slackController.js';
import { ensureAuth } from '../middleware/auth.js';
import { handleSlackCallback, redirectToSlack } from '../controllers/authController.js';

const router = express.Router();

router.post('/events', ensureAuth, handleSlackEvents);
router.get('/', ensureAuth, redirectToSlack);
router.get('/check', ensureAuth, checkSlackConnection);
router.get('/callback', ensureAuth, handleSlackCallback);

export default router;
