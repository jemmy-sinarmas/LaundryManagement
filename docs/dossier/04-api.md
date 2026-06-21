# 04 — API

> Full endpoint table: [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) §5. This chapter owns the
> module map, auth model, and response/error envelope as wired in `apps/api/src/app.ts`.

## Base + conventions

- Base path: **`/api/v1`** (health endpoints `/health`, `/ready` sit outside it).
- All routes are registered in `buildApp()` (`apps/api/src/app.ts`).
- **Error envelope:** every error response is `{ "error": "<message>" }` (set by the central
  `setErrorHandler`). 4xx service/validation errors surface their message; 5xx returns a generic
  `Internal server error` and logs detail server-side.
- Response success shapes are per-route; validation via `apps/api/src/schemas/*.schema.ts`.

## Module → prefix map (17 route groups)

| Module (`src/routes/`) | Prefix | Notes |
|---|---|---|
| `auth` | `/api/v1/auth` | login/logout; tighter rate limit |
| `users` | `/api/v1/users` | admin only |
| `customers` | `/api/v1/customers` | admin + kasir |
| `membership` | `/api/v1/customers` | **shares the customers prefix** (`/customers/:id/membership`) |
| `items` | `/api/v1/items` | branch-scoped for kasir |
| `orders` | `/api/v1/orders` | POS create, status PATCH, pickup token endpoints |
| `tracking` | `/api/v1/track` | **public, no auth** |
| `expense-categories` | `/api/v1/expense-categories` | |
| `expenses` | `/api/v1/expenses` | branch-scoped |
| `inventory` | `/api/v1/inventory` | FIFO transactions |
| `reports` | `/api/v1/reports` | admin only; `?branch_id=` filter |
| `settings` | `/api/v1/settings` | admin; key-value incl. WhatsApp config |
| `branches` | `/api/v1/branches` | admin |
| `promotions` | `/api/v1/promotions` | |
| `shifts` | `/api/v1/shifts` | kasir start/end |
| `message-templates` | `/api/v1/message-templates` | admin; WhatsApp templates |
| `notification-log` | `/api/v1/notification-log` | admin; send history |

## Auth model

- **JWT in an HTTP-only cookie** (HS256), `JWT_EXPIRES_IN` default `8h`, `SameSite=Strict`.
- The token carries `id`, `username`, `role`, and `branchId` (set at login).
- The `auth` plugin (`src/plugins/auth.ts`) decorates the request and enforces RBAC; routes
  declare required roles. **All routes require a valid JWT except** `/api/v1/auth/login` and the
  public `/api/v1/track/*` endpoints.
- RBAC is enforced **server-side** (frontend role gating is UX only).

## Public tracking endpoints (no auth)

| Method | Path | Use |
|---|---|---|
| GET | `/api/v1/track/t/:token` | **Primary** customer URL; `pickup_token` UUID from the receipt QR. Opaque, not enumerable. |
| GET | `/api/v1/track/:invoiceNo` | Staff/legacy lookup by invoice number. |
| GET | `/api/v1/track/phone/:noHp` | Lookup by phone number. |

All return the full order incl. `statusHistory[]`, items, and totals. These must always be
smoke-tested post-deploy ([`08-ops.md`](./08-ops.md)).

## Pickup endpoints

| Method | Path | Role |
|---|---|---|
| GET | `/api/v1/orders/pickup/:token` | kasir/admin — fetch by pickup token |
| PATCH | `/api/v1/orders/pickup/:token/complete` | kasir/admin — validate → advance to `selesai` |

## Health

| Method | Path | Meaning |
|---|---|---|
| GET | `/health` | liveness — always `{ status: 'ok' }` |
| GET | `/ready` | readiness — `SELECT 1` → `{ status: 'ready' }` or `503 { status: 'unavailable' }` |

---

*Sources / canonical refs:* `apps/api/src/app.ts` (registration + prefixes),
`apps/api/src/plugins/auth.ts`, `apps/api/src/routes/*`,
[`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) §5, [`AGENTS.md`](../../AGENTS.md) "Public tracking".
