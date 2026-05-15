import { eq, and, count, desc, asc, inArray } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { getDb, schema } from '../../db/client';
import { getRedis, RedisKeys, RedisTTL } from '../../services/redis';
import { cachedFetch, invalidatePollCache } from '../../services/cache';
import { scheduleExpiryJob, getPublishQueue } from '../../queues';
import { NotFoundError, ForbiddenError, AppError, ErrorCode, PollExpiredError } from '../../shared/errors';
import { buildPagination, buildPaginatedResult } from '../../utils/pagination';
import type { z } from 'zod';
import type {
  createPollSchema,
  updatePollSchema,
  listPollsQuerySchema,
} from './polls.schemas';

// Slug builder (no external dep)

function makeSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .slice(0, 60);
  return `${base}-${randomBytes(4).toString('hex')}`;
}

export async function createPoll(
  ownerId: string,
  input: z.infer<typeof createPollSchema>
) {
  const db = getDb();
  const slug = makeSlug(input.title);

  const isActive = input.status === 'active' || input.status === 'published';

  const [poll] = await db.insert(schema.polls).values({
    slug,
    ownerId,
    title: input.title,
    description: input.description,
    responsesMode: input.responsesMode,
    publishResults: false,
    expiresAt: input.expiresAt,
    status: isActive ? 'active' : 'draft',
    publishedAt: null,
  }).returning();

  for (const q of input.questions) {
    const [question] = await db.insert(schema.questions).values({
      pollId: poll!.id,
      text: q.text,
      isRequired: q.isRequired,
      displayOrder: q.displayOrder,
    }).returning();

    await db.insert(schema.options).values(
      q.options.map((o) => ({
        questionId: question!.id,
        text: o.text,
        displayOrder: o.displayOrder,
      }))
    );
  }

  if (poll!.expiresAt) {
    await scheduleExpiryJob(poll!.id, poll!.expiresAt);
  }

  return poll!;
}

export async function getPollById(pollId: string, includeOptions = true) {
  return cachedFetch(
    RedisKeys.pollMeta(pollId),
    RedisTTL.pollMeta,
    async () => {
      const poll = await getDb().query.polls.findFirst({
        where: eq(schema.polls.id, pollId),
        with: {
          owner: { columns: { id: true, name: true, avatar: true } },
          questions: {
            orderBy: asc(schema.questions.displayOrder),
            with: includeOptions
              ? { options: { orderBy: asc(schema.options.displayOrder) } }
              : undefined,
          },
        },
      });
      return poll ?? null;
    }
  );
}

export async function getPollBySlug(slug: string) {
  return cachedFetch(
    RedisKeys.pollBySlug(slug),
    RedisTTL.pollMeta,
    async () => {
      const poll = await getDb().query.polls.findFirst({
        where: eq(schema.polls.slug, slug),
        with: {
          owner: { columns: { id: true, name: true } },
          questions: {
            orderBy: asc(schema.questions.displayOrder),
            with: { options: { orderBy: asc(schema.options.displayOrder) } },
          },
        },
      });
      return poll ?? null;
    }
  );
}

export async function listUserPolls(
  ownerId: string,
  params: z.infer<typeof listPollsQuerySchema>
) {
  const db = getDb();
  const { limit, offset } = buildPagination({ page: params.page, limit: params.limit });

  const where = and(
    eq(schema.polls.ownerId, ownerId),
    params.status ? eq(schema.polls.status, params.status) : undefined
  );

  const [items, totals] = await Promise.all([
    db.query.polls.findMany({
      where,
      orderBy: desc(schema.polls.createdAt),
      limit,
      offset,
      with: { questions: { columns: { id: true } } },
    }),
    db.select({ total: count() }).from(schema.polls).where(where),
  ]);

  // Fetch response counts for this page of polls
  const pollIds = items.map((p) => p.id);
  const responseCounts =
    pollIds.length > 0
      ? await db
          .select({ pollId: schema.responses.pollId, total: count() })
          .from(schema.responses)
          .where(inArray(schema.responses.pollId, pollIds))
          .groupBy(schema.responses.pollId)
      : [];

  const responseCountMap = new Map(responseCounts.map((r) => [r.pollId, r.total]));

  const itemsWithCount = items.map((poll) => ({
    ...poll,
    _count: { responses: responseCountMap.get(poll.id) ?? 0 },
  }));

  return buildPaginatedResult(itemsWithCount, totals[0]!.total, { page: params.page, limit: params.limit });
}

export async function updatePoll(
  pollId: string,
  ownerId: string,
  input: z.infer<typeof updatePollSchema>
) {
  const db = getDb();

  const poll = await db.query.polls.findFirst({ where: eq(schema.polls.id, pollId) });
  if (!poll) throw new NotFoundError('Poll');
  if (poll.ownerId !== ownerId) throw new ForbiddenError();

  const [updated] = await db
    .update(schema.polls)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(schema.polls.id, pollId))
    .returning();

  if (input.expiresAt && input.expiresAt !== poll.expiresAt) {
    await scheduleExpiryJob(pollId, input.expiresAt);
  }

  if (input.publishResults && !poll.publishResults) {
    await getPublishQueue().add(`publish-${pollId}`, { pollId });
  }

  await invalidatePollCache(pollId);
  return updated!;
}

export async function activatePoll(pollId: string, ownerId: string) {
  const poll = await getDb().query.polls.findFirst({
    where: and(eq(schema.polls.id, pollId), eq(schema.polls.ownerId, ownerId)),
  });
  if (!poll) throw new NotFoundError('Poll');

  const [updated] = await getDb()
    .update(schema.polls)
    .set({ status: 'active', publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.polls.id, pollId))
    .returning();

  await invalidatePollCache(pollId);
  return updated!;
}

export async function deletePoll(pollId: string, ownerId: string): Promise<void> {
  const poll = await getDb().query.polls.findFirst({ where: eq(schema.polls.id, pollId) });
  if (!poll) throw new NotFoundError('Poll');
  if (poll.ownerId !== ownerId) throw new ForbiddenError();

  await getDb().delete(schema.polls).where(eq(schema.polls.id, pollId));
  await invalidatePollCache(pollId);
}

export async function assertPollAcceptsResponses(pollId: string) {
  const poll = await getPollById(pollId);
  if (!poll) throw new NotFoundError('Poll');
  if (poll.status === 'expired' || (poll.expiresAt && poll.expiresAt < new Date())) {
    throw new PollExpiredError();
  }
  if (poll.status !== 'active') {
    throw new AppError('Poll is not accepting responses', 400, ErrorCode.POLL_INACTIVE);
  }
  return poll;
}
