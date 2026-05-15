import { Router } from 'express';
import { requireAuth, optionalAuth } from '../../middleware/auth';
import * as ctrl from './analytics.controller';

const router = Router({ mergeParams: true });

// Live analytics - poll owner or public (if results published)
router.get('/', requireAuth, ctrl.getAnalytics);
router.get('/count', ctrl.getResponseCount);

export default router;
