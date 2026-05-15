# Pulse - Realtime Collaborative Polling Platform

Production-grade backend for a realtime polling platform. Built with Node.js, TypeScript, Express, PostgreSQL, Redis, Socket.io, and BullMQ.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20, TypeScript 5 |
| Framework | Express.js |
| Database | PostgreSQL 16 + Drizzle ORM |
| Cache / Realtime state | Redis 7 |
| Job queues | BullMQ |
| Realtime | Socket.io |
| Auth | Google OAuth 2.0 / OpenID Connect + JWT (jose) |
| Validation | Zod |
| Logging | Pino |
| Containers | Docker + Docker Compose |

---

## Project Structure

```
pulse/
├── src/
│   ├── index.ts                      # Server bootstrap + graceful shutdown
│   ├── app.ts                        # Express app factory
│   │
│   ├── config/
│   │   ├── env.ts                    # Zod-validated environment config
│   │   └── logger.ts                 # Pino logger (pretty dev / JSON prod)
│   │
│   ├── db/
│   │   ├── client.ts                 # PostgreSQL pool + Drizzle instance
│   │   ├── migrate.ts                # Migration runner
│   │   └── schema/
│   │       └── index.ts              # Full normalized schema + relations
│   │
│   ├── shared/
│   │   ├── errors/
│   │   │   └── index.ts              # Typed error classes (AppError, etc.)
│   │   └── types/
│   │       └── index.ts              # Shared TS interfaces + enums
│   │
│   ├── services/
│   │   ├── redis.ts                  # Redis client + key registry + TTLs
│   │   ├── jwt.ts                    # Access/refresh token sign + verify
│   │   ├── oidc.ts                   # Google OIDC client (openid-client)
│   │   ├── anon.ts                   # Layered anonymous identity resolution
│   │   ├── cache.ts                  # Stale-while-revalidate, stampede lock
│   │   └── rateLimiter.ts            # Redis sliding window rate limiters
│   │
│   ├── middleware/
│   │   ├── auth.ts                   # requireAuth / optionalAuth / ownership
│   │   ├── validate.ts               # Zod body/query/params middleware
│   │   ├── correlationId.ts          # X-Correlation-ID injection
│   │   └── errorHandler.ts           # Centralized error + 404 handler
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.schemas.ts       # Zod schemas
│   │   │   ├── auth.service.ts       # Token issuance, rotation, revocation
│   │   │   ├── auth.controller.ts    # login / callback / refresh / logout
│   │   │   └── auth.routes.ts
│   │   │
│   │   ├── polls/
│   │   │   ├── polls.schemas.ts      # Create/update/list Zod schemas
│   │   │   ├── polls.service.ts      # CRUD + cache + expiry scheduling
│   │   │   ├── polls.controller.ts
│   │   │   └── polls.routes.ts
│   │   │
│   │   ├── responses/
│   │   │   ├── responses.schemas.ts  # Submit answer schema
│   │   │   ├── responses.service.ts  # Validation + dedup + queue dispatch
│   │   │   ├── responses.controller.ts
│   │   │   └── responses.routes.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── analytics.service.ts  # Live Redis counters + cached snapshots
│   │   │   ├── analytics.controller.ts
│   │   │   └── analytics.routes.ts
│   │   │
│   │   ├── results/
│   │   │   ├── results.service.ts    # Published result fetch + publish trigger
│   │   │   ├── results.controller.ts
│   │   │   └── results.routes.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.service.ts      # Profile read/update
│   │   │   ├── users.controller.ts
│   │   │   └── users.routes.ts
│   │   │
│   │   └── health/
│   │       ├── health.controller.ts  # /health, /health/live, /health/ready
│   │       └── health.routes.ts
│   │
│   ├── queues/
│   │   └── index.ts                  # BullMQ queue instances + job types
│   │
│   ├── workers/
│   │   ├── analyticsWorker.ts        # Batched DB writes + Redis counters
│   │   ├── expiryWorker.ts           # Poll expiry enforcement
│   │   └── publishWorker.ts          # Result publishing pipeline
│   │
│   ├── sockets/
│   │   ├── index.ts                  # Socket.io setup, auth, handlers
│   │   └── rooms.ts                  # Poll room registry + broadcast helpers
│   │
│   └── utils/
│       ├── response.ts               # ok() / created() / paginated() helpers
│       └── pagination.ts             # Pagination schema + builders
│
├── Dockerfile                        # Multi-stage production build
├── docker-compose.yml                # Full local stack (app + pg + redis)
├── drizzle.config.ts                 # Drizzle Kit config
├── tsconfig.json
├── package.json
└── .env.example
```

---

## Database Schema

```
users              - Google OAuth profiles
refresh_tokens     - Rotating refresh tokens with family reuse detection
polls              - Poll metadata (status, mode, expiry, slug)
questions          - Single-choice questions per poll (ordered)
options            - Answer choices per question (ordered)
responses          - One per respondent per poll (auth or anon dedup)
answers            - Selected option per question per response
poll_analytics     - Aggregated counts (updated via background worker)
socket_presence    - Active socket connections per poll room
published_results  - Snapshotted final results (JSON)
```

---

## API Reference

All routes are versioned under `/api/v1`.

### Auth - `/api/v1/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/login` | - | Redirect to Google OAuth |
| GET | `/callback` | - | OAuth callback, sets cookies |
| POST | `/refresh` | cookie | Rotate refresh token |
| POST | `/logout` | cookie | Revoke current session |
| POST | `/logout-all` | JWT | Revoke all sessions |
| GET | `/me` | JWT | Get current user |

### Users - `/api/v1/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/me` | JWT | Get profile |
| PATCH | `/me` | JWT | Update name |

### Polls - `/api/v1/polls`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create poll |
| GET | `/` | JWT | List my polls (paginated) |
| GET | `/:pollId` | optional | Get poll by ID |
| GET | `/slug/:slug` | optional | Get poll by slug |
| PATCH | `/:pollId` | JWT (owner) | Update poll |
| POST | `/:pollId/activate` | JWT (owner) | Set status -> active |
| DELETE | `/:pollId` | JWT (owner) | Delete poll |

### Responses - `/api/v1/polls/:pollId/responses`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | optional | Submit response |

### Analytics - `/api/v1/polls/:pollId/analytics`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | optional | Live analytics snapshot |
| GET | `/count` | - | Fast response count (Redis) |

### Results - `/api/v1/polls/:pollId/results`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | - | Get published results |
| POST | `/publish` | JWT (owner) | Trigger result publishing |

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Full readiness check (db + redis) |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |

---

## Socket.io Events

Connect to the server at the root namespace. Pass JWT via `auth.token` in handshake.

### Client -> Server

| Event | Payload | Description |
|---|---|---|
| `poll:join` | `{ pollId }` | Join a poll's live room |
| `poll:leave` | `{ pollId }` | Leave a poll's live room |
| `ping` | - | Heartbeat |

### Server -> Client

| Event | Payload | Description |
|---|---|---|
| `response:count` | `{ pollId, count }` | Updated response count |
| `presence:update` | `{ pollId, activeUsers }` | Live viewer count |
| `poll:expired` | `{ pollId }` | Poll has expired |
| `poll:published` | `{ pollId }` | Results have been published |
| `pong` | `{ ts }` | Heartbeat reply |

---

## Architecture Highlights

### Anonymous Identity - 4-Layer Strategy
1. **Signed cookie** - HMAC-signed, httpOnly, 30-day TTL
2. **Device fingerprint** - UA + language + platform hash
3. **Redis session token** - `X-Session-ID` header backed by Redis
4. **IP heuristic** - hashed IP as soft last-resort

### Thundering Herd Protection
- `cachedFetch()` - stale-while-revalidate with background revalidation
- `withRedisLock()` - distributed lock prevents stampede on cache miss
- `deduplicateInflight()` - in-process promise deduplication
- Analytics endpoints serve from Redis snapshots, never recompute on every request

### Batched Analytics Writes
```
POST /responses  ->  enqueueAnalytics()  ->  BullMQ  ->  analyticsWorker
                                                        ├── buffers events (2s window)
                                                        ├── increments Redis counters (atomic)
                                                        └── upserts DB aggregates (periodic)
```

### Refresh Token Rotation + Reuse Detection
- Every refresh issues a new token and revokes the old one
- Tokens are grouped into **families**
- If a revoked token is presented again -> entire family is revoked -> user forced to re-login

### Rate Limiting (Redis sliding window)
| Limiter | Limit | Window |
|---|---|---|
| Global IP | 200 req | 60s |
| Poll submit | 5 req | 60s (blocks 120s) |
| Analytics | 30 req | 60s |
| Auth | 10 req | 60s (blocks 300s) |

---

## Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js 20+

### 1. Clone and configure

```bash
git clone <repo>
cd pulse
cp .env.example .env
# Fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and all secret keys
# Generate secrets: openssl rand -hex 32
```

### 2. Start infrastructure only

```bash
docker compose up postgres redis -d
```

### 3. Run migrations

```bash
npm install
npm run db:migrate
```

### 4. Start dev server

```bash
npm run dev
```

Server starts at `http://localhost:3000`.

### 5. (Alternative) Full Docker stack

```bash
# Production image
docker compose up --build

# Dev with hot reload + Drizzle Studio
docker compose --profile dev up --build
```

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Hot-reload dev server (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled production build |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Open Drizzle Studio GUI |
| `npm run typecheck` | Type-check without emitting |