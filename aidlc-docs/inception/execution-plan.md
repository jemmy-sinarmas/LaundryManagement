# Execution Plan — Laundry Palu
Approved: 2026-06-06
Reconciled: 2026-06-07 — all 16 units COMPLETE; see `aidlc-docs/aidlc-state.md` (source of truth).

## Overview
16 construction units covering backend (Batches 1–7) then frontend (Batches 8–16).
Backend is recommended to be complete before starting frontend so the API is testable.
Batches 4–7 can be worked in parallel if needed.

---

## Units

### 01 — monorepo-scaffold
**Status:** COMPLETE

**Key output files:**
- `package.json` (root, with workspaces: ["apps/*","packages/*"])
- `apps/web/package.json`, `apps/api/package.json`, `packages/shared/package.json`
- `tsconfig.json` (root + per-app)
- `.gitignore`
- `packages/shared/src/types.ts` — TypeScript interfaces for all domain entities
- `packages/shared/src/constants.ts` — ORDER_STATUSES, MEMBERSHIP_TYPES, ITEM_TYPES, EXPENSE_LEVELS

**Done when:**
- `npm install` completes without errors
- `tsc --noEmit` passes in `packages/shared`

---

### 02 — database-foundation
**Status:** COMPLETE

**Key output files:**
- `apps/api/migrations/001_init.sql` — full schema (identical to `docs/database/schema.sql`)
- `apps/api/migrations/run.ts` — migration runner (tracks applied in `schema_migrations` table)
- `apps/api/src/plugins/db.ts` — postgres.js pool decorated onto Fastify as `fastify.db`
- `apps/api/src/server.ts` — Fastify entry, registers all plugins, listens on PORT
- `apps/api/package.json` — scripts: dev, build, test, typecheck, migrate, seed, db:reset

**Done when:**
- `npm run migrate` creates all tables in PostgreSQL
- `npm run seed` inserts sample data (7 customers, 5 orders, etc.)
- Server starts on :4000 without errors

---

### 03 — auth-users-api
**Status:** COMPLETE

**Key output files:**
- `apps/api/src/plugins/auth.ts` — JWT plugin, HTTP-only SameSite=Strict cookie
- `apps/api/src/repositories/user.repo.ts`
- `apps/api/src/services/user.service.ts`
- `apps/api/src/routes/auth/` — POST /auth/login, DELETE /auth/logout
- `apps/api/src/routes/users/` — CRUD (Admin only)
- `apps/api/src/schemas/user.schema.ts`
- `apps/api/tests/unit/user.service.test.ts`

**Done when:**
- `POST /api/v1/auth/login` with admin/password123 returns JWT cookie and `{user:{id,nama,role}}`
- Kasir cannot access `/api/v1/users` (403)
- Unit tests pass; password never returned in any response

---

### 04 — customer-item-membership-api
**Status:** COMPLETE

**Key output files:**
- `repos/customer.repo.ts`, `services/customer.service.ts`, `routes/customers/`
- `repos/item.repo.ts`, `services/item.service.ts`, `routes/items/`
- `repos/membership.repo.ts`, `services/membership.service.ts`, `routes/membership/`
- `tests/unit/membership.service.test.ts`

**Done when:**
- All CRUD endpoints return correct data and correct HTTP codes
- Membership validation tests pass: active periodik=10% discount, expired periodik=flagged, paket_kg low balance=warning, paket_kg normal=no discount
- Item soft-delete sets `is_active=false` only

---

### 05 — orders-pos-api
**Status:** COMPLETE

**Key output files:**
- `utils/invoice.ts` — `generateInvoiceNo(db)` → `INV-YYYYMMDD-NNNN`
- `repos/order.repo.ts`, `services/order.service.ts`
- `routes/orders/` — POST, GET, PATCH /:id/status
- `routes/tracking/` — GET /track/:invoiceNo and /track/phone/:noHp (no auth)
- `schemas/order.schema.ts`
- `tests/unit/order.service.test.ts`

**Done when:**
- `POST /api/v1/orders` with periodik customer applies 10% discount correctly
- `PATCH /orders/:id/status` rejects out-of-sequence and backward transitions (400)
- `GET /api/v1/track/:invoiceNo` works without auth cookie
- Unit tests cover all business rule branches

---

### 06 — expenses-inventory-api
**Status:** COMPLETE

**Key output files:**
- `utils/fifo.ts` — `calculateFifoAverage(currentQty, currentAvg, inQty, inPrice): number`
- `repos/expense_category.repo.ts`, `repos/expense.repo.ts`, `services/expense.service.ts`, `routes/expenses/`, `routes/expense-categories/`
- `repos/inventory.repo.ts`, `services/inventory.service.ts`, `routes/inventory/`
- `tests/unit/inventory.service.test.ts`

**Done when:**
- FIFO average recalculates correctly after `recordPurchase` (unit test)
- Expense with `inventory_item_id` deducts stock on creation
- `getLowStockItems` returns only items where `qty_saat_ini <= stok_minimum`

---

### 07 — reports-api
**Status:** COMPLETE

**Key output files:**
- `repos/report.repo.ts` — all aggregation queries
- `services/report.service.ts`
- `routes/reports/` — dashboard, daily, monthly, income-statement, inventory

**Done when:**
- Dashboard endpoint returns: revenue_today, revenue_this_week, revenue_this_month, orders_by_status, top_5_customers, low_stock_items
- Income statement math: revenue - variable_costs - fixed_costs = net_profit
- All routes return 403 for Kasir role

---

### 08 — nextjs-foundation
**Status:** COMPLETE

**Key output files:**
- `apps/web/next.config.js`, `apps/web/tailwind.config.js`
- `apps/web/src/i18n/id.json` (Bahasa Indonesia default), `en.json`
- `apps/web/src/lib/api.ts`, `lib/auth.ts`, `lib/utils.ts`
- `apps/web/src/store/authStore.ts` (Zustand), `store/posStore.ts` (Zustand + IndexedDB)
- `apps/web/src/components/layout/Sidebar.tsx`, `Header.tsx`, `BottomNav.tsx`
- `apps/web/src/app/middleware.ts`
- `apps/web/src/app/layout.tsx`, `app/(admin)/layout.tsx`, `app/(kasir)/layout.tsx`

**Done when:**
- `npm run build` passes with no TypeScript errors
- Unauthenticated requests to `/dashboard` redirect to `/login`
- Requests to `/track/*` are NOT redirected (public)
- `formatIDR(63000)` returns `'Rp 63.000'`

---

### 09 — auth-users-ui
**Status:** COMPLETE

**Key output files:**
- `app/(auth)/login/page.tsx`
- `app/(admin)/users/page.tsx`
- `hooks/useUsers.ts`

**Done when:**
- Login with admin/password123 redirects to `/dashboard`
- Login with wrong credentials shows error toast
- User list table renders with correct badges
- Create user dialog submits and table updates

---

### 10 — customer-membership-ui
**Status:** COMPLETE

**Key output files:**
- `app/(admin)/customers/page.tsx`, `customers/[id]/page.tsx`
- `components/membership/MembershipBadge.tsx`, `MembershipForm.tsx`
- `app/(admin)/membership/page.tsx`
- `hooks/useCustomers.ts`

**Done when:**
- Search by phone `081234567001` returns Andi Pratama
- Andi's badge shows "Periodik Aktif" (green)
- Rina's badge shows red warning (sisa_kg = 2.0, below 5kg threshold)
- New membership form submits and membership card updates

---

### 11 — pos-interface
**Status:** COMPLETE

**Key output files:**
- `app/(kasir)/pos/page.tsx`
- `app/(kasir)/orders/page.tsx`
- `components/invoice/PrintableInvoice.tsx`
- `hooks/usePOS.ts`, `hooks/useOfflineSync.ts`

**Done when:**
- Full POS flow: select customer → add kiloan item with weight → discount shown for periodik member → "Buat Pesanan" creates order → invoice modal opens with QR code
- window.print() is triggered when print button clicked
- With network disabled: order saves to posStore offline queue
- On reconnect: offline queue syncs automatically

---

### 12 — items-expense-ui
**Status:** COMPLETE

**Key output files:**
- `app/(admin)/items/page.tsx`
- `app/(admin)/expenses/page.tsx`, `expenses/categories/page.tsx`
- `components/expenses/ExpenseForm.tsx`
- `hooks/useItems.ts`, `hooks/useExpenses.ts`

**Done when:**
- Deactivating an item sets `is_active=false` (item moves to inactive list)
- Expense quick-entry with inventory link shows updated stock preview
- Expense appears in list after submission

---

### 13 — inventory-ui
**Status:** COMPLETE

**Key output files:**
- `app/(admin)/inventory/page.tsx`
- `components/inventory/StockAlert.tsx`, `TransactionHistory.tsx`
- `hooks/useInventory.ts`

**Done when:**
- Low-stock alert banner shows items below minimum
- Masuk transaction increases `qty_saat_ini` and updates FIFO avg displayed
- Keluar transaction decreases `qty_saat_ini`
- Transaction history shows timeline correctly

---

### 14 — reports-dashboard-ui
**Status:** COMPLETE

**Key output files:**
- `app/(admin)/dashboard/page.tsx`
- `app/(admin)/reports/daily/page.tsx`
- `app/(admin)/reports/monthly/page.tsx`
- `app/(admin)/reports/income-statement/page.tsx`
- `hooks/useReports.ts`

**Done when:**
- Dashboard loads 4 KPI cards + order status counts + expense/revenue chart
- Income statement P&L rows sum correctly (visible in UI)
- Charts render without console errors (Recharts)
- Print layout renders correctly (`window.print()` on daily report)

---

### 15 — tracking-page
**Status:** COMPLETE

**Key output files:**
- `app/track/[invoiceNo]/page.tsx`
- `app/track/page.tsx`

**Done when:**
- Navigating to `/track/INV-20250605-0001` shows Dewi's order status "Siap Diambil" with full timeline
- "Pakaian Anda Siap Diambil!" banner visible
- Phone number lookup shows list of orders for that customer
- Navigating to `/track/NONEXISTENT` shows 404 card
- Page works without login cookie

---

### 16 — pwa-production
**Status:** COMPLETE

**Key output files:**
- `apps/web/public/manifest.json`
- Updated `apps/web/next.config.js` (next-pwa enabled)
- Updated `docker-compose.yml` (app service added)
- `apps/web/public/offline.html`

**Done when:**
- `npm run build` generates `apps/web/public/sw.js`
- Lighthouse PWA audit score ≥ 80
- App installable on Android Chrome ("Add to Home Screen" prompt appears)
- Offline queue syncs orders on reconnect (verifiable in Network DevTools)
- `docker compose up` starts postgres and both apps successfully

---

## v1.1 Extension — Multi-Branch + Pickup QR
Approved: 2026-06-09

Units 17–24 implement multi-branch support and encrypted pickup QR validation.
Execute sequentially — unit 17 (branches table) must be COMPLETE before any branch_id FK migrations.

---

### 17 — branches-db-api
**Status:** PENDING

**Key output files:**
- `apps/api/migrations/007_branches.sql` — CREATE TABLE branches
- `apps/api/src/repositories/branch.repo.ts`
- `apps/api/src/services/branch.service.ts`
- `apps/api/src/routes/branches/index.ts`
- `apps/api/src/schemas/branch.schema.ts`
- `packages/shared/src/types.ts` — add `Branch` interface

**Done when:**
- `GET /api/v1/branches` returns list of branches (Admin only)
- `POST /api/v1/branches` creates branch; duplicate `kode` returns 409
- `PATCH /api/v1/branches/:id` updates nama/alamat/is_active
- `tsc --noEmit` and unit tests pass

---

### 18 — branch-user-assignment
**Status:** PENDING

**Key output files:**
- `apps/api/migrations/008_user_branch.sql` — ALTER TABLE users ADD COLUMN branch_id
- `apps/api/src/plugins/auth.ts` — JWT payload includes branch_id
- `apps/api/src/repositories/user.repo.ts` — include branch_id in queries
- `apps/api/src/services/user.service.ts` — validate branch_id on kasir creation
- `apps/api/src/routes/users/index.ts` — accept branch_id in create/update
- `apps/api/src/schemas/user.schema.ts` — add branch_id field
- `apps/web/src/app/(admin)/users/page.tsx` — branch selector in create dialog

**Done when:**
- Login as kasir returns JWT with correct `branch_id`
- Login as admin returns JWT with `branch_id: null`
- Creating a kasir without branch_id returns 400
- `tsc --noEmit` passes

---

### 19 — branch-items
**Status:** PENDING

**Key output files:**
- `apps/api/migrations/009_item_branch.sql` — ALTER TABLE items ADD COLUMN branch_id
- Update `apps/api/src/repositories/item.repo.ts` — filter by branch_id
- Update `apps/api/src/services/item.service.ts`
- Update `apps/api/src/routes/items/index.ts`
- Update `apps/web/src/app/(admin)/items/page.tsx`

**Done when:**
- Kasir-PLW can only see PLW items via `GET /api/v1/items`
- Admin sees all items unless `?branch_id=` filter is applied
- `tsc --noEmit` passes

---

### 20 — branch-inventory
**Status:** PENDING

**Key output files:**
- `apps/api/migrations/010_inventory_branch.sql` — ALTER TABLE inventory_items ADD COLUMN branch_id
- Update `apps/api/src/repositories/inventory.repo.ts`
- Update `apps/api/src/services/inventory.service.ts`
- Update `apps/api/src/routes/inventory/index.ts`
- Update `apps/web/src/app/(admin)/inventory/page.tsx`
- Update `apps/web/src/hooks/useInventory.ts`

**Done when:**
- Inventory list scoped to branch for kasir
- Low-stock alerts scoped to branch
- `tsc --noEmit` passes

---

### 21 — branch-orders-pos
**Status:** PENDING

**Key output files:**
- `apps/api/migrations/011_order_branch.sql` — ALTER TABLE orders ADD COLUMN branch_id
- `apps/api/src/utils/invoice.ts` — update to `generateInvoiceNo(branchKode, branchId, db)` → `INV-[KODE]-YYYYMMDD-NNNN`
- Update `apps/api/src/repositories/order.repo.ts`
- Update `apps/api/src/services/order.service.ts`
- Update `apps/api/src/routes/orders/index.ts`
- Update `apps/web/src/app/(kasir)/pos/page.tsx` — branch_id auto from JWT

**Done when:**
- POS order creation tags order with `branch_id` from JWT
- Invoice number format is `INV-[KODE]-YYYYMMDD-NNNN`
- Sequence is per-branch per day (two branches on same day get independent NNNN)
- Kasir orders list shows only own-branch orders
- `tsc --noEmit` and order service unit tests pass

---

### 22 — branch-expenses
**Status:** PENDING

**Key output files:**
- `apps/api/migrations/012_expense_branch.sql` — ALTER TABLE expenses ADD COLUMN branch_id
- Update `apps/api/src/repositories/expense.repo.ts`
- Update `apps/api/src/services/expense.service.ts`
- Update `apps/api/src/routes/expenses/index.ts`
- Update `apps/web/src/app/(admin)/expenses/page.tsx`
- Update `apps/web/src/hooks/useExpenses.ts`

**Done when:**
- Expense creation auto-assigns branch_id from JWT
- Expense list scoped to branch for kasir
- `tsc --noEmit` passes

---

### 23 — branch-reports-ui
**Status:** PENDING

**Key output files:**
- Update `apps/api/src/repositories/report.repo.ts` — all queries accept optional branch_id param
- Update `apps/api/src/services/report.service.ts`
- Update `apps/api/src/routes/reports/index.ts` — accept `?branch_id=` query param
- Update `apps/web/src/app/(admin)/dashboard/page.tsx` — branch filter dropdown
- Update `apps/web/src/app/(admin)/reports/` pages — branch filter
- New: `apps/web/src/app/(admin)/branches/page.tsx` — branch CRUD UI
- Update `apps/web/src/hooks/useReports.ts`

**Done when:**
- Admin dashboard shows combined revenue across all branches by default
- Branch filter dropdown changes all metrics to selected branch
- Branch management page allows create / toggle active
- `tsc --noEmit` and `next build` pass

---

### 24 — pickup-qr-validation
**Status:** PENDING

**Key output files:**
- `apps/api/migrations/013_order_pickup_token.sql` — ALTER TABLE orders ADD COLUMN pickup_token UUID DEFAULT gen_random_uuid() UNIQUE
- Update `apps/api/src/repositories/order.repo.ts` — add `getOrderByPickupToken(token)`
- Update `apps/api/src/services/order.service.ts` — add `validatePickup(token, userId)` with `siap_diambil` guard
- Update `apps/api/src/routes/orders/index.ts` — GET + PATCH `/pickup/:token`
- Update `apps/api/src/utils/invoice.ts` — `buildPickupUrl(pickupToken, baseUrl)`
- Update `apps/web/src/components/invoice/PrintableInvoice.tsx` — QR encodes `/pickup/[pickup_token]`
- New: `apps/web/src/app/(kasir)/pickup/[token]/page.tsx`
- i18n keys in `id.json` + `en.json`: `pickup.title`, `pickup.validate`, `pickup.success`, `pickup.not_ready`, `pickup.already_done`

**Done when:**
- Printed receipt QR encodes `/pickup/[uuid]` — not `/track/[invoiceNo]`
- `GET /api/v1/orders/pickup/:token` returns 404 for invalid token
- `PATCH /api/v1/orders/pickup/:token/complete` returns 400 if status is not `siap_diambil`
- Kasir navigates to `/pickup/[token]` → correct status-gated UI renders
- Order moves to `selesai` on confirm
- `tsc --noEmit`, unit tests, and `next build` pass
