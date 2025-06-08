import express from 'express';
import {
  checkOAuthStatus,
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
router.get('/slack/callback', handleSlackCallback);

router.get('/google/', googleAuth);
router.get('/google/callback', googleCallback);

router.get('/zoho', ensureAuth, zohoAuth);
router.get('/zoho/callback', zohoCallback);
router.get('/check-tokens', ensureAuth, checkOAuthStatus);

export default router;
