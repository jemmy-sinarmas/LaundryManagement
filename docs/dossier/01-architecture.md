# 01 — Architecture

> Long-form diagrams + rationale live in [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md).
> This chapter is the as-built map and the wiring that doc predates.

## Stack

| Layer | Tech | Notes |
|---|---|---|
| Monorepo | pnpm@9.1.0 workspaces | `apps/web`, `apps/api`, `packages/shared` |
| Frontend | Next.js 14 (App Router) + Tailwind + shadcn/ui | PWA; offline-first POS |
| Frontend state | Zustand (UI/offline) + React Query-style hooks | server state via `lib/api.ts` |
| Backend | Fastify 4 (TypeScript, ESM) | plugin-based; `buildApp()` factory |
| DB access | postgres.js (raw SQL, tagged templates) | PGLite (WASM) adapter for native-free dev/test |
| Database | PostgreSQL 15 | all money as `BIGINT` whole IDR |
| Auth | JWT in HTTP-only cookie (HS256) | `@fastify/cookie` + custom auth plugin |
| Shared | `packages/shared` | types + constants imported by both apps |

## The single layering rule

```
Routes → Services → Repositories → DB     (never skip a layer)
```

- **Routes** (`apps/api/src/routes/<module>/`) — thin. Validate input (Zod/JSON Schema), call
  one service, return the response. No business logic.
- **Services** (`apps/api/src/services/*.service.ts`) — pure functions. No `req`/`res`. All
  business rules live here. 14 services (one per domain).
- **Repositories** (`apps/api/src/repositories/*.repo.ts`) — SQL only. No calculations. Return
  typed rows. Repo mappers apply the DATE fix (see [`02-data-model.md`](./02-data-model.md)).
- **Frontend** — no business logic; calls the API, renders state, handles UX.

## Backend wiring — `apps/api/src/app.ts`

`buildApp(opts): Promise<FastifyInstance>` is the composition root (imported by both
`server.ts` and the integration tests). In order, it:

1. **`loadEnv()`** — fail-fast env validation *before* any plugin registers (see below).
2. **`setErrorHandler`** — centralized handler producing a consistent `{ error }` shape:
   - `error.validation` → `400 { error }`
   - thrown service errors with `statusCode` 4xx → surfaced verbatim
   - anything else → logged server-side, returns generic `500 { error: 'Internal server error' }`
     (never leaks DB/stack detail).
3. Registers plugins: `db` → `cors` → `auth`, then `@fastify/rate-limit`
   (`global: false`, `max: 100`, `timeWindow: '1 minute'`; auth routes opt into a tighter limit).
4. **Security headers** via `onSend` hook: `X-Content-Type-Options: nosniff`,
   `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
5. Registers all route plugins under `/api/v1/*` (see [`04-api.md`](./04-api.md)).
6. Health endpoints (no `/api/v1` prefix):
   - **`GET /health`** — liveness, always `{ status: 'ok' }`.
   - **`GET /ready`** — readiness; runs `SELECT 1`, returns `{ status: 'ready' }` or `503 { status: 'unavailable' }`.

`server.ts` is a thin entry point: `buildApp()` then `listen()`.

## Env validation — `apps/api/src/config/env.ts`

`loadEnv()` parses `process.env` against a Zod schema once (cached) and throws an aggregated,
readable error listing every invalid var. Schema:

| Var | Rule |
|---|---|
| `DATABASE_URL` | required, non-empty |
| `JWT_SECRET` | **≥ 32 chars** |
| `JWT_EXPIRES_IN` | default `8h` |
| `PORT` | coerced int, default `4000` |
| `CORS_ORIGIN` | default `http://localhost:3000` |
| `NODE_ENV` | `development` \| `production` \| `test`, default `development` |

## Repo map (annotated)

```
apps/
├── api/                       # Fastify backend — ALL business logic
│   ├── src/
│   │   ├── app.ts             # buildApp() factory (see above)
│   │   ├── server.ts          # thin listen() entry
│   │   ├── config/env.ts      # loadEnv() Zod validation
│   │   ├── plugins/           # auth.ts, cors.ts, db.ts
│   │   ├── routes/            # 17 module dirs; HTTP handlers only
│   │   ├── services/          # 14 *.service.ts; business logic
│   │   ├── repositories/      # *.repo.ts; SQL only
│   │   ├── schemas/           # Zod + JSON Schema validation per module
│   │   ├── lib/               # date.ts, db-types.ts, sqlite-adapter.ts, whatsapp/
│   │   ├── utils/             # invoice.ts, fifo.ts
│   │   ├── types/             # shared internal types (e.g. reports.ts)
│   │   └── migrations/        # 001…018_*.sql + run.ts (+ 001_init_sqlite.sql)
│   ├── tests/unit/            # service/util tests (PGLite, no real DB)
│   └── tests/integration/     # real Postgres via global-setup
├── web/                       # Next.js PWA — NO business logic
│   └── src/{app,components,hooks,lib,store,i18n}/
└── packages/shared/           # types.ts + constants.ts (both apps import)
```

---

*Sources / canonical refs:* [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) (§1–§3, §7),
`apps/api/src/app.ts`, `apps/api/src/config/env.ts`, [`AGENTS.md`](../../AGENTS.md) (layer rules).
