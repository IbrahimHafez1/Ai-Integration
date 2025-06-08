import express from 'express';
import {
  googleAuth,
  googleCallback,
  handleSlackCallback,
  redirectToSlack,
  zohoAuth,
  zohoCallback,
} from '../controllers/authController.js';
import { ensureAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/slack/', redirectToSlack);
router.get('/slack/callback', ensureAuth, handleSlackCallback);

router.get('/google/', ensureAuth, googleAuth);
router.get('/google/callback', ensureAuth, googleCallback);

router.get('/zoho', ensureAuth, zohoAuth);
router.get('/zoho/callback', ensureAuth, zohoCallback);

export default router;
