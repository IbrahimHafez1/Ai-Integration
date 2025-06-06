import express from 'express';
import { checkSlackConnection, handleSlackEvents } from '../controllers/slackController.js';
import { ensureAuth } from '../middleware/auth.js';
import {
  handleSlackCallback,
  redirectToSlack,
  saveSlackToken,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/events', handleSlackEvents);
router.get('/', redirectToSlack);
router.get('/check', ensureAuth, checkSlackConnection);
router.get('/callback', handleSlackCallback);
router.get('/save-token', saveSlackToken);

export default router;
