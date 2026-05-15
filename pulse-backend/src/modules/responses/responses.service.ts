import { eq, and } from 'drizzle-orm';
import { createHash } from 'crypto';
import { getDb, schema } from '../../db/client';
import { getRedis, RedisKeys } from '../../services/redis';
import { enqueueAnalytics } from '../../queues';
import { hasAnonResponded, markAnonResponded } from '../../services/anon';
import { scheduleBroadcast } from '../../sockets';
import { getSocketServer } from '../../sockets/rooms';
import {
  DuplicateResponseError,
  PollExpiredError,
  AppError,
  ErrorCode,
  UnauthorizedError,
} from '../../shared/errors';
import type { AuthUser, AnonIdentity } from '../../shared/types';
import type { z } from 'zod';
import type { submitResponseSchema } from './responses.schemas';

function hashIp(ip: string): string {
  return createHash('sha256').update(`ip:${ip}:salt`).digest('hex').slice(0, 16);
}

function getIp(req: { socket?: { remoteAddress?: string }; headers: Record<string, string | string[] | undefined> }): string {
  const fwd = req.headers['x-forwarded-for'];
  return (Array.isArray(fwd) ? fwd[0] : fwd?.split(',')[0]?.trim()) ?? req.socket?.remoteAddress ?? 'unknown';
}

//  Submit response 
export async function submitResponse(params: {
  pollId: string;
  input: z.infer<typeof submitResponseSchema>;
  user?: AuthUser;
  anonIdentity?: AnonIdentity;
  ip: string;
}) {
  const { pollId, input, user, anonIdentity, ip } = params;
  const db = getDb();

  // Load poll with questions
  const poll = await db.query.polls.findFirst({
    where: eq(schema.polls.id, pollId),
    with: { questions: { with: { options: true } } },
  });

  if (!poll) throw new AppError('Poll not found', 404, ErrorCode.NOT_FOUND);

  // Status checks
  if (poll.status === 'expired' || (poll.expiresAt && poll.expiresAt < new Date())) {
    throw new PollExpiredError();
  }
  if (poll.status !== 'active') {
    throw new AppError('Poll is not accepting responses', 400, ErrorCode.POLL_INACTIVE);
  }

  // Auth mode check
  if (poll.responsesMode === 'authenticated' && !user) {
    throw new UnauthorizedError('This poll requires authentication', ErrorCode.AUTH_REQUIRED);
  }

  // Duplicate check - authenticated
  if (user) {
    const existing = await db.query.responses.findFirst({
      where: and(eq(schema.responses.pollId, pollId), eq(schema.responses.respondentId, user.id)),
    });
    if (existing) throw new DuplicateResponseError();
  } else if (anonIdentity) {
    // Duplicate check - anonymous (Redis-backed for speed)
    if (await hasAnonResponded(pollId, anonIdentity.anonId)) throw new DuplicateResponseError();
  }

  // Build question/option lookup maps for validation
  const questionMap = new Map(poll.questions.map((q) => [q.id, q]));

  // Validate answers
  const requiredQids = poll.questions.filter((q) => q.isRequired).map((q) => q.id);
  const answeredQids = input.answers.map((a) => a.questionId);

  for (const reqId of requiredQids) {
    if (!answeredQids.includes(reqId)) {
      throw new AppError(`Required question ${reqId} not answered`, 422, ErrorCode.VALIDATION_ERROR);
    }
  }

  for (const answer of input.answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) throw new AppError(`Question ${answer.questionId} not in poll`, 422, ErrorCode.VALIDATION_ERROR);
    const validOption = question.options.some((o) => o.id === answer.optionId);
    if (!validOption) throw new AppError(`Option ${answer.optionId} not valid`, 422, ErrorCode.VALIDATION_ERROR);
  }

  const isComplete = requiredQids.every((id) => answeredQids.includes(id));

  // Insert response + answers in transaction
  const responseId = await db.transaction(async (tx) => {
    const [response] = await tx
      .insert(schema.responses)
      .values({
        pollId,
        respondentId: user?.id ?? null,
        anonymousId: anonIdentity?.anonId ?? null,
        ipHash: hashIp(ip),
        isComplete,
      })
      .returning();

    await tx.insert(schema.answers).values(
      input.answers.map((a) => ({
        responseId: response!.id,
        questionId: a.questionId,
        optionId: a.optionId,
      }))
    );

    return response!.id;
  });

  // Mark anon as responded (Redis)
  if (anonIdentity) {
    await markAnonResponded(pollId, anonIdentity.anonId);
  }

  // Enqueue async analytics aggregation (non-blocking)
  await enqueueAnalytics({
    pollId,
    responseId,
    answers: input.answers,
    isComplete,
    timestamp: Date.now(),
  });

  // Trigger debounced socket broadcast
  const io = getSocketServer();
  if (io) scheduleBroadcast(io, pollId);

  return { responseId, isComplete };
}
