import { Router } from 'express';
import { optionalAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as ctrl from './responses.controller';
import { submitResponseSchema, responseParamsSchema } from './responses.schemas';

const router = Router({ mergeParams: true });

router.post(
  '/',
  optionalAuth,
  validate({ params: responseParamsSchema, body: submitResponseSchema }),
  ctrl.submit
);

export default router;
