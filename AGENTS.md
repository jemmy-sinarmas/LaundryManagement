# AGENTS.md — Laundry Palu
> **Note:** `CLAUDE.md` is a symlink to this file. Only edit `AGENTS.md` — changes apply to both automatically.

---

## TL;DR for Agents

You are working on **Laundry Palu**, a bilingual (Bahasa Indonesia / English) PWA for managing a laundry business. Stack: **Next.js 14 frontend** + **Fastify 4 backend** + **PostgreSQL 15**. KISS, DRY, GSD. Never delete files without explicit permission. Always test after changes.

All non-trivial work follows the **AI-DLC three-phase lifecycle**: Inception → Construction → Operations. Adaptive execution — run only the stages that add value for the task at hand.

---

## Core Principles

| Principle | Meaning in this codebase |
|---|---|
| **KISS** | Prefer plain functions over classes. Prefer raw SQL over ORM abstractions. No premature abstractions. |
| **DRY** | Shared types live in `packages/shared/src/types.ts`. Never duplicate business logic between frontend and backend. |
| **GSD** | Get it working first, then refactor. A passing test beats perfect architecture. |
| **MECE** | Every file lives in exactly one logical place. No overlap between `services/`, `repositories/`, and `routes/`. |
| **No Hallucinations** | If you are unsure about a library API or SQL syntax, write a comment `// TODO: verify` and flag it. Never invent function signatures. |

---

## Directory Structure Quick Reference

```
laundry-palu/
├── AGENTS.md                   # AI agent instructions (you are here)
├── CLAUDE.md                   # Symlink → AGENTS.md
├── aidlc-docs/                 # AI-DLC generated artifacts (never hand-edit)
│   ├── aidlc-state.md          # Phase/stage progress tracker
│   ├── audit.md                # Full audit trail of all agent actions
│   ├── inception/              # Requirements, architecture, stories
│   └── construction/           # Design docs, test plans per unit
├── apps/
│   ├── web/                    # Next.js 14 PWA (frontend only, NO business logic)
│   └── api/                    # Fastify 4 (all business logic lives here)
│       ├── src/routes/         # HTTP handlers ONLY — delegate to services
│       ├── src/services/       # Business logic (pure functions, no HTTP awareness)
│       ├── src/repositories/   # SQL queries (no business logic)
│       └── migrations/         # Raw SQL migration files
├── packages/shared/            # Types and constants shared between web and api
└── docs/                       # PRD, ARCHITECTURE, skills
    └── skills/                 # Auto-trigger skill files (see Skills section)
```

**The single layering rule:** Routes → Services → Repositories → DB. Never skip a layer.

---

## AI-DLC Workflow

This project uses the **AI-Driven Development Life Cycle (AI-DLC)** methodology. Every non-trivial task runs through the three phases below. Use adaptive execution — only run the stages that add genuine value given the task complexity.

### State & Audit Files

Before starting any phase, check these two files:

- **`aidlc-docs/aidlc-state.md`** — current phase, stage statuses (PENDING / IN_PROGRESS / COMPLETE / SKIPPED), and extension configurations.
- **`aidlc-docs/audit.md`** — the complete audit trail. Log every significant agent action here with a timestamp and the user's raw input, exactly as provided.

> **CRITICAL:** Never approve a stage transition if a context compaction prompt has appeared. Context compaction can cause partial loss of prior instructions. Stop and notify the human.

---

### Phase 1 — INCEPTION (`aidlc-docs/inception/`)

**Purpose:** Align on *what* to build and *why* before any design or code begins.

**When to run:** Any new feature, module, or significant change. Skip for isolated bug fixes or trivial text/config changes.

#### Stages

| Stage | When | Output |
|---|---|---|
| Workspace Detection | ALWAYS | Scan codebase; identify affected modules, existing patterns, tech env |
| Reverse Engineering | CONDITIONAL — existing code touched | Document current behaviour before changing it |
| Requirements Analysis | ALWAYS | `aidlc-docs/inception/requirements.md` — functional + non-functional requirements, acceptance criteria |
| Architecture Review | CONDITIONAL — new tables, routes, or cross-module changes | Confirm alignment with `docs/ARCHITECTURE.md`; flag conflicts |
| Story Decomposition | ALWAYS for features | `aidlc-docs/inception/stories.md` — user stories with Definition of Done |
| Execution Plan | ALWAYS | `aidlc-docs/inception/execution-plan.md` — ordered list of Construction units |

#### Inception Rules
- Load `docs/PRD.md` and `docs/ARCHITECTURE.md` at the start of every Inception.
- Ask questions using the **numbered list format** — group related questions, max 3 per round. Wait for answers before proceeding.
- If new constraints surface (e.g. updated security policy, revised schema), load them and assess impact on the execution plan before proceeding.
- **Do not enter Construction without explicit human approval of `execution-plan.md`.**
- Log the human's approval verbatim in `aidlc-docs/audit.md`.

---

### Phase 2 — CONSTRUCTION (`aidlc-docs/construction/<unit-name>/`)

**Purpose:** Design, implement, and test each unit from the Inception execution plan.

**Execution model:** Construction is a **loop** — repeat the stages below for each unit in `execution-plan.md`. Complete one unit fully before starting the next.

#### Stages per Unit

| Stage | When | Output |
|---|---|---|
| Functional Design | ALWAYS | Business logic design (no framework/stack yet); domain rules only |
| NFR & Security Design | CONDITIONAL — auth, money, data exposure involved | Security model, input validation plan, rate limits |
| Infrastructure Design | CONDITIONAL — new DB tables, new API routes, new PWA pages | Schema delta, endpoint spec, component tree |
| Pre-Generation Validation | ALWAYS | Validate design against PRD + Architecture before writing any file |
| Code Generation | ALWAYS | Actual implementation following layer rules |
| Build & Test | ALWAYS | Run typecheck + tests; all must pass before unit is COMPLETE |

#### Construction Rules
- **Pre-Generation Validation is mandatory.** Never write a file without first confirming the design is consistent with `docs/PRD.md` and `docs/ARCHITECTURE.md`. Write validation result to `aidlc-docs/construction/<unit>/validation.md`.
- After Code Generation, immediately run:
  ```bash
  # From apps/api/
  npm run typecheck && npm run test

  # From apps/web/
  npm run typecheck && npm run build
  ```
- If tests fail, fix them **before marking the unit COMPLETE**. Never move to the next unit with a red build.
- Update `aidlc-docs/aidlc-state.md` after each stage.
- Ask: *"Unit `<name>` complete. Ready to proceed to next unit?"* — **do not proceed until confirmed.**

#### Layer Rules (enforced in Code Generation)
- **Routes** — thin. Validate input (Zod), call one service method, return response. Zero business logic.
- **Services** — pure functions. No `req`/`res` awareness. All business rules live here.
- **Repositories** — SQL only. No conditions, no calculations. Return raw rows or typed results.
- **Frontend** — no business logic. Calls API, renders state, handles UX interactions.

---

### Phase 3 — OPERATIONS (`aidlc-docs/operations/`)

**Purpose:** Deploy and run the application.

> **Status:** Operations is currently active for deployment guidance. Build/test activities remain in Construction.

#### Stages

| Stage | When | Output |
|---|---|---|
| Deployment Prep | On first production deploy | `aidlc-docs/operations/deploy-checklist.md` |
| Environment Validation | Before every prod deploy | Verify `.env` vars, DB migrations run, no failing tests |
| Post-Deploy Verification | After every deploy | Smoke test: login → POS → order → tracking page |

#### Operations Rules
- Never deploy with a failing test suite.
- Run `npm run db:migrate` before starting the app on a fresh environment.
- Log every production deployment in `aidlc-docs/audit.md` with timestamp and deployer.
- The public `/track/[invoiceNo]` route must always be tested post-deploy — it requires no auth and is customer-facing.

---

### Adaptive Execution Guidance

| Task Type | Inception Stages | Construction Stages |
|---|---|---|
| New module (e.g. Inventory) | All | All per unit |
| New route on existing module | Requirements, Execution Plan | Functional Design, Pre-Gen Validation, Code Gen, Build & Test |
| Bug fix (isolated) | Workspace Detection only | Pre-Gen Validation, Code Gen, Build & Test |
| UI copy / i18n update | Skip Inception | Code Gen, Build & Test |
| DB schema change | All + Architecture Review | All (NFR + Infrastructure mandatory) |
| Report / dashboard addition | Requirements, Stories, Execution Plan | All |

Always show the execution plan (which stages will run and which will be skipped, with reasons) **before starting**. User can adjust.

---

## Skills (Auto-Trigger Intent Matching)

Skills activate automatically based on user intent. Files are in `docs/skills/`.

### Skill: `pos-order`
**Triggers when:** creating an order, POS, invoicing, scanning QR, updating order status.
**File:** `docs/skills/pos-order/SKILL.md`
**Covers:** order creation flow, status lifecycle, invoice generation, offline queue.

### Skill: `membership`
**Triggers when:** membership, paket kg, periodik, discount, renewal.
**File:** `docs/skills/membership/SKILL.md`
**Covers:** membership validation at POS, discount application, sisa_kg deduction.

### Skill: `reporting`
**Triggers when:** reports, dashboard, revenue, expenses, income statement, P&L, laporan.
**File:** `docs/skills/reporting/SKILL.md`
**Covers:** daily report, monthly revenue, income statement, dashboard metrics.

### Skill: `inventory`
**Triggers when:** inventory, stok, FIFO, detergent, bahan, supplies.
**File:** `docs/skills/inventory/SKILL.md`
**Covers:** FIFO cost calculation, stock update on expense entry, low-stock alerts.

### Skill: `i18n`
**Triggers when:** translations, terjemahan, Bahasa Indonesia, English labels, text changes.
**File:** `docs/skills/i18n/SKILL.md`
**Covers:** Adding/editing keys in `apps/web/src/i18n/id.json` and `en.json`.

---

## Key Business Rules (Do Not Change Without PRD Update)

1. **Order Status Lifecycle is fixed and forward-only:**
   `diterima → dicuci → dikeringkan → dibungkus → siap_diambil → selesai`

2. **Periodik membership** = 10% discount, applied automatically at POS if not expired.

3. **Paket Kg deduction:** deduct total kg from `sisa_kg` on kiloan orders. Warn if `sisa_kg` would go negative — do not block.

4. **Invoice number format:** `INV-YYYYMMDD-NNNN` (daily sequence, server-side).

5. **Monetary values:** `BIGINT` whole IDR in DB. Frontend: `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })`.

6. **FIFO inventory:** deduct oldest batch first; recalculate `harga_rata_fifo` after each transaction.

7. **Soft-delete only:** `is_active = false`. Never hard-delete customers, items, or inventory.

8. **Public tracking:** `/track/[invoiceNo]` — no auth. Return only: `invoice_no`, `customer_nama`, `status`, `status_history[]`, `created_at`.

---

## Environment Variables

| Variable | Where Used | Description |
|---|---|---|
| `DATABASE_URL` | api | PostgreSQL connection string |
| `JWT_SECRET` | api | ≥ 32 chars, random |
| `JWT_EXPIRES_IN` | api | e.g. `8h` |
| `NEXT_PUBLIC_API_URL` | web | Backend URL (e.g. `http://localhost:4000`) |
| `NODE_ENV` | both | `development` / `production` |

Never commit `.env`. Use `.env.example` as template.

---

## Testing Standards

### Unit Tests (`apps/api/tests/unit/`)
- One file per service: `order.service.test.ts`
- Test all business rule branches (see Business Rules above)
- Mock repositories — never hit real DB in unit tests

### Integration Tests (`apps/api/tests/integration/`)
- Dedicated test DB: `laundry_palu_test`
- `beforeAll(() => runMigrations())` — always start clean
- Full HTTP request → response via Supertest
- `afterEach` cleanup

### Frontend Tests
- Vitest + React Testing Library
- Focus: POS flow and invoice rendering

---

## Common Commands

```bash
# Install
npm install                     # root (workspaces)

# Database
npm run migrate                 # run pending migrations (apps/api/)
npm run seed                    # insert sample data
npm run db:reset                # drop + recreate + migrate + seed (DEV ONLY)

# Development
npm run dev                     # web :3000 + api :4000 concurrently

# Test & Verify
npm run test                    # all tests
npm run test:watch              # watch mode
npm run typecheck               # tsc --noEmit both apps

# Build
npm run build                   # production build

# Lint
npm run lint
npm run lint:fix
```

---

## Adding a New Feature — Full Checklist

### Inception
- [ ] Run Workspace Detection — identify affected files
- [ ] Write `aidlc-docs/inception/requirements.md`
- [ ] Write `aidlc-docs/inception/stories.md`
- [ ] Write `aidlc-docs/inception/execution-plan.md`
- [ ] Get explicit human approval before proceeding

### Construction (per unit)
- [ ] Write `aidlc-docs/construction/<unit>/functional-design.md`
- [ ] Write `aidlc-docs/construction/<unit>/validation.md` (pre-gen check)
- [ ] Add migration if DB changes needed (`apps/api/migrations/NNN_*.sql`)
- [ ] Update `packages/shared/src/types.ts` for new shared types
- [ ] Write repository function + unit test
- [ ] Write service function + unit test
- [ ] Write route handler + integration test
- [ ] Add/update API client in `apps/web/src/lib/api.ts`
- [ ] Build UI component
- [ ] Add translation keys to `id.json` **and** `en.json`
- [ ] Run `npm run typecheck && npm run test && npm run build` — all green
- [ ] Update `docs/ARCHITECTURE.md` if structurally changed
- [ ] Update `aidlc-docs/aidlc-state.md` — mark unit COMPLETE
- [ ] Get human confirmation before next unit

### Operations
- [ ] Verify all env vars set
- [ ] Run `npm run migrate` on target environment
- [ ] Run smoke test: login → POS → create order → tracking page
- [ ] Log deployment in `aidlc-docs/audit.md`

---

## Boundaries

- **NEVER** add npm dependencies without asking the human first.
- **NEVER** modify already-run migration files — add a new one.
- **NEVER** put business logic in Next.js pages or API routes — it lives in Fastify services.
- **NEVER** use `any` in TypeScript — use `unknown` and narrow.
- **NEVER** delete files without explicit human permission — comment out + flag instead.
- **NEVER** proceed past a phase gate without explicit human approval.
- **NEVER** approve a stage if a context compaction prompt has appeared — stop and notify.
- **ALWAYS** run `npm run typecheck` before declaring any task complete.
- **ALWAYS** log significant actions in `aidlc-docs/audit.md`.
- **ALWAYS** ask before schema changes that drop or rename columns.
