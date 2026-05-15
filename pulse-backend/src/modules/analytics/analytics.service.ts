import { eq, count, and, asc, inArray } from 'drizzle-orm';
import { getDb, schema } from '../../db/client';
import { getRedis, RedisKeys, RedisTTL } from '../../services/redis';
import { cachedFetch, deduplicateInflight } from '../../services/cache';
import type { AnalyticsSnapshot } from '../../db/schema';
import { NotFoundError } from '../../shared/errors';

// Full analytics compute (expensive — always cached)

export async function computeFullAnalytics(pollId: string): Promise<AnalyticsSnapshot> {
  return deduplicateInflight(`analytics:compute:${pollId}`, async () => {
    const db = getDb();

    const questions = await db.query.questions.findMany({
      where: eq(schema.questions.pollId, pollId),
      orderBy: asc(schema.questions.displayOrder),
      with: {
        options: { orderBy: asc(schema.options.displayOrder) },
      },
    });

    if (questions.length === 0) {
      const pollExists = await db.query.polls.findFirst({
        where: eq(schema.polls.id, pollId),
        columns: { id: true },
      });
      if (!pollExists) throw new NotFoundError('Poll');
    }

    const questionIds = questions.map((q) => q.id);

    const answerCounts =
      questionIds.length > 0
        ? await db
            .select({
              questionId: schema.answers.questionId,
              optionId: schema.answers.optionId,
              total: count(),
            })
            .from(schema.answers)
            .where(inArray(schema.answers.questionId, questionIds))
            .groupBy(schema.answers.questionId, schema.answers.optionId)
        : [];

    const [responseTotals, completeTotals] = await Promise.all([
      db
        .select({ total: count() })
        .from(schema.responses)
        .where(eq(schema.responses.pollId, pollId)),
      db
        .select({ total: count() })
        .from(schema.responses)
        .where(and(eq(schema.responses.pollId, pollId), eq(schema.responses.isComplete, true))),
    ]);

    const totalResponses = responseTotals[0]?.total ?? 0;
    const completeResponses = completeTotals[0]?.total ?? 0;
    const completionRate = totalResponses > 0 ? Math.round((completeResponses / totalResponses) * 100) : 0;

    const countMap = new Map<string, number>();
    for (const row of answerCounts) {
      countMap.set(`${row.questionId}:${row.optionId}`, Number(row.total));
    }

    const questionsSnapshot = questions.map((question) => {
      const totalAnswers = question.options.reduce(
        (sum, option) => sum + (countMap.get(`${question.id}:${option.id}`) ?? 0),
        0,
      );

      const options = question.options.map((option) => {
        const countForOption = countMap.get(`${question.id}:${option.id}`) ?? 0;
        return {
          optionId: option.id,
          optionText: option.text,
          count: countForOption,
          percentage: totalAnswers > 0 ? Math.round((countForOption / totalAnswers) * 100) : 0,
        };
      });

      return {
        questionId: question.id,
        questionText: question.text,
        totalAnswers,
        options,
      };
    });

    return {
      totalResponses,
      completionRate,
      questions: questionsSnapshot,
      computedAt: new Date().toISOString(),
    };
  });
}

// Get live analytics (from Redis counters + cached snapshot)

export async function getLiveAnalytics(pollId: string) {
  return cachedFetch(
    RedisKeys.analyticsSnapshot(pollId),
    RedisTTL.analyticsSnapshot,
    () => computeFullAnalytics(pollId),
    0
  );
}

// Get active user count

export async function getActiveUserCount(pollId: string): Promise<number> {
  const redis = getRedis();
  const count = await redis.sCard(`${RedisKeys.socketCount(pollId)}:members`);
  return count;
}

// Get response count from Redis (fast path) 

export async function getFastResponseCount(pollId: string): Promise<number> {
  const redis = getRedis();
  const val = await redis.get(RedisKeys.totalResponses(pollId));
  if (val !== null) return parseInt(val);

  // Fallback : load from DB and warm cache
  const db = getDb();
  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.responses)
    .where(eq(schema.responses.pollId, pollId));

  await redis.setEx(RedisKeys.totalResponses(pollId), 60, String(total));
  return total;
}
