import { Worker, type Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '../db/client';
import { connection, QUEUE_PUBLISH, type PublishJob } from '../queues';
import { getRedis, RedisKeys, RedisTTL } from '../services/redis';
import { computeFullAnalytics } from '../modules/analytics/analytics.service';
import { invalidatePollCache } from '../services/cache';
import { logger } from '../config/logger';
import type { PublishedResultData } from '../db/schema';
import { broadcastToPoll } from '../sockets/rooms';

export function startPublishWorker(): Worker<PublishJob> {
  const worker = new Worker<PublishJob>(
    QUEUE_PUBLISH,
    async (job: Job<PublishJob>) => {
      const { pollId } = job.data;
      const db = getDb();

      logger.info({ pollId }, 'Publishing poll results');

      const poll = await db.query.polls.findFirst({
        where: eq(schema.polls.id, pollId),
        with: { questions: { with: { options: true } } },
      });

      if (!poll) throw new Error(`Poll ${pollId} not found`);
      if (poll.status === 'draft') {
        logger.warn({ pollId }, 'Skipping publish job for draft poll');
        return;
      }

      const analytics = await computeFullAnalytics(pollId);

      if (poll.questions.length > 0 && analytics.questions.length === 0) {
        logger.error(
          { pollId, questionCount: poll.questions.length },
          'Computed analytics contains empty questions for poll after expiry; skipping publish persistence'
        );
        return;
      }

      const resultData: PublishedResultData = {
        pollTitle: poll.title,
        pollDescription: poll.description ?? undefined,
        totalResponses: analytics.totalResponses,
        publishedAt: new Date().toISOString(),
        questions: analytics.questions,
      };

      await db
        .insert(schema.publishedResults)
        .values({ pollId, resultData })
        .onConflictDoUpdate({
          target: schema.publishedResults.pollId,
          set: { resultData, updatedAt: new Date() },
        });

      await db
        .update(schema.polls)
        .set({ publishedAt: new Date(), publishResults: true, updatedAt: new Date() })
        .where(eq(schema.polls.id, pollId));

      await invalidatePollCache(pollId);

      // Cache published result
      // await getRedis().setEx(
      //   RedisKeys.publishedResult(pollId),
      //   RedisTTL.publishedResult,
      //   JSON.stringify(resultData)
      // );

      const payload = {
        value: resultData,
        expiresAt: Date.now() + RedisTTL.publishedResult * 1000,
      };
      
      await getRedis().setEx(
        RedisKeys.publishedResult(pollId),
        RedisTTL.publishedResult,
        JSON.stringify(payload)
      );
      broadcastToPoll(pollId, 'poll:published', resultData);

      logger.info({ pollId }, 'Poll results published');
    },
    { connection, concurrency: 3 }
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Publish job failed');
  });

  logger.info('Publish worker started');
  return worker;
}
