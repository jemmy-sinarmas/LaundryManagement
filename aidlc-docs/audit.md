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
| 2026-06-07 | Agent | Docs reconciled | Flipped all 16 unit statuses in inception/execution-plan.md PENDING→COMPLETE to match aidlc-state.md (source of truth); added reconciliation banner; untracked generated PWA artifacts (sw.js, workbox-*.js, fallback-*.js) and added apps/web/.gitignore |
| 2026-06-08 | Agent | AWS Knowledge MCP configured | Created .kiro/settings/mcp.json (awslabs.aws-documentation-mcp-server via uvx); created .kiro/steering/aws-knowledge-mcp.md (always-on steering with AI-DLC phase guidance, project constraints, query templates); created docs/skills/aws-knowledge/SKILL.md; registered skill in AGENTS.md |
| 2026-06-08 | Agent | Kiro hooks created | Created 4 hooks: typecheck-on-save (fileEdited → npm run typecheck), test-on-service-change (fileEdited *.service.ts/*.repo.ts → vitest --run), migration-guard (fileEdited migrations/*.sql → warns on already-run files), audit-log-reminder (agentStop → append audit.md) |
| 2026-06-08 | Agent | Project spec generated | Created .kiro/specs/laundry-palu-v1/requirements.md (11 requirements + non-functional invariants), design.md (as-built architecture, layer map, DB summary, API route table, key algorithms, security controls, deployment runbook), tasks.md (v1.0 completion record + v1.1 backlog including offline sync duplicate invoice_no risk) |
| 2026-06-08 | Agent | Bug fix: @laundry-palu/shared missing exports at runtime | packages/shared/package.json exports pointed at dist/ (never built); tsx resolves via package.json not tsconfig paths so PAKET_KG_LOW_BALANCE_THRESHOLD was not found; fixed by pointing main/exports at src/index.ts; confirmed with npx tsx smoke test; committed as fix: point @laundry-palu/shared exports at src/ instead of dist/ |
| 2026-06-08 | Agent | Hooks: lint-on-save and build-on-agent-stop added | Created 2 additional hooks bringing total to 6; all committed in chore commit |
| 2026-06-08 | Agent | Full build verified green | npm run build --workspaces: api tsc clean, shared tsc clean, Next.js 14 build clean — 17 routes, 0 errors |
| 2026-06-08 | Agent | Migrated npm workspaces → pnpm | Added pnpm-workspace.yaml; set packageManager: pnpm@9.1.0; changed @laundry-palu/shared dep to workspace:* in api + web; deleted package-lock.json; ran pnpm install; updated AGENTS.md commands and spec design.md runbook |
| 2026-06-08 | Agent | Fix: hooks failing with npm workspace error | Kiro hook runner uses npm context; changed all hook commands from pnpm run <cmd> to pnpm --filter @laundry-palu/<app> run <cmd> to bypass workspace resolution |
| 2026-06-08 | Agent | Fix: Next.js standalone EPERM symlink error on Windows with pnpm | Added .npmrc with package-import-method=copy; made next.config.js output:'standalone' conditional on NEXT_STANDALONE=true env var; added ENV NEXT_STANDALONE=true to Dockerfile.web; build now passes locally (17 routes clean) while Docker still produces standalone output |
| 2026-06-08 | Agent | Fix: pnpm dev failing — root scripts still used npm --workspace= | Updated package.json scripts (dev, build, test, typecheck, lint, lint:fix) to use pnpm --filter @laundry-palu/<pkg> run <cmd>; confirmed pnpm run typecheck passes; committed |
| 2026-06-08 | Agent | Fix: @laundry-palu/shared exports broken on Node 24 + tsx + pnpm symlinks | Root cause: Node 24 ESM loader resolves pnpm symlinks before tsx hooks apply, so ./constants.js re-exports inside index.ts fail; fix: build shared to real JS dist/; package exports point at dist/index.js; committed dist/ to git (un-ignored); dev script pre-builds shared |
