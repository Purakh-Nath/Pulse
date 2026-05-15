import { Router } from 'express';
import { requireAuth, optionalAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import * as ctrl from './results.controller';

const router = Router({ mergeParams: true });

// Accept either UUID or slug
const pollParamsSchema = z.object({ pollId: z.string().min(1) });

// Public — view published results
router.get('/', optionalAuth, validate({ params: pollParamsSchema }), ctrl.getResults);

// Owner only — trigger publish
router.post(
  '/publish',
  requireAuth,
  validate({ params: pollParamsSchema }),
  ctrl.publish
);

export default router;
