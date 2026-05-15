import { Queue, type ConnectionOptions } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../config/logger';

// Parse Redis URL for BullMQ connection
function redisConnection(): ConnectionOptions {
  const url = new URL(env.REDIS_URL);
  const isTLS = env.REDIS_URL.startsWith('rediss://');
  return {
    host: url.hostname,
    port: parseInt(url.port || '6379'),
    password: url.password || undefined,
    db: url.pathname ? parseInt(url.pathname.slice(1)) || 0 : 0,
    tls: isTLS ? {} : undefined, 
  };
}

export const connection = redisConnection();

// Queue Names 

export const QUEUE_ANALYTICS  = 'analytics-aggregation';
export const QUEUE_EXPIRY     = 'poll-expiry';
export const QUEUE_PUBLISH    = 'result-publish';
export const QUEUE_CLEANUP    = 'cleanup';

// Job Types

export interface AnalyticsJob {
  pollId: string;
  responseId: string;
  answers: { questionId: string; optionId: string }[];
  isComplete: boolean;
  timestamp: number;
}

export interface ExpiryJob {
  pollId: string;
  scheduledExpiry: string;
}

export interface PublishJob {
  pollId: string;
}

export interface CleanupJob {
  type: 'socket-presence' | 'expired-tokens' | 'stale-anon';
}

// Queue instances

let _analyticsQueue: Queue<AnalyticsJob>;
let _expiryQueue: Queue<ExpiryJob>;
let _publishQueue: Queue<PublishJob>;
let _cleanupQueue: Queue<CleanupJob>;

export function getAnalyticsQueue(): Queue<AnalyticsJob> {
  if (!_analyticsQueue) {
    _analyticsQueue = new Queue<AnalyticsJob>(QUEUE_ANALYTICS, {
      connection,
      defaultJobOptions: {
        removeOnComplete: 500,
        removeOnFail: 100,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    });
  }
  return _analyticsQueue;
}

export function getExpiryQueue(): Queue<ExpiryJob> {
  if (!_expiryQueue) {
    _expiryQueue = new Queue<ExpiryJob>(QUEUE_EXPIRY, {
      connection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
      },
    });
  }
  return _expiryQueue;
}

export function getPublishQueue(): Queue<PublishJob> {
  if (!_publishQueue) {
    _publishQueue = new Queue<PublishJob>(QUEUE_PUBLISH, {
      connection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: 'fixed', delay: 2000 },
      },
    });
  }
  return _publishQueue;
}

export function getCleanupQueue(): Queue<CleanupJob> {
  if (!_cleanupQueue) {
    _cleanupQueue = new Queue<CleanupJob>(QUEUE_CLEANUP, {
      connection,
      defaultJobOptions: { removeOnComplete: 50, removeOnFail: 20 },
    });
  }
  return _cleanupQueue;
}

export async function scheduleExpiryJob(pollId: string, expiresAt: Date): Promise<void> {
  const delay = Math.max(0, expiresAt.getTime() - Date.now());
  await getExpiryQueue().add(
    `expire-${pollId}`,
    { pollId, scheduledExpiry: expiresAt.toISOString() },
    { delay, jobId: `expire-${pollId}`, removeOnComplete: true }
  );
  logger.info({ pollId, delay }, 'Scheduled poll expiry job');
}

export async function enqueueAnalytics(job: AnalyticsJob): Promise<void> {
  await getAnalyticsQueue().add(`analytics-${job.pollId}-${Date.now()}`, job);
}

export async function closeQueues(): Promise<void> {
  await Promise.allSettled([
    _analyticsQueue?.close(),
    _expiryQueue?.close(),
    _publishQueue?.close(),
    _cleanupQueue?.close(),
  ]);
}
