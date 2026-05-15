import { z } from 'zod';

export const answerSchema = z.object({
  questionId: z.string().uuid(),
  optionId: z.string().uuid(),
});

export const submitResponseSchema = z.object({
  answers: z.array(answerSchema).min(1),
});

export const responseParamsSchema = z.object({
  pollId: z.string().uuid(),
});
