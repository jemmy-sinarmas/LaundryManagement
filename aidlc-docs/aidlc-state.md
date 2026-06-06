# AI-DLC State — Laundry Palu
Last updated: 2026-06-06

## Current Phase: INCEPTION complete → CONSTRUCTION ready

## Inception Stages
| Stage | Status |
|---|---|
| Workspace Detection | COMPLETE |
| Requirements Analysis | COMPLETE |
| Story Decomposition | COMPLETE |
| Execution Plan | COMPLETE |

---

## Construction Units

| # | Unit | Status | Notes |
|---|---|---|---|
| 01 | monorepo-scaffold | COMPLETE | npm install + tsc --noEmit both pass |
| 02 | database-foundation | COMPLETE | tsc passes; migration + server ready; DB test requires Docker |
| 03 | auth-users-api | COMPLETE | pglite adapter (no native deps); JWT auth; user CRUD; 8/8 unit tests pass; login/RBAC verified |
| 04 | customer-item-membership-api | COMPLETE | customer/item/membership CRUD; validateMembership pure fn; 25/25 tests pass; vitest alias added for shared constants |
| 05 | orders-pos-api | COMPLETE | order creation w/ membership integration; forward-only status transitions; invoice generation; tracking routes (no auth); 40/40 tests pass |
| 06 | expenses-inventory-api | COMPLETE | expense-category + expense + inventory CRUD; FIFO average cost; stock deduction on expense; getLowStockItems; 55/55 tests pass; CI/CD GitHub Actions + .gitignore added |
| 07 | reports-api | COMPLETE | 5 admin-only report endpoints; 2 pure fns (buildIncomeStatement, countNewReturningCustomers); 65/65 tests pass |
| 08 | nextjs-foundation | COMPLETE | next build clean; middleware redirects /dashboard→/login; /track/* public; formatIDR + Zustand stores + i18n shell; PM2 web entry added |
| 09 | auth-users-ui | COMPLETE | Login form → redirects on success, shows error on bad creds; Users table with role/status badges + create dialog; build clean |
| 10 | customer-membership-ui | COMPLETE | Customer list+search, detail page, MembershipBadge (periodik/paket_kg/warning), MembershipForm (discriminated union); fixed next.config.js webpack extensionAlias for shared package value imports |
| 11 | pos-interface | COMPLETE | POS page (customer search, items grid, cart, discount display, submit+offline queue); orders page (status advance); PrintableInvoice with QR code + window.print(); useOfflineSync syncs on reconnect |
| 12 | items-expense-ui | COMPLETE | Items table (active/inactive toggle + create); ExpenseForm (inventory link + stock preview); expenses list + quick-entry panel; categories page; build clean 12 routes |
| 13 | inventory-ui | COMPLETE | StockAlert banner, TransactionHistory timeline, inventory page (table + FIFO avg + stock value + Catat Masuk modal + Riwayat modal + create); build clean 13 routes |
| 14 | reports-dashboard-ui | COMPLETE | Dashboard (3 KPI cards + status badges + revenue bar chart + top-5 + low-stock); daily report (orders table + totals + print); monthly (bar+pie charts + new/returning); income statement (P&L rows + print); Recharts; build clean 16 routes |
| 15 | tracking-page | COMPLETE | Public search page (invoice/phone toggle); detail page (status stepper, "Siap Diambil" banner, timeline, items, 404 card, bilingual toggle); no auth required; build clean 17 routes |
| 16 | pwa-production | COMPLETE | @ducanh2912/next-pwa; sw.js generated; manifest.json + SVG icons; offline.html fallback; Dockerfile.api + Dockerfile.web; docker-compose.yml (postgres+api+web); build clean 17 routes |

---

## Context Anchors
> Read these references at the start of every batch session.

| What | Where |
|---|---|
| Business requirements | `docs/PRD.md` §4 |
| Key business rules (DO NOT change) | `AGENTS.md` → "Key Business Rules" |
| DB schema (canonical) | `docs/database/schema.sql` |
| ERD | `docs/database/ERD.md` |
| API contract + deployment | `docs/ARCHITECTURE.md` §5 + §8 |
| Layering rule | Routes → Services → Repositories → DB (never skip) |
| Money rule | `BIGINT` whole IDR in DB; `Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR'})` in UI |
| Soft-delete rule | `is_active=false` only; never hard-delete customers/items/inventory |
| Order lifecycle | `diterima→dicuci→dikeringkan→dibungkus→siap_diambil→selesai` (forward-only, no skipping) |
| Invoice format | `INV-YYYYMMDD-NNNN` (server-side daily sequence) |
| Membership discount | Periodik active = 10% discount; Paket Kg = deduct `sisa_kg`, no price discount |
| Public route | `/track/*` requires NO auth — excluded from middleware |
| FIFO formula | `floor(((currentQty * currentAvg) + (inQty * inPrice)) / (currentQty + inQty))` |

---

## Batch Start Protocol (run at top of every session)

1. Read this file — confirm which unit is next (first PENDING)
2. Mark that unit IN_PROGRESS in this file
3. Read `aidlc-docs/inception/execution-plan.md` — check "Done When" criteria for the unit
4. Read `docs/ARCHITECTURE.md` + `docs/database/schema.sql`
5. Append a start entry to `aidlc-docs/audit.md`

## Batch End Protocol (run before ending session)

1. Run `npm run typecheck && npm run test` (all green)
2. Mark unit COMPLETE in this file (update Notes with any deviations)
3. Append completion entry to `aidlc-docs/audit.md`
4. Ask human to confirm before proceeding to next unit
