import type { Request, Response, NextFunction } from 'express';
import { getPublishedResults, publishResults } from './results.service';
import { ok } from '../../utils/response';
import type { AuthenticatedRequest, MaybeAuthRequest } from '../../shared/types';
import { getPollBySlug, getPollById } from '../polls/polls.service';
import { NotFoundError, UnauthorizedError } from '../../shared/errors';

const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function getResults(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as MaybeAuthRequest;
    let pollId = req.params['pollId']!;
    const poll = !isUuid(pollId)
      ? await getPollBySlug(pollId)
      : await getPollById(pollId);

    if (!poll) throw new NotFoundError('Poll');

    const isExpired = poll.status === 'expired' || poll.status === 'closed' || (poll.expiresAt ? new Date(poll.expiresAt) < new Date() : false);
    const isPublished = poll.publishResults || isExpired;

    if (!isPublished) {
      throw new NotFoundError('Published results');
    }

    if (poll.responsesMode === 'authenticated' && !authReq.user) {
      throw new UnauthorizedError('Authentication required to view results');
    }

    if (!isUuid(pollId)) pollId = poll.id;
 const results = await getPublishedResults(pollId);

ok(res, {
  poll: {
    id: poll.id,
    title: poll.title,
    description: poll.description,
    status: poll.status,
    publishResults: poll.publishResults,
  },
  analytics: {
    totalResponses: results?.totalResponses ?? 0,
    completionRate: (results as any)?.completionRate ?? 0,
    activeUsers: 0,
    questions: results?.questions ?? [],
  },
  // publishedAt:
  //   results?.publishedAt ??
  //   poll.publishedAt?.toISOString() ??
  //   new Date().toISOString(),
  publishedAt:
  results?.publishedAt ??
  (poll.publishedAt
    ? new Date(poll.publishedAt).toISOString()
    : new Date().toISOString()),
});
  } catch (err) { next(err); }
}

export async function publish(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let pollId = req.params['pollId']!;
    
    // convert slug to UUID if needed
    if (!isUuid(pollId)) {
      const poll = await getPollBySlug(pollId);
      if (!poll) throw new NotFoundError('Poll');
      pollId = poll.id;
    }

    await publishResults(pollId, (req as AuthenticatedRequest).user.id);
    ok(res, { message: 'Results queued for publishing' });
  } catch (err) { next(err); }
}
