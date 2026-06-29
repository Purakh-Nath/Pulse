import { z } from 'zod';

export const createOptionSchema = z.object({
  text: z.string().min(1).max(500),
  displayOrder: z.number().int().min(0).default(0),
});

export const createQuestionSchema = z.object({
  text: z.string().min(1).max(1000),
  isRequired: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
  options: z.array(createOptionSchema).min(2).max(20),
});

export const createPollSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  responsesMode: z.enum(['anonymous', 'authenticated']).default('authenticated'),
  publishResults: z.boolean().default(false),
  expiresAt: z.coerce.date().optional(),
  status: z.enum(['draft', 'active', 'published']).optional(),
  questions: z.array(createQuestionSchema).min(1).max(50),
});

export const updatePollSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional(),
  responsesMode: z.enum(['anonymous', 'authenticated']).optional(),
  publishResults: z.boolean().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  status: z.enum(['draft', 'active', 'closed']).optional(),
});

export const pollParamsSchema = z.object({
  pollId: z.string().uuid(),
});

export const pollSlugParamsSchema = z.object({
  slug: z.string().min(1),
});

export const listPollsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['draft', 'active', 'expired', 'closed']).optional(),
});

export const aiGeneratePollSchema = z.object({
  topic: z.string().min(3).max(500),
});
