import { Router } from 'express';
import { ensureAuth } from '../middleware/auth.js';
import { getLeadLogs, getCRMLogs } from '../controllers/logController.js';

const router = Router();

router.get('/leads', ensureAuth, getLeadLogs);
router.get('/crm', ensureAuth, getCRMLogs);

export default router;
