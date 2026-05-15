import { z } from 'zod';

export const callbackSchema = z.object({
  code: z.string(),
  state: z.string(),
  error: z.string().optional(),
});

export const refreshSchema = z.object({
  // refresh token is in httpOnly cookie - no body needed
});
