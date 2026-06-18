// API and App constants
export const APP_NAME = 'Pulse';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
export const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

export const API_PREFIX = '/api/v1';

// Poll constraints (mirrors backend)
export const POLL_LIMITS = {
  MAX_QUESTIONS: 50,
  MAX_OPTIONS: 20,
  MIN_OPTIONS: 2,
  MIN_QUESTIONS: 1,
  TITLE_MAX: 300,
  DESCRIPTION_MAX: 2000,
} as const;

// Analytics eventual consistency delay
export const ANALYTICS_DELAY_MS = 2000;

// Socket
export const SOCKET_MAX_CONNECTIONS = 10;

// Pagination
export const DEFAULT_PAGE_SIZE = 12;

// Toast durations
export const TOAST_DURATION = 4000;

// Chart colors - Cohesive warm orange palette instead of a rainbow
export const CHART_COLORS = [
  '#E8520A', // Primary (Deep Orange)
  '#A8A49E', // Secondary (Warm Gray)
  '#CA8A04', // Tertiary (Amber)
  '#F26B43', // Quaternary (Lighter Accent Orange)
  '#D4A373', // Quinary (Soft Sand)
];
