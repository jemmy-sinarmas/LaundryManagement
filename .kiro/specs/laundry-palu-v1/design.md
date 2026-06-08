# Laundry Palu — Technical Design Reference
> **Status:** v1.0 COMPLETE. This doc reflects the as-built system.
> Update this when making structural changes (new routes, schema migrations, new services).

---

## Architecture Overview

```
Internet
  └── nginx (TLS, port 443)
        ├── :3000 → Next.js 14 PWA (apps/web)
        └── :4000 → Fastify 4 API  (apps/api)
                        └── PostgreSQL 15 (port 5432, local socket or Docker)
```

**Process manager:** PM2 (`ecosystem.config.cjs`)
**Local dev:** `docker-compose.yml` — `postgres:15-alpine` + api + web

---

## Layer Map

```
apps/web  (Next.js 14)
  └── pages/components → lib/api.ts (fetch wrapper) → API over HTTPS

apps/api  (Fastify 4)
  └── routes/          → validate input (Zod), call ONE service fn, return response
      services/        → pure functions, zero HTTP awareness, all business logic
      repositories/    → raw SQL via postgres.js, return typed rows only
      plugins/db.ts    → postgres.js pool decorated as fastify.db
      plugins/auth.ts  → JWT HTTP-only cookie, decorates fastify.user

packages/shared
  └── types.ts         → shared TypeScript interfaces (Customer, Order, Membership, …)
      constants.ts     → ORDER_STATUSES, MEMBERSHIP_TYPES, ITEM_TYPES, EXPENSE_LEVELS
```

---

## Database Schema Summary

See `docs/database/schema.sql` for full DDL.

| Table | Key columns | Notes |
|---|---|---|
| `users` | id, username, password (bcrypt), role, is_active | role: admin / kasir |
| `customers` | id, nama, alamat, no_hp (unique), is_active | soft-delete only |
| `memberships` | id, customer_id, tipe, durasi_bulan, sisa_kg, is_active | one per type per customer |
| `items` | id, nama, tipe, harga (BIGINT), is_active | soft-delete only |
| `orders` | id, invoice_no (unique), customer_id, status, total (BIGINT) | snapshot discounts |
| `order_items` | order_id, item_id, nama_item, harga, qty, subtotal | price snapshot at order time |
| `order_status_history` | order_id, status, changed_by, changed_at | append-only |
| `expense_categories` | id, nama, level (variabel/tetap) | feeds income statement |
| `expenses` | id, tanggal, jumlah (BIGINT), category_id, inventory_item_id | optional stock link |
| `inventory_items` | id, nama, qty_saat_ini, harga_rata_fifo (BIGINT), stok_minimum | soft-delete |
| `inventory_transactions` | item_id, tipe (masuk/keluar), qty, harga_per_unit | append-only ledger |

**Money rule:** All IDR values are `BIGINT` whole rupiah. No `DECIMAL` in money columns.

---

## Key Algorithms

### Invoice Number Generation (`apps/api/src/utils/invoice.ts`)
```
INV-YYYYMMDD-NNNN
  └── NNNN = COUNT(orders WHERE created_at::date = today) + 1, zero-padded to 4 digits
      Generated server-side inside a transaction to avoid race conditions
```

### FIFO Average Cost (`apps/api/src/utils/fifo.ts`)
```
newAvg = floor(
  ((currentQty × currentAvg) + (inQty × inPrice))
  / (currentQty + inQty)
)
```
Called on every `masuk` inventory transaction. Result stored in `inventory_items.harga_rata_fifo`.

### Membership Discount Logic (`apps/api/src/services/membership.service.ts`)
```
validateMembership(membership, orderDate, totalKg):
  if tipe === 'periodik':
    active = orderDate >= tanggal_mulai AND orderDate <= tanggal_selesai
    return { discount: active ? 0.10 : 0, warning: !active ? 'EXPIRED' : null }
  if tipe === 'paket_kg':
    willGoNegative = (sisa_kg - totalKg) < 0
    return { discount: 0, deductKg: totalKg, warning: willGoNegative ? 'LOW_BALANCE' : null }
```

### Order Status Transition Guard (`apps/api/src/services/order.service.ts`)
```
ORDER_STATUSES = ['diterima','dicuci','dikeringkan','dibungkus','siap_diambil','selesai']
isValidTransition(current, next):
  currentIdx = ORDER_STATUSES.indexOf(current)
  nextIdx    = ORDER_STATUSES.indexOf(next)
  return nextIdx === currentIdx + 1   // exactly one step forward only
```

---

## API Routes

Base URL: `/api/v1`
Auth: JWT in HTTP-only cookie (all routes except `/auth/login` and `/track/*`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /auth/login | Public | Returns JWT cookie |
| DELETE | /auth/logout | Any | Clears cookie |
| GET/POST | /users | Admin | List / create users |
| PATCH | /users/:id | Admin | Update / deactivate user |
| GET/POST | /customers | Admin, Kasir | List (with search) / create |
| GET | /customers/:id | Admin, Kasir | Detail + order history |
| GET | /membership/:customerId | Admin, Kasir | Active memberships |
| POST | /membership | Admin | Create membership |
| GET/POST | /items | Admin, Kasir | List active / create |
| PATCH | /items/:id | Admin | Update / deactivate |
| POST | /orders | Admin, Kasir | Create order (POS) |
| GET | /orders | Admin, Kasir | List with filters |
| PATCH | /orders/:id/status | Admin, Kasir | Advance status (one step) |
| GET/POST | /expenses | Admin, Kasir | List / create expense |
| GET/POST | /expense-categories | Admin | Manage categories |
| GET | /inventory | Admin | List items + stock levels |
| POST | /inventory/transaction | Admin | Record masuk/keluar |
| GET | /reports/dashboard | Admin | KPIs + chart data |
| GET | /reports/daily | Admin | Daily orders + totals |
| GET | /reports/monthly | Admin | Monthly revenue |
| GET | /reports/income-statement | Admin | P&L for date range |
| GET | /track/:invoiceNo | **Public** | Order status for customers |
| GET | /track/phone/:noHp | **Public** | Orders by phone number |

---

## Frontend Route Map

```
/ → redirects to /dashboard or /login

(auth)
  /login

(admin) — Admin role only
  /dashboard
  /users
  /customers
  /customers/[id]
  /items
  /expenses
  /expenses/categories
  /inventory
  /reports/daily
  /reports/monthly
  /reports/income-statement

(kasir) — Kasir + Admin
  /pos
  /orders

track (public, no auth)
  /track
  /track/[invoiceNo]
```

Middleware (`apps/web/src/middleware.ts`): redirects unauthenticated requests to `/login`. Paths starting with `/track` are explicitly excluded.

---

## PWA / Offline Strategy

| Resource | Workbox Strategy |
|---|---|
| App shell (HTML, CSS, JS bundles) | Cache First |
| API GET requests | Network First with stale cache fallback |
| Images / icons | Cache First |
| Uncached navigation (offline) | Serve `public/offline.html` |
| POS order creation (offline) | Queue in IndexedDB `offline_orders` → Background Sync on reconnect |

Service worker generated by `@ducanh2912/next-pwa` at build time → `apps/web/public/sw.js`.

---

## Security Controls

| Control | Implementation |
|---|---|
| Password hashing | bcrypt, cost factor 12 |
| Token | JWT HS256, 8h expiry, HTTP-only SameSite=Strict cookie |
| Input validation | Zod schemas on all API route inputs |
| SQL injection | postgres.js tagged template literals (parameterised, never string concat) |
| CORS | Restricted to own domain in production |
| Rate limiting | `@fastify/rate-limit` — 100 req/min per IP on auth routes |
| HTTPS | Enforced at nginx reverse proxy; never at app level |
| RBAC | Enforced in Fastify route preHandlers via `fastify.user.role` |

---

## Environment Variables

| Variable | App | Description |
|---|---|---|
| `DATABASE_URL` | api | postgres.js connection string |
| `JWT_SECRET` | api | ≥ 32 chars random string |
| `JWT_EXPIRES_IN` | api | e.g. `8h` |
| `NEXT_PUBLIC_API_URL` | web | Backend base URL (e.g. `http://localhost:4000`) |
| `NODE_ENV` | both | `development` / `production` |

---

## Testing

| Suite | Location | Command | Coverage |
|---|---|---|---|
| Unit (API) | `apps/api/tests/unit/` | `npm run test --run` | All service business rule branches |
| Integration (API) | `apps/api/tests/integration/` | `npm run test --run` | Full HTTP → DB round trips |
| Frontend | `apps/web/` (Vitest + RTL) | `npm run test --run` | POS flow, invoice rendering |

Test count at v1.0 completion: **65 passing** (api unit + integration).

---

## Deployment (Current: Single VPS)

```bash
# 1. Set env vars in /etc/environment or .env
# 2. Pull latest, build
git pull && npm install && npm run build

# 3. Run pending migrations
cd apps/api && npm run migrate

# 4. Restart via PM2
pm2 reload ecosystem.config.cjs

# 5. Smoke test
curl https://yourdomain.com/api/v1/track/INV-$(date +%Y%m%d)-0001
```

Docker alternative: `docker compose -f docker-compose.prod.yml up -d`

Daily backup: `pg_dump laundry_palu > /var/backups/laundry-palu/$(date +%Y%m%d).sql`
