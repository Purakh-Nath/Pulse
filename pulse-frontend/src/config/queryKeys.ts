// TanStack Query key factory
export const queryKeys = {
  // Auth
  me: ['auth', 'me'] as const,
  user: ['users', 'me'] as const,

  // Polls
  polls: (params?: Record<string, unknown>) =>
    params ? (['polls', params] as const) : (['polls'] as const),
  poll: (slug: string) => ['poll', slug] as const,
  pollById: (id: string) => ['poll', 'id', id] as const,

  // Analytics
  analytics: (pollId: string) => ['analytics', pollId] as const,
  analyticsCount: (pollId: string) => ['analytics', 'count', pollId] as const,

  // Results
  results: (pollId: string) => ['results', pollId] as const,
} as const;
