import { Router } from 'express';
import { register, login, profile } from '../controllers/userController.js';
import { ensureAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { userRegisterSchema, userLoginSchema } from '../schemas/validation.js';

const router = Router();

router.post('/register', validate(userRegisterSchema), register);
router.post('/login', validate(userLoginSchema), login);
router.get('/profile', ensureAuth, profile);

export default router;
