import { Worker, type Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '../db/client';
import { connection, QUEUE_EXPIRY, type ExpiryJob, getPublishQueue } from '../queues';
import { invalidatePollCache } from '../services/cache';
import { getRedis, RedisKeys } from '../services/redis';
import { logger } from '../config/logger';
import { getPollSocketRoom } from '../sockets/rooms';

export function startExpiryWorker(): Worker<ExpiryJob> {
  const worker = new Worker<ExpiryJob>(
    QUEUE_EXPIRY,
    async (job: Job<ExpiryJob>) => {
      const { pollId } = job.data;
      const db = getDb();

      logger.info({ pollId }, 'Processing poll expiry');

      // Update status in DB
      const [updated] = await db
        .update(schema.polls)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(schema.polls.id, pollId))
        .returning();

      if (!updated) {
        logger.warn({ pollId }, 'Poll not found during expiry');
        return;
      }

      // invalidate caches
      await invalidatePollCache(pollId);

      // notify socket room
      try {
        const room = getPollSocketRoom(pollId);
        if (room) {
          room.emit('poll:expired', { pollId });
        }
      } catch { /* socket not critical */ }

      // auto-publish final results after a short delay to allow expiry state and cache invalidation to settle
      await getPublishQueue().add(`publish-${pollId}`, { pollId }, { delay: 1000 });

      // clean up active user counter
      await getRedis().del(RedisKeys.activeUsers(pollId));

      logger.info({ pollId }, 'Poll expired successfully');
    },
    { connection, concurrency: 5 }
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id, pollId: job?.data?.pollId }, 'Expiry job failed');
  });

  logger.info('Expiry worker started');
  return worker;
}
