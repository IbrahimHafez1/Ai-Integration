import { Router } from 'express';
import { register, login, profile } from '../controllers/userController.js';
import { ensureAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', ensureAuth, profile);

export default router;
