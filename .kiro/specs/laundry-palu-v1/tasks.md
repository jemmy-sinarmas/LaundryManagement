# Laundry Palu — Task Tracker
> v1.0 is COMPLETE (16/16 construction units shipped).
> Use this file to track future enhancements, bugs, and v1.1 work.
> Add tasks below following the format. Completed tasks stay here for reference.

---

## How to Add a Task

```
- [ ] **[CATEGORY]** Short description
  - Context: why this is needed
  - Touches: list of files/modules likely affected
  - Blocked by: any dependency
```

Categories: `BUG`, `ENHANCEMENT`, `INFRA`, `SECURITY`, `PERF`, `DOCS`

---

## v1.0 Completed (Reference)

- [x] **[INFRA]** Unit 01 — monorepo-scaffold
- [x] **[INFRA]** Unit 02 — database-foundation
- [x] **[INFRA]** Unit 03 — auth-users-api
- [x] **[INFRA]** Unit 04 — customer-item-membership-api
- [x] **[INFRA]** Unit 05 — orders-pos-api
- [x] **[INFRA]** Unit 06 — expenses-inventory-api
- [x] **[INFRA]** Unit 07 — reports-api
- [x] **[INFRA]** Unit 08 — nextjs-foundation
- [x] **[INFRA]** Unit 09 — auth-users-ui
- [x] **[INFRA]** Unit 10 — customer-membership-ui
- [x] **[INFRA]** Unit 11 — pos-interface
- [x] **[INFRA]** Unit 12 — items-expense-ui
- [x] **[INFRA]** Unit 13 — inventory-ui
- [x] **[INFRA]** Unit 14 — reports-dashboard-ui
- [x] **[INFRA]** Unit 15 — tracking-page
- [x] **[INFRA]** Unit 16 — pwa-production

---

## Backlog (v1.1 and beyond)

> These are items from PRD §6 "Out of Scope" and known gaps. Prioritise as needed.

- [ ] **[ENHANCEMENT]** WhatsApp notification on status change
  - Context: PRD v1.1 item. Notify customer when order moves to `siap_diambil`.
  - Touches: `order.service.ts`, new `notification.service.ts`, env var for WA API token
  - Blocked by: WA Business API account

- [ ] **[ENHANCEMENT]** AWS deployment — RDS + ECS Fargate
  - Context: Move off single VPS to managed AWS infrastructure for reliability.
  - Touches: `docker-compose.prod.yml`, new `infra/` CDK or CloudFormation stack, GitHub Actions OIDC deploy workflow
  - Blocked by: AWS account setup; use `aws-knowledge` skill + MCP during Architecture Review

- [ ] **[ENHANCEMENT]** S3 backup integration
  - Context: PRD §5 — "optional S3 integration" for pg_dump backups.
  - Touches: new cron/Lambda + S3 bucket policy; `aidlc-docs/operations/`

- [ ] **[SECURITY]** Rotate JWT secret via SSM Parameter Store
  - Context: Currently JWT_SECRET is a static .env value. Should pull from SSM on startup.
  - Touches: `apps/api/src/plugins/auth.ts`, new AWS SSM fetch on boot

- [ ] **[ENHANCEMENT]** Membership renewal flow UI
  - Context: Currently memberships are created but renewal (extending periodik, topping up paket_kg) needs a dedicated UX flow.
  - Touches: `customers/[id]/page.tsx`, `MembershipForm.tsx`, `membership.service.ts`

- [ ] **[PERF]** Add Redis caching for dashboard KPIs
  - Context: Dashboard aggregation queries could be cached for 60s to reduce DB load at peak.
  - Touches: `report.repo.ts`, new Redis plugin in Fastify

- [ ] **[DOCS]** Add Postman/Bruno collection for all API endpoints
  - Context: No API client collection exists yet. Useful for manual testing and onboarding.
  - Touches: new `docs/api/` folder

- [ ] **[BUG]** Verify offline sync handles duplicate invoice_no conflict
  - Context: If two devices create orders offline simultaneously and sync, `invoice_no` UNIQUE constraint may cause one to fail silently. Need conflict resolution strategy.
  - Touches: `hooks/useOfflineSync.ts`, `order.service.ts`

---

## Known Tech Debt

| Item | File | Priority |
|---|---|---|
| PGlite adapter used in tests — should switch to real PG for CI | `src/lib/sqlite-adapter.ts` | Medium |
| No integration tests for report endpoints | `tests/integration/` | Medium |
| i18n keys may be incomplete in `en.json` | `apps/web/src/i18n/en.json` | Low |
| No rate limiting on non-auth routes | `apps/api/src/server.ts` | Low |
