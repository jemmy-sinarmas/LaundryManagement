# Audit Log — Laundry Palu
> Append-only. Never edit existing rows. Add new rows at the bottom.

| Timestamp | Actor | Action | Detail |
|---|---|---|---|
| 2026-06-06 | Human | Project requirements provided | Read PRD.md, ARCHITECTURE.md, AGENTS.md, README.md, 002_seed.sql |
| 2026-06-06 | Human | 16-batch execution plan approved | Batches 1–16 covering full-stack PWA build |
| 2026-06-06 | Agent | Repository structure initialized | Moved PRD.md + ARCHITECTURE.md → docs/; moved 002_seed.sql → apps/api/migrations/; created CLAUDE.md, .env.example, docker-compose.yml, docs/database/schema.sql, docs/database/ERD.md, aidlc-docs/ scaffolding |
| 2026-06-06 | Agent | Batch 01 started | Unit 01 monorepo-scaffold marked IN_PROGRESS |
| 2026-06-06 | Agent | Batch 01 complete | Created package.json (root+apps+packages), tsconfig files, .gitignore, packages/shared/src/{types,constants,index}.ts; npm install + tsc --noEmit both passed |
| 2026-06-06 | Agent | Batch 02 started | Unit 02 database-foundation marked IN_PROGRESS |
| 2026-06-06 | Agent | Batch 02 complete | Created migrations/001_init.sql (FK-ordered), migrations/run.ts, src/plugins/{db,cors}.ts, src/server.ts, apps/api/.env; added fastify-plugin dep; fixed tsconfig rootDir to '.'; tsc --noEmit passes |
| 2026-06-06 | Agent | Batch 03 started | Unit 03 auth-users-api + SQLite adapter marked IN_PROGRESS |
| 2026-06-06 | Agent | Batch 03 complete | Replaced better-sqlite3 (no native compile) with @electric-sql/pglite WASM; created src/lib/{db-types,sqlite-adapter}.ts, src/plugins/auth.ts, src/repositories/user.repo.ts, src/services/user.service.ts, src/routes/{auth,users}/index.ts, src/schemas/user.schema.ts, tests/unit/user.service.test.ts; fixed seed UUID hex validity + bcrypt hash; 8/8 unit tests pass; POST /auth/login returns JWT cookie; RBAC 401/403 verified |
| 2026-06-06 | Agent | Batch 04 started | Unit 04 customer-item-membership-api marked IN_PROGRESS |
| 2026-06-06 | Agent | Batch 04 complete | Created 9 source files (3 schemas, 3 repos, 3 services), 3 route files, 3 test files; updated server.ts + vitest.config.ts (alias for shared constants); 25/25 unit tests pass; tsc --noEmit clean |
| 2026-06-06 | Agent | Batch 05 started | Unit 05 orders-pos-api marked IN_PROGRESS |
| 2026-06-06 | Agent | Batch 05 complete | Created utils/invoice.ts, order schema/repo/service, routes/orders, routes/tracking (no auth); updated server.ts; 40/40 unit tests pass; tsc --noEmit clean |
| 2026-06-06 | Agent | Batch 06 started | Unit 06 expenses-inventory-api marked IN_PROGRESS |
| 2026-06-06 | Agent | Batch 06 complete | Created utils/fifo.ts, 3 schemas, 3 repos, 2 services, 3 routes; updated server.ts; added .github/workflows/{ci,deploy}.yml, ecosystem.config.cjs, updated .gitignore (pglite-data/); 55/55 tests pass; tsc --noEmit clean |
| 2026-06-06 | Agent | Batch 07 started | Unit 07 reports-api marked IN_PROGRESS |
| 2026-06-06 | Agent | Batch 07 complete | Created src/types/reports.ts, report.repo.ts, report.service.ts, routes/reports/index.ts; updated server.ts; 65/65 tests pass; tsc --noEmit clean |
| 2026-06-06 | Agent | Batch 08 started | Unit 08 nextjs-foundation marked IN_PROGRESS |
| 2026-06-06 | Agent | Batch 08 complete | Created next.config.js, tailwind config, postcss, globals.css, i18n JSONs, langStore, authStore, posStore, api.ts, auth.ts, utils.ts, middleware.ts, app shell (layout+pages), layout components (Sidebar/Header/BottomNav); updated ecosystem.config.cjs; npm run build clean |
| 2026-06-06 | Agent | Batch 09 started | Unit 09 auth-users-ui marked IN_PROGRESS |
| 2026-06-06 | Agent | Batch 09 complete | Created hooks/useUsers.ts, real login/page.tsx (redirect + error state), (admin)/users/page.tsx (table + create dialog + toggle active); build clean |
| 2026-06-06 | Agent | Batch 10 started | Unit 10 customer-membership-ui marked IN_PROGRESS |
| 2026-06-06 | Agent | Batch 10 complete | Created hooks/useCustomers.ts, MembershipBadge.tsx, MembershipForm.tsx, customers/page.tsx (list+search+create), customers/[id]/page.tsx (detail+membership card); fixed next.config.js webpack extensionAlias; build clean |
| 2026-06-06 | Agent | Batch 11 started | Unit 11 pos-interface marked IN_PROGRESS |
| 2026-06-06 | Agent | Batch 11 complete | Added react-qr-code; updated posStore (pendingOrders); created hooks/usePOS.ts, hooks/useOfflineSync.ts, components/invoice/PrintableInvoice.tsx, (kasir)/pos/page.tsx, (kasir)/orders/page.tsx; build clean 9 routes |
| 2026-06-06 | Agent | Batch 12 started | Unit 12 items-expense-ui marked IN_PROGRESS |
| 2026-06-06 | Agent | Batch 12 complete | Created hooks/useItems.ts, hooks/useExpenses.ts, components/expenses/ExpenseForm.tsx, (admin)/items/page.tsx, (admin)/expenses/page.tsx, (admin)/expenses/categories/page.tsx; build clean 12 routes |
| 2026-06-06 | Agent | Batch 13 started | Unit 13 inventory-ui marked IN_PROGRESS |
| 2026-06-06 | Agent | Batch 13 complete | Created hooks/useInventory.ts, components/inventory/StockAlert.tsx, TransactionHistory.tsx, (admin)/inventory/page.tsx; build clean 13 routes |
| 2026-06-06 | Agent | Batch 14 started | Unit 14 reports-dashboard-ui marked IN_PROGRESS |
| 2026-06-06 | Agent | Batch 14 complete | Added recharts; created hooks/useReports.ts, dashboard/page.tsx, reports/daily/page.tsx, reports/monthly/page.tsx, reports/income-statement/page.tsx; build clean 16 routes |
| 2026-06-06 | Agent | Batch 15 started | Unit 15 tracking-page marked IN_PROGRESS |
| 2026-06-06 | Agent | Batch 15 complete | Created track/page.tsx (search by invoice/phone), track/[invoiceId]/page.tsx (status stepper + banner + 404 + bilingual); build clean 17 routes |
| 2026-06-06 | Agent | Batch 16 started | Unit 16 pwa-production marked IN_PROGRESS |
| 2026-06-06 | Agent | Batch 16 complete | Added @ducanh2912/next-pwa; created manifest.json, icons/, offline.html, Dockerfile.api, Dockerfile.web; updated next.config.js (withPWA), layout.tsx (manifest meta), docker-compose.yml (+api+web services); sw.js confirmed generated; all 17 routes build clean |
