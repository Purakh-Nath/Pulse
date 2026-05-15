import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  uuid,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums

export const pollStatusEnum = pgEnum('poll_status', ['draft', 'active', 'expired', 'closed']);
export const responsesModeEnum = pgEnum('responses_mode', ['anonymous', 'authenticated']);


export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    googleId: text('google_id').notNull().unique(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    avatar: text('avatar'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    googleIdIdx: uniqueIndex('users_google_id_idx').on(t.googleId),
    emailIdx: uniqueIndex('users_email_idx').on(t.email),
  })
);


export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    family: text('family').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    userIdIdx: index('refresh_tokens_user_id_idx').on(t.userId),
    familyIdx: index('refresh_tokens_family_idx').on(t.family),
  })
);


export const polls = pgTable(
  'polls',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    status: pollStatusEnum('status').notNull().default('draft'),
    responsesMode: responsesModeEnum('responses_mode').notNull().default('authenticated'),
    publishResults: boolean('publish_results').notNull().default(false),
    expiresAt: timestamp('expires_at'),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: uniqueIndex('polls_slug_idx').on(t.slug),
    ownerIdx: index('polls_owner_id_idx').on(t.ownerId),
    statusIdx: index('polls_status_idx').on(t.status),
    expiresAtIdx: index('polls_expires_at_idx').on(t.expiresAt),
  })
);

export const questions = pgTable(
  'questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pollId: uuid('poll_id')
      .notNull()
      .references(() => polls.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    isRequired: boolean('is_required').notNull().default(true),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    pollIdIdx: index('questions_poll_id_idx').on(t.pollId),
  })
);

export const options = pgTable(
  'options',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    questionIdIdx: index('options_question_id_idx').on(t.questionId),
  })
);

export const responses = pgTable(
  'responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pollId: uuid('poll_id')
      .notNull()
      .references(() => polls.id, { onDelete: 'cascade' }),
    respondentId: uuid('respondent_id').references(() => users.id, { onDelete: 'set null' }),
    anonymousId: text('anonymous_id'),
    ipHash: text('ip_hash'),
    submittedAt: timestamp('submitted_at').defaultNow().notNull(),
    isComplete: boolean('is_complete').notNull().default(false),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  },
  (t) => ({
    pollIdIdx: index('responses_poll_id_idx').on(t.pollId),
    respondentIdx: index('responses_respondent_id_idx').on(t.respondentId),
    anonymousIdx: index('responses_anonymous_id_idx').on(t.anonymousId),
  })
);


export const answers = pgTable(
  'answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    responseId: uuid('response_id')
      .notNull()
      .references(() => responses.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    optionId: uuid('option_id')
      .notNull()
      .references(() => options.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    responseIdIdx: index('answers_response_id_idx').on(t.responseId),
    questionIdIdx: index('answers_question_id_idx').on(t.questionId),
    uniqueAnswerIdx: uniqueIndex('answers_unique_idx').on(t.responseId, t.questionId),
  })
);

export const pollAnalytics = pgTable(
  'poll_analytics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pollId: uuid('poll_id')
      .notNull()
      .references(() => polls.id, { onDelete: 'cascade' })
      .unique(),
    totalResponses: integer('total_responses').notNull().default(0),
    completionRate: integer('completion_rate').notNull().default(0),
    snapshotData: jsonb('snapshot_data').$type<AnalyticsSnapshot>(),
    lastComputedAt: timestamp('last_computed_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    pollIdIdx: uniqueIndex('poll_analytics_poll_id_idx').on(t.pollId),
  })
);

export const socketPresence = pgTable(
  'socket_presence',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pollId: uuid('poll_id').notNull(),
    socketId: text('socket_id').notNull(),
    userId: uuid('user_id'),
    connectedAt: timestamp('connected_at').defaultNow().notNull(),
    lastPingAt: timestamp('last_ping_at').defaultNow(),
  },
  (t) => ({
    pollIdIdx: index('socket_presence_poll_id_idx').on(t.pollId),
    socketIdIdx: uniqueIndex('socket_presence_socket_id_idx').on(t.socketId),
  })
);

export const publishedResults = pgTable(
  'published_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pollId: uuid('poll_id')
      .notNull()
      .references(() => polls.id, { onDelete: 'cascade' })
      .unique(),
    resultData: jsonb('result_data').$type<PublishedResultData>().notNull(),
    publishedAt: timestamp('published_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    pollIdIdx: uniqueIndex('published_results_poll_id_idx').on(t.pollId),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  polls: many(polls),
  responses: many(responses),
  refreshTokens: many(refreshTokens),
}));

export const pollsRelations = relations(polls, ({ one, many }) => ({
  owner: one(users, { fields: [polls.ownerId], references: [users.id] }),
  questions: many(questions),
  responses: many(responses),
  analytics: one(pollAnalytics, { fields: [polls.id], references: [pollAnalytics.pollId] }),
  publishedResult: one(publishedResults, { fields: [polls.id], references: [publishedResults.pollId] }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  poll: one(polls, { fields: [questions.pollId], references: [polls.id] }),
  options: many(options),
  answers: many(answers),
}));

export const optionsRelations = relations(options, ({ one, many }) => ({
  question: one(questions, { fields: [options.questionId], references: [questions.id] }),
  answers: many(answers),
}));

export const responsesRelations = relations(responses, ({ one, many }) => ({
  poll: one(polls, { fields: [responses.pollId], references: [polls.id] }),
  respondent: one(users, { fields: [responses.respondentId], references: [users.id] }),
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  response: one(responses, { fields: [answers.responseId], references: [responses.id] }),
  question: one(questions, { fields: [answers.questionId], references: [questions.id] }),
  option: one(options, { fields: [answers.optionId], references: [options.id] }),
}));

// Shared Types

export interface AnalyticsSnapshot {
  totalResponses: number;
  completionRate: number;
  questions: {
    questionId: string;
    questionText: string;
    totalAnswers: number;
    options: {
      optionId: string;
      optionText: string;
      count: number;
      percentage: number;
    }[];
  }[];
  computedAt: string;
}

export interface PublishedResultData {
  pollTitle: string;
  pollDescription?: string;
  totalResponses: number;
  publishedAt: string;
  questions: AnalyticsSnapshot['questions'];
}