# 06 — Feature Inventory (as-built)

> The complete shipped surface. Construction units mirror
> [`aidlc-docs/aidlc-state.md`](../../aidlc-docs/aidlc-state.md); the post-construction
> sprints below extend it (that ledger stopped at Sprint H). All items are **COMPLETE**.

## Construction units 01–29

| # | Unit | What shipped |
|---|---|---|
| 01 | monorepo-scaffold | pnpm workspaces, tsconfig, shared package |
| 02 | database-foundation | `001_init.sql`, migration runner, db/cors plugins, server |
| 03 | auth-users-api | PGLite adapter, JWT auth, user CRUD, RBAC |
| 04 | customer-item-membership-api | customer/item/membership CRUD, `validateMembership` |
| 05 | orders-pos-api | order creation + membership, forward-only status, invoice gen, tracking routes |
| 06 | expenses-inventory-api | expense + inventory CRUD, FIFO avg cost, stock deduction, low-stock |
| 07 | reports-api | 5 admin reports, income statement + new/returning customer fns |
| 08 | nextjs-foundation | Next build, middleware redirects, `/track/*` public, i18n shell, stores |
| 09 | auth-users-ui | login flow, users table + create dialog |
| 10 | customer-membership-ui | customer list/search/detail, membership badge + form |
| 11 | pos-interface | POS page, orders page, printable invoice + QR, offline sync |
| 12 | items-expense-ui | items table, expense form + stock preview, categories |
| 13 | inventory-ui | stock alert, transaction history, inventory page + FIFO |
| 14 | reports-dashboard-ui | dashboard KPIs + charts, daily/monthly/income-statement reports (Recharts) |
| 15 | tracking-page | public search (invoice/phone), detail stepper + timeline, bilingual |
| 16 | pwa-production | next-pwa SW, manifest + icons, offline fallback, Dockerfiles + compose |
| 17 | branches-db-api | `007_branches.sql`, branch CRUD, `User.branchId` |
| 18 | branch-user-assignment | `008`, kasir-requires-branch, JWT carries `branchId`, user branch selector |
| 19 | branch-items | `009`, per-branch item catalog + filters |
| 20 | branch-inventory | `010`, per-branch inventory stock |
| 21 | branch-orders-pos | `011` (`branch_id` + `pickup_token`), `INV-[KODE]-…` invoice, pickup endpoints |
| 22 | branch-expenses | `012`, branch-scoped expenses |
| 23 | branch-reports-ui | branch_id threaded through all reports, branches CRUD page |
| 24 | pickup-qr-validation | kasir pickup page, validate → `selesai`, lost-receipt contingency |
| 25 | ppn-gratuity | `013`, tax + gratuity in totals, settings + invoice display |
| 26 | admin-receipt-preview | admin orders page with "Preview Nota" modal |
| 27 | promotions-module | `014`, promotion API, promo discount in totals, POS selection, admin page |
| 28 | shift-system | `015` + partial unique index, shift API, kasir shift page |
| 29 | reports-extended | DatePeriodFilter, sales/transactions/invoices/shifts reports + pages |

## Post-construction eras & sprints

| Era / Sprint | Commit | What shipped |
|---|---|---|
| Payment capture + daily cash position | `705a3d8` | `016_payments.sql`; "Laporan Posisi Harian" report |
| WhatsApp (v1.4) | `eb00107` | `017_message_templates.sql`, `018_notification_log.sql`; admin template module; provider-agnostic sender (scaffold, **disabled by default**) — see [`08-ops.md`](./08-ops.md) |
| QoL A–E | `3534ccc` | toast errors, membership visibility, notification-log UI, pagination, tracking polish |
| QoL F–H | `b3b36a3` | secure `/track/t/:token` (opaque UUID) + `TrackOrderView`; integration test suite (`buildApp` factory, `global-setup`, 19 tests) |
| QoL Sprint I | `9d2e254` | ESLint setup; **order-transaction hardening**; **global error handler**; **env validation**; **`/ready`**; toasts/skeletons UX; service + integration test backfill; **postgres.js DATE fix** (`dateOnly()`) |
| Tier 4.3 frontend tests | `d643478` | first web test runner (Vitest + jsdom); focused unit tests over POS money math + offline sync + pure helpers; CI web-test step |

## Out of scope (per PRD)

Online payment gateway; **live** WhatsApp delivery (scaffold only until a provider adapter is
wired); native mobile app; loyalty points beyond membership. See [`docs/PRD.md`](../PRD.md) §6.

---

*Sources / canonical refs:* [`aidlc-docs/aidlc-state.md`](../../aidlc-docs/aidlc-state.md)
(units 01–29), `git log` (`705a3d8`, `eb00107`, `3534ccc`, `b3b36a3`, `9d2e254`, `d643478`),
[`docs/PRD.md`](../PRD.md) §4 + §6.
