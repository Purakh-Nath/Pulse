import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as ctrl from './auth.controller';

const router = Router();

router.get('/login',       ctrl.login);
router.get('/callback',    ctrl.callback);
router.post('/refresh',    ctrl.refresh);
router.post('/logout',     ctrl.logout);
router.post('/logout-all', requireAuth, ctrl.logoutAll);
router.get('/me',          requireAuth, ctrl.me);

export default router;
