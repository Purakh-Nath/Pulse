import { eq } from 'drizzle-orm';
import { getDb, schema } from '../../db/client';
import { getRedis, RedisKeys, RedisTTL } from '../../services/redis';
import { cachedFetch } from '../../services/cache';
import { getPublishQueue } from '../../queues';
import { computeFullAnalytics } from '../analytics/analytics.service';
import { NotFoundError, ForbiddenError, AppError, ErrorCode } from '../../shared/errors';
import type { PublishedResultData } from '../../db/schema';

// Get published results (public, cached) 

export async function getPublishedResults(pollId: string): Promise<PublishedResultData> {
  return cachedFetch(
    RedisKeys.publishedResult(pollId),
    RedisTTL.publishedResult,
    async () => {
      const db = getDb();
      const result = await db.query.publishedResults.findFirst({
        where: eq(schema.publishedResults.pollId, pollId),
      });
      if (result) return result.resultData;

      const poll = await db.query.polls.findFirst({
        where: eq(schema.polls.id, pollId),
        columns: {
          title: true,
          description: true,
          status: true,
          publishResults: true,
          publishedAt: true,
          expiresAt: true,
        },
      });

      if (!poll) throw new NotFoundError('Poll');
      const isExpired =
        poll.status === 'expired' ||
        poll.status === 'closed' ||
        (poll.expiresAt != null && new Date(poll.expiresAt) < new Date());
      if (!poll.publishResults && !isExpired) {
        throw new NotFoundError('Published results');
      }

      const analytics = await computeFullAnalytics(pollId);
      return {
        pollTitle: poll.title,
        pollDescription: poll.description ?? undefined,
        totalResponses: analytics.totalResponses,
        publishedAt: poll.publishedAt?.toISOString() ?? new Date().toISOString(),
        questions: analytics.questions,
      };
    },
    0
  );
}

// Trigger publish (owner action) 
export async function publishResults(pollId: string, ownerId: string): Promise<void> {
  const poll = await getDb().query.polls.findFirst({
    where: eq(schema.polls.id, pollId),
  });

  if (!poll) throw new NotFoundError('Poll');
  if (poll.ownerId !== ownerId) throw new ForbiddenError();
  if (poll.status === 'draft') {
    throw new AppError('Cannot publish results for a draft poll', 400, ErrorCode.POLL_INACTIVE);
  }

  await getPublishQueue().add(`publish-${pollId}`, { pollId });
}
