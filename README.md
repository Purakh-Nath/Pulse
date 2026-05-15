# Pulse

Realtime collaborative polling platform. Users create and manage polls through an authenticated dashboard; respondents vote via public slug-based URLs. Results and analytics update live through Socket.io.

The repository is organized as a monorepo with a React frontend and a Node.js/Express backend.

---

## Tech Stack

### Frontend

| Category | Technology |
|----------|------------|
| UI framework | React 19 |
| Build tool | Vite 8 |
| Language | TypeScript 6 |
| Routing | React Router 7 |
| Client state | Zustand 5 |
| Server state | TanStack React Query 5 |
| HTTP client | Axios |
| Realtime | Socket.io Client 4 |
| Styling | Tailwind CSS 3 |
| Forms | React Hook Form + Zod |
| Charts | Recharts 3 |
| Drag and drop | dnd-kit |

### Backend

| Category | Technology |
|----------|------------|
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

## Monorepo Structure

```
pulse/
├── frontend/                  # React client (Vite)
│   ├── src/
│   │   ├── api/               # Axios instance and REST modules
│   │   ├── app/               # Root shell, auth bootstrap
│   │   ├── components/        # Shared and UI primitive components
│   │   ├── config/            # Constants, query keys
│   │   ├── hooks/             # Data and domain hooks
│   │   ├── layouts/           # AppLayout, AuthLayout, PublicLayout
│   │   ├── pages/             # Route-level page components
│   │   ├── providers/         # Query, Socket, Theme, Toast providers
│   │   ├── routes/            # Route definitions and guards
│   │   ├── sockets/           # Socket.io client singleton
│   │   ├── stores/            # Zustand stores (auth, ui, socket)
│   │   └── types/             # TypeScript types
│   ├── .env.example
│   ├── vite.config.ts
│   └── package.json
│
└── backend/                   # Express API + workers
    ├── src/
    │   ├── config/            # Zod-validated env, logger
    │   ├── db/                # PostgreSQL pool, Drizzle, schema, migrations
    │   ├── middleware/        # Auth, validation, correlation ID, error handler
    │   ├── modules/           # Feature modules (auth, polls, responses, analytics, results, users, health)
    │   ├── queues/            # BullMQ queue instances and job types
    │   ├── services/          # Redis, JWT, OIDC, cache, rate limiter, anon identity
    │   ├── sockets/           # Socket.io setup, auth, room registry
    │   ├── workers/           # Analytics, expiry, and publish workers
    │   └── utils/             # Response helpers, pagination
    ├── Dockerfile
    ├── docker-compose.yml
    ├── drizzle.config.ts
    ├── .env.example
    └── package.json
```

---

## Features

- **Authentication**: Google OAuth 2.0 with rotating JWT refresh tokens and family-based reuse detection. Cookie-based sessions with automatic token refresh on the client via Axios interceptors.
- **Poll lifecycle**: Create, edit, activate, and delete polls. Drag-and-drop option ordering in the poll builder.
- **Public voting**: Slug-based public poll and results pages. Anonymous respondent deduplication via a 4-layer identity strategy (signed cookie, device fingerprint, Redis session token, hashed IP).
- **Realtime**: Socket.io rooms per poll. Live presence counts, response counts, expiry events, and publish notifications pushed to connected clients.
- **Analytics**: Live Redis counters with background aggregation into the database via BullMQ. Stale-while-revalidate caching with distributed stampede protection.
- **Result publishing**: On-demand publish trigger snapshots final results and emits a socket event. Charts on the analytics page update via React Query invalidation.
- **Rate limiting**: Redis sliding-window limiters per endpoint category.

---

## Architecture Overview

### State layers (frontend)

| Layer | Tool | Responsibility |
|-------|------|----------------|
| Server state | React Query | Polls, analytics, user data, paginated lists |
| Client state | Zustand | Auth session, UI preferences, socket metadata |
| Realtime | Socket.io | Push events that update Zustand or invalidate React Query |

### Request path

```
UI component
  -> custom hook
    -> API module (src/api/)
      -> Axios (withCredentials)
        -> Express API (/api/v1)
          -> React Query cache update / invalidation
            -> UI re-render
```

### Realtime path

```
Socket.io server event
  -> SocketProvider listener
    -> Zustand (presence, counts, connection status)
       or React Query invalidateQueries (poll:expired, poll:published)
    -> UI update
```

### Background job pipeline

```
POST /responses
  -> enqueueAnalytics()
    -> BullMQ
      -> analyticsWorker
           buffers events (2s window)
           increments Redis counters (atomic)
           upserts DB aggregates (periodic)
```

### Anonymous identity resolution (4 layers)

1. HMAC-signed httpOnly cookie (30-day TTL)
2. Device fingerprint (UA + language + platform hash)
3. Redis-backed session token (`X-Session-ID` header)
4. Hashed IP as last resort

### Thundering herd protection

- `cachedFetch()` - stale-while-revalidate with background revalidation
- `withRedisLock()` - distributed lock on cache miss
- `deduplicateInflight()` - in-process promise deduplication
- Analytics endpoints serve from Redis snapshots; counts are never recomputed per request

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Google OAuth profiles |
| `refresh_tokens` | Rotating tokens with family reuse detection |
| `polls` | Poll metadata (status, mode, expiry, slug) |
| `questions` | Ordered questions per poll |
| `options` | Ordered answer choices per question |
| `responses` | One per respondent per poll |
| `answers` | Selected option per question per response |
| `poll_analytics` | Aggregated counts updated by background worker |
| `socket_presence` | Active connections per poll room |
| `published_results` | Snapshotted final results (JSON) |

---

## API Summary

All routes are versioned under `/api/v1`.

### Auth - `/api/v1/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/login` | - | Redirect to Google OAuth |
| GET | `/callback` | - | OAuth callback; sets cookies |
| POST | `/refresh` | cookie | Rotate refresh token |
| POST | `/logout` | cookie | Revoke current session |
| POST | `/logout-all` | JWT | Revoke all sessions |
| GET | `/me` | JWT | Get current user |

### Users - `/api/v1/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | JWT | Get profile |
| PATCH | `/me` | JWT | Update display name |

### Polls - `/api/v1/polls`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | JWT | Create poll |
| GET | `/` | JWT | List owned polls (paginated) |
| GET | `/:pollId` | optional | Get poll by ID |
| GET | `/slug/:slug` | optional | Get poll by slug |
| PATCH | `/:pollId` | JWT (owner) | Update poll |
| POST | `/:pollId/activate` | JWT (owner) | Set status to active |
| DELETE | `/:pollId` | JWT (owner) | Delete poll |

### Responses - `/api/v1/polls/:pollId/responses`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | optional | Submit response |

### Analytics - `/api/v1/polls/:pollId/analytics`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | optional | Live analytics snapshot |
| GET | `/count` | - | Fast response count from Redis |

### Results - `/api/v1/polls/:pollId/results`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | - | Get published results |
| POST | `/publish` | JWT (owner) | Trigger result publishing |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Full readiness check (DB + Redis) |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |

---

## Socket.io Events

Connect at the root namespace. Pass JWT via `auth.token` in the handshake options.

### Client to server

| Event | Payload | Description |
|-------|---------|-------------|
| `poll:join` | `{ pollId }` | Join a poll room |
| `poll:leave` | `{ pollId }` | Leave a poll room |
| `ping` | - | Heartbeat |

### Server to client

| Event | Payload | Description |
|-------|---------|-------------|
| `response:count` | `{ pollId, count }` | Updated response count |
| `presence:update` | `{ pollId, activeUsers }` | Live viewer count |
| `poll:expired` | `{ pollId }` | Poll has expired |
| `poll:published` | `{ pollId }` | Results have been published |
| `pong` | `{ ts }` | Heartbeat reply |

---

## Rate Limits

| Scope | Limit | Window |
|-------|-------|--------|
| Global (per IP) | 200 requests | 60s |
| Poll submit | 5 requests | 60s (blocks 120s) |
| Analytics | 30 requests | 60s |
| Auth | 10 requests | 60s (blocks 300s) |

---

## Environment Variables

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | API origin (no `/api/v1` suffix) | `http://localhost:3000` |
| `VITE_SOCKET_URL` | Socket.io server origin | `http://localhost:3000` |
| `VITE_APP_URL` | Frontend origin | `http://localhost:5173` |

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens (`openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `COOKIE_SECRET` | HMAC secret for signed cookies |
| `PORT` | HTTP server port (default `3000`) |
| `NODE_ENV` | `development` or `production` |

---

## Setup

### Prerequisites

- Node.js 18+ (frontend), Node.js 20+ (backend)
- Docker and Docker Compose (for local infrastructure)
- Google OAuth credentials (Client ID and Secret)

### 1. Clone and configure

```bash
git clone <repo-url>
cd pulse
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Fill in Google OAuth credentials and generate secrets:
# openssl rand -hex 32
```

### 2. Start infrastructure

```bash
cd backend
docker compose up postgres redis -d
```

### 3. Install dependencies and run migrations

```bash
# Backend
cd backend
npm install
npm run db:migrate

# Frontend
cd ../frontend
npm install
```

### 4. Start development servers

```bash
# Backend (from backend/)
npm run dev
# Starts API at http://localhost:3000

# Frontend (from frontend/)
npm run dev
# Starts client at http://localhost:5173
```

### Alternative: Full Docker stack

```bash
cd backend

# Production image
docker compose up --build

# Dev with hot reload and Drizzle Studio
docker compose --profile dev up --build
```

---

## Scripts

### Frontend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | Typecheck and build for production |
| `npm run preview` | Serve production build locally |
| `npm run lint` | Run ESLint |

### Backend

| Script | Description |
|--------|-------------|
| `npm run dev` | Hot-reload dev server via tsx watch |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled production build |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Open Drizzle Studio GUI |
| `npm run typecheck` | Type-check without emitting |

---

## Frontend Routes

| Path | Access | Description |
|------|--------|-------------|
| `/` | Public | Landing page |
| `/login` | Public only | Login |
| `/poll/:slug` | Public | Vote on a poll |
| `/results/:slug` | Public | View published results |
| `/dashboard` | Protected | Poll management dashboard |
| `/dashboard/new` | Protected | Poll builder (create) |
| `/dashboard/polls/:pollId/edit` | Protected | Poll builder (edit) |
| `/dashboard/polls/:slug/analytics` | Protected | Live analytics |
| `/dashboard/profile` | Protected | User profile |