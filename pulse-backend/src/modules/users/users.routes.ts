import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import * as ctrl from './users.controller';

const router = Router();

const updateMeSchema = z.object({
  name: z.string().min(1).max(200).optional(),
});

router.get('/me',   requireAuth, ctrl.getMe);
router.patch('/me', requireAuth, validate({ body: updateMeSchema }), ctrl.updateMe);

export default router;
