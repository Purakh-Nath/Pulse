import { Worker, type Job } from 'bullmq';
import { eq, sql } from 'drizzle-orm';
import { getDb, schema } from '../db/client';
import { getRedis, RedisKeys } from '../services/redis';
import { connection, QUEUE_ANALYTICS, type AnalyticsJob } from '../queues';
import { logger } from '../config/logger';

// Buffer -> accumulate events for a poll before writing to DB
const buffer = new Map<string, AnalyticsJob[]>();
let flushTimer: NodeJS.Timeout | null = null;

const FLUSH_INTERVAL_MS = 2000; // flush every 2 seconds
const MAX_BUFFER_SIZE   = 100;  //  every 100 events

async function flushBuffer(): Promise<void> {
  if (buffer.size === 0) return;

  const snapshot = new Map(buffer);
  buffer.clear();

  for (const [pollId, jobs] of snapshot) {
    try {
      await aggregateAndPersist(pollId, jobs);
    } catch (err) {
      logger.error({ err, pollId }, 'Analytics flush failed for poll');
    }
  }
}

async function aggregateAndPersist(pollId: string, jobs: AnalyticsJob[]): Promise<void> {
  const db = getDb();
  const redis = getRedis();

  // count option votes from this batch
  const optionDeltas = new Map<string, number>(); // optionId -> delta
  let totalDelta = jobs.length;
  let completeDelta = jobs.filter((j) => j.isComplete).length;

  for (const job of jobs) {
    for (const a of job.answers) {
      const key = `${a.questionId}:${a.optionId}`;
      optionDeltas.set(key, (optionDeltas.get(key) ?? 0) + 1);
    }
  }

  // atomic Redis counter increments
  const multi = redis.multi();
  multi.incrBy(RedisKeys.totalResponses(pollId), totalDelta);
  for (const [key, delta] of optionDeltas) {
    const [qId, oId] = key.split(':');
    multi.incrBy(RedisKeys.questionOptionCount(pollId, qId!, oId!), delta);
  }
  await multi.exec();

  // upsert aggregate counts in DB
  await db
    .insert(schema.pollAnalytics)
    .values({
      pollId,
      totalResponses: totalDelta,
      completionRate: Math.round((completeDelta / totalDelta) * 100),
    })
    .onConflictDoUpdate({
      target: schema.pollAnalytics.pollId,
      set: {
        totalResponses: sql`${schema.pollAnalytics.totalResponses} + ${totalDelta}`,
        updatedAt: new Date(),
      },
    });

  logger.debug({ pollId, jobs: jobs.length }, 'Analytics batch persisted');
}

function addToBuffer(job: AnalyticsJob): void {
  const existing = buffer.get(job.pollId) ?? [];
  existing.push(job);
  buffer.set(job.pollId, existing);

  const total = Array.from(buffer.values()).reduce((s, v) => s + v.length, 0);
  if (total >= MAX_BUFFER_SIZE) {
    flushBuffer().catch((err) => logger.error({ err }, 'Force-flush failed'));
  }
}

export function startAnalyticsWorker(): Worker<AnalyticsJob> {
  if (!flushTimer) {
    flushTimer = setInterval(() => {
      flushBuffer().catch((err) => logger.error({ err }, 'Scheduled flush failed'));
    }, FLUSH_INTERVAL_MS);
  }

  const worker = new Worker<AnalyticsJob>(
    QUEUE_ANALYTICS,
    async (job: Job<AnalyticsJob>) => {
      addToBuffer(job.data);
    },
    {
      connection,
      concurrency: 5, // 20 - overkill
      stalledInterval: 120_000,    // check stalled jobs every 2min (was 30s default)
      lockDuration: 60_000,        // keep lock alive longer, fewer renewals
      // limiter: { max: 200, duration: 1000 },
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Analytics job failed');
  });

  logger.info('Analytics worker started');
  return worker;
}

export async function stopAnalyticsWorker(worker: Worker): Promise<void> {
  if (flushTimer) { clearInterval(flushTimer); flushTimer = null; }
  await flushBuffer(); // drain remaining
  await worker.close();
  logger.info('Analytics worker stopped');
}
