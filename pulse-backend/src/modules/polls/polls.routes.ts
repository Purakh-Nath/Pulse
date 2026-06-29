import { Router } from 'express';
import { requireAuth, optionalAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as ctrl from './polls.controller';
import {
  createPollSchema,
  updatePollSchema,
  pollParamsSchema,
  pollSlugParamsSchema,
  listPollsQuerySchema,
  aiGeneratePollSchema,
} from './polls.schemas';

const router = Router();

// Public
router.get('/slug/:slug', optionalAuth, validate({ params: pollSlugParamsSchema }), ctrl.getPollBySlug);
router.get('/:pollId',    optionalAuth, validate({ params: pollParamsSchema }), ctrl.getPoll);

router.post('/',                    requireAuth, validate({ body: createPollSchema }), ctrl.createPoll);
router.post('/ai-generate',         requireAuth, validate({ body: aiGeneratePollSchema }), ctrl.generatePollFromAI);
router.get('/',                     requireAuth, validate({ query: listPollsQuerySchema }), ctrl.getMyPolls);
router.patch('/:pollId',            requireAuth, validate({ params: pollParamsSchema, body: updatePollSchema }), ctrl.updatePoll);
router.post('/:pollId/activate',    requireAuth, validate({ params: pollParamsSchema }), ctrl.activatePoll);
router.patch('/:pollId/publish',    requireAuth, validate({ params: pollParamsSchema }), ctrl.activatePoll);
router.delete('/:pollId',           requireAuth, validate({ params: pollParamsSchema }), ctrl.deletePoll);

export default router;
