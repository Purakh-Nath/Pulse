import type { Request, Response, NextFunction } from 'express';
import { getLiveAnalytics, getActiveUserCount, getFastResponseCount } from './analytics.service';
import { applyAnalyticsLimit } from '../../services/rateLimiter';
import { ok } from '../../utils/response';

import { getPollBySlug, getPollById } from '../polls/polls.service';
import { NotFoundError, ForbiddenError } from '../../shared/errors';
import type { AuthenticatedRequest } from '../../shared/types';

const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await applyAnalyticsLimit(req);
    let pollId = req.params['pollId']!;
    
    if (!isUuid(pollId)) {
      const poll = await getPollBySlug(pollId);
      if (!poll) throw new NotFoundError('Poll');
      pollId = poll.id;
    }

    // Check ownership — only the poll owner can view analytics from the dashboard
    const authedReq = req as AuthenticatedRequest;
    const poll = await getPollById(pollId);
    if (!poll) throw new NotFoundError('Poll');
    if (poll.ownerId !== authedReq.user?.id) {
      throw new ForbiddenError('You do not have permission to view this poll\'s analytics');
    }

    const [snapshot, activeUsers] = await Promise.all([
      getLiveAnalytics(pollId),
      getActiveUserCount(pollId),
    ]);
    ok(res, { ...snapshot, activeUsers });
  } catch (err) { next(err); }
}

export async function getResponseCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let pollId = req.params['pollId']!;
    
    if (!isUuid(pollId)) {
      const poll = await getPollBySlug(pollId);
      if (!poll) throw new NotFoundError('Poll');
      pollId = poll.id;
    }

    // Check ownership
    const authedReq = req as AuthenticatedRequest;
    const poll = await getPollById(pollId);
    if (!poll) throw new NotFoundError('Poll');
    if (poll.ownerId !== authedReq.user?.id) {
      throw new ForbiddenError('You do not have permission to view this poll\'s analytics');
    }

    const count = await getFastResponseCount(pollId);
    ok(res, { count });
  } catch (err) { next(err); }
}
