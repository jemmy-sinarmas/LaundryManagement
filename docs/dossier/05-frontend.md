# 05 — Frontend

> `apps/web` — Next.js 14 App Router PWA. **No business logic** lives here (it calls the API).

## Route groups (`apps/web/src/app/`)

| Group | Routes | Audience |
|---|---|---|
| `(auth)` | `login` | public |
| `(admin)` | `dashboard`, `users`, `customers`, `items`, `expenses`, `inventory`, `orders`, `promotions`, `branches`, `reports`, `settings`, `message-templates`, `notifications` | admin |
| `(kasir)` | `pos`, `antrian` (order queue), `shift`, `pickup/[token]` | kasir |
| `track` | `t/[token]` (QR), `[invoiceId]` (staff/legacy) | public, no auth |

`middleware.ts` redirects unauthenticated app routes to `/login` and leaves `/track/*` public.

## State — `apps/web/src/store/` (Zustand)

| Store | Owns |
|---|---|
| `authStore.ts` | current user/role/branch from the JWT cookie session |
| `posStore.ts` | the cart **and the offline order queue** (`pendingOrders`), persisted to localStorage |
| `langStore.ts` | id/en language toggle (localStorage) |
| `toastStore.ts` | global toast notifications (QoL Sprint A/I error UX) |

## Hooks — `apps/web/src/hooks/`

Data hooks wrap `lib/api.ts`: `useCustomers`, `useItems`, `useExpenses`, `useInventory`,
`useReports`, `useSettings`, `useUsers`, `useMessageTemplates`. Plus the two POS-critical hooks:

- **`usePOS.ts`** — POS cart + checkout. Delegates money math to
  [`lib/calculations.ts`](../../apps/web/src/lib/calculations.ts) (`calcSubtotal`,
  `calcOrderTotals`) — see [`03-domain-rules.md`](./03-domain-rules.md).
- **`useOfflineSync.ts`** — drains the offline queue. Delegates the loop to
  [`lib/offlineSync.ts`](../../apps/web/src/lib/offlineSync.ts) `syncPendingOrders`.
- `useBluetooth.ts` — pairs a thermal printer for ESC/POS receipts.

## The offline order queue (POS is offline-first)

1. At checkout, if the network call fails, the order is queued in `posStore.pendingOrders`
   (persisted to localStorage).
2. On reconnect (`window 'online'`) `useOfflineSync` calls `syncPendingOrders([...pending], { post, remove })`.
3. `syncPendingOrders` (`lib/offlineSync.ts`) posts each in order, removes it on success, and
   **stops on the first failure** — leaving the rest queued so nothing is lost or double-sent.
   This is the highest-risk frontend path and is unit-tested ([`07-testing-ci.md`](./07-testing-ci.md)).

## Other libs — `apps/web/src/lib/`

| File | Purpose |
|---|---|
| `api.ts` | fetch wrapper (credentials, base URL, error mapping) |
| `auth.ts` | `decodeToken` (reads JWT payload segment) |
| `utils.ts` | `formatIDR`, `formatDate` (id/en), `cn` |
| `calculations.ts` | POS money math (pure) |
| `offlineSync.ts` | offline queue drain (pure) |
| `escpos.ts` | ESC/POS byte builders for thermal receipts |

## i18n & PWA

- i18n: `apps/web/src/i18n/{id.json,en.json}`. **Keys must stay at parity** — add to both.
  Bahasa Indonesia is default; English toggle persists in localStorage.
- PWA: `@ducanh2912/next-pwa` generates the service worker; `public/manifest.json` + icons +
  `offline.html` fallback. App shell cache-first; API GET network-first; POS create queued offline.
- Printing: browser print API for A5 invoices (`components/invoice/PrintableInvoice.tsx`) with an
  embedded QR; optional Bluetooth thermal printer via `escpos.ts` + `useBluetooth`.

---

*Sources / canonical refs:* `apps/web/src/{app,store,hooks,lib}/`,
[`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) §3 + §6 (PWA), [`AGENTS.md`](../../AGENTS.md) i18n skill.
