# Pulse Frontend

Web client for **Pulse**, a realtime collaborative polling platform. Handles authenticated poll management, public voting, live analytics, and socket-driven updates against the Pulse API.

## Tech Stack

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
| Styling | Tailwind CSS 3, PostCSS, Autoprefixer |
| Forms | React Hook Form, Zod, `@hookform/resolvers` |
| Charts | Recharts 3 |
| Drag and drop | `@dnd-kit/core`, `@dnd-kit/sortable` |
| Animation | Framer Motion 12 |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Utilities | `clsx`, `tailwind-merge`, `date-fns` |
| Linting | ESLint 10, TypeScript ESLint |

## Features

- **Authentication**: Cookie-based sessions with automatic token refresh via Axios interceptors
- **Poll lifecycle**: Create, edit, publish, and manage polls from the dashboard
- **Public voting**: Slug-based public poll and results pages
- **Realtime updates**: Socket.io events for presence, response counts, poll expiry, and publish completion
- **Live analytics**: Chart-driven analytics views with query invalidation on publish
- **Drag and drop**: Reorderable poll builder UI via dnd-kit
- **Form validation**: Schema-driven forms with Zod and React Hook Form
- **Routing**: Protected, public-only, and layout-based route groups with lazy-loaded pages
- **State management**: Zustand for auth, UI, and socket metadata; React Query for API data
- **Caching**: Centralized query keys with invalidation from socket events and mutations
- **Theming**: Light/dark theme provider
- **UX**: Loading skeletons, error boundary, toast notifications, animated counters

## Project Structure

```
pulse-frontend/
├── public/
├── src/
│   ├── api/                 # Axios instance and REST modules (auth, polls, analytics, ...)
│   ├── app/                 # Root App shell, auth bootstrap
│   ├── assets/              # Static assets
│   ├── components/
│   │   ├── shared/          # Cross-feature components (ErrorBoundary, PollCard, ...)
│   │   └── ui/              # Reusable UI primitives (Button, Modal, Skeleton, ...)
│   ├── config/              # Constants, query keys
│   ├── hooks/               # Data and domain hooks (usePoll, useSocketRoom, ...)
│   ├── layouts/             # AppLayout, AuthLayout, PublicLayout
│   ├── lib/                 # Shared utilities (cn, formatters)
│   ├── pages/               # Route-level page components
│   ├── providers/           # Query, Socket, Theme, Toast providers
│   ├── routes/              # Route definitions and guards
│   ├── sockets/             # Socket.io client singleton
│   ├── stores/              # Zustand stores (auth, ui, socket)
│   ├── styles/              # Global CSS
│   └── types/               # TypeScript types (api, poll, socket, auth, ...)
├── .env.example
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

Path alias: `@/` resolves to `src/`.

## Architecture Overview

### State layers

| Layer | Tool | Responsibility |
|-------|------|----------------|
| Server state | React Query | Polls, analytics, user data, paginated lists |
| Client state | Zustand | Auth session, UI preferences, socket connection metadata |
| Realtime | Socket.io | Push events that update Zustand or invalidate React Query |

### Provider stack

```
ErrorBoundary
  └── QueryProvider (React Query)
        └── BrowserRouter
              └── ThemeProvider
                    └── AuthBootstrap
                          └── SocketProvider
                                └── ToastProvider
                                      └── AppRoutes
```

### API and socket interaction

1. **REST (Axios)**: All CRUD and analytics reads go through `src/api/*` modules. Requests use `withCredentials: true` for HTTP-only cookies. Base URL: `{VITE_API_BASE_URL}/api/v1`.
2. **Sockets**: A singleton client in `src/sockets/socket.ts` connects when the user is authenticated. `SocketProvider` registers global listeners and coordinates with React Query and `socketStore`.
3. **Room hooks**: Page-level hooks (e.g. `useSocketRoom`) join poll-specific rooms for targeted realtime data.

On `401`, the Axios interceptor attempts `/auth/refresh`, retries the original request, or clears auth via `authStore`.

## Data Flow

### Request path (UI to backend)

```
UI component
  -> custom hook (usePoll, useSubmitResponse, ...)
    -> API module (src/api/*.ts)
      -> Axios (withCredentials)
        -> Pulse API (/api/v1)
          -> React Query cache update / invalidation
            -> UI re-render
```

### Realtime path (socket to UI)

```
Socket.io server event
  -> SocketProvider listener
    -> Branch:
         - Zustand (socketStore): presence, response counts, connection status
         - React Query invalidateQueries: poll:expired, poll:published
    -> Hook selectors / useQuery refetch
      -> UI update (badges, charts, live counters)
```

### Typical publish flow

1. User submits poll form (React Hook Form + Zod).
2. Mutation calls REST API to publish.
3. Server emits `poll:published` on the socket.
4. `SocketProvider` invalidates `results` and `analytics` query keys.
5. Analytics page refetches and charts update.

## Environment Variables

Copy `.env.example` to `.env` and set values for your environment.

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Pulse API origin (no `/api/v1` suffix) | `http://localhost:3000` |
| `VITE_SOCKET_URL` | Socket.io server origin | `http://localhost:3000` |
| `VITE_APP_URL` | Frontend origin (links, redirects) | `http://localhost:5173` |

In development, Vite proxies `/api` and `/socket.io` to these targets (see `vite.config.ts`).

## Setup

### Prerequisites

- Node.js 18+
- npm (or compatible package manager)
- Running Pulse API and Socket.io server

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

### Production build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start development server |
| `build` | `tsc -b && vite build` | Typecheck and production build |
| `preview` | `vite preview` | Serve production build locally |
| `lint` | `eslint .` | Run ESLint |

## Routes

| Path | Access | Page |
|------|--------|------|
| `/` | Public | Landing |
| `/login` | Public only | Login |
| `/poll/:slug` | Public | Public poll (vote) |
| `/results/:slug` | Public | Results |
| `/dashboard` | Protected | Dashboard |
| `/dashboard/new` | Protected | Poll builder (create) |
| `/dashboard/polls/:pollId/edit` | Protected | Poll builder (edit) |
| `/dashboard/polls/:slug/analytics` | Protected | Live analytics |
| `/dashboard/profile` | Protected | Profile |

## Best Practices

### Separation of concerns

- **Pages**: Compose layouts and wire hooks; avoid direct Axios calls.
- **Hooks**: Encapsulate React Query options, socket subscriptions, and derived state.
- **API modules**: Single place per resource for HTTP paths and payloads.
- **Stores**: Auth, ephemeral UI, and lightweight realtime metadata only.

### Server vs client state

- Put fetchable, cacheable data in React Query with keys from `src/config/queryKeys.ts`.
- Use Zustand for session identity, theme, modals, and values updated faster than a refetch (e.g. live response counts).
- Do not duplicate full poll entities in Zustand when React Query already holds them.

### Socket event handling

- Register global listeners once in `SocketProvider`; use `socket.off` in cleanup.
- Prefer **query invalidation** for data that must match the server (expiry, publish).
- Prefer **Zustand patches** for high-frequency, display-only metrics (presence, counts).
- Join and leave poll rooms in page or feature hooks, not in the root provider.
- Connect sockets only when authenticated; disconnect on logout via `destroySocket` where applicable.

### Forms and validation

- Define Zod schemas alongside types; pass resolvers to React Hook Form.
- Keep poll constraints aligned with backend limits (`POLL_LIMITS` in `src/config/constants.ts`).

### Performance

- Route-level code splitting is enabled via `React.lazy` in `src/routes/index.tsx`.
- Use React Query `staleTime` and `gcTime` per hook where appropriate for analytics and lists.