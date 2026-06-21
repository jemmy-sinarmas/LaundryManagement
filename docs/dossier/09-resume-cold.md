# 09 — Resume Cold

> You are picking this project up from **zero context**. This is your runbook.

## 1. Orient (5 minutes)

Read, in order:
1. [`00-overview.md`](./00-overview.md) — what the product is, who uses it.
2. [`01-architecture.md`](./01-architecture.md) — stack + the single layering rule.
3. [`03-domain-rules.md`](./03-domain-rules.md) — the rules you must not break.
4. The chapter matching your task (`02` data, `04` api, `05` frontend, `06` features, `07` tests, `08` ops).

## 2. Where ground truth lives (when the prose and the code disagree, the code wins)

| Question | Authoritative source |
|---|---|
| Exact DB shape | `apps/api/migrations/001…018_*.sql` (+ `docs/database/schema.sql`) |
| What's been built | [`aidlc-docs/aidlc-state.md`](../../aidlc-docs/aidlc-state.md) + [`06-features.md`](./06-features.md) |
| What happened & when | [`aidlc-docs/audit.md`](../../aidlc-docs/audit.md) (append-only) |
| Business rules | [`AGENTS.md`](../../AGENTS.md) "Key Business Rules" |
| Routes + prefixes | `apps/api/src/app.ts` |
| Product intent | [`docs/PRD.md`](../PRD.md) |

## 3. Verify the build is green before changing anything

```bash
pnpm install
pnpm run typecheck                                       # both apps
pnpm run lint                                            # both apps
pnpm run test                                            # ⚠ API unit only
pnpm --filter @laundry-palu/web run test                # web unit (41)
pnpm --filter @laundry-palu/api run test:integration    # needs reachable Postgres
pnpm run build                                           # shared → api → web
```

If anything is red, fix it (or surface it) **before** starting new work.

## 4. Standing constraints (do not violate)

- **Never commit or push unless the user explicitly asks** (standing rule; memory
  `feedback_git_actions`). End commit messages with the `Co-Authored-By` trailer when you do.
- **Never use `any`** in TypeScript — use `unknown` and narrow.
- **Never modify an already-run migration** — add a new numbered one. Ask before dropping/renaming
  columns.
- **`aidlc-docs/audit.md` is append-only** — never edit existing rows; add at the bottom.
- **Never add npm dependencies without asking** the human first.
- **Soft-delete only** for customers/items/inventory (`is_active=false`); never hard-delete.
- **Keep i18n at parity** — every new key goes in both `id.json` and `en.json`.
- **Respect the layering** — Routes → Services → Repositories → DB; business logic only in
  services; no business logic in Next.js pages.

## 5. Known traps

- **postgres.js DATE gotcha** — `DATE` is a JS `Date` under postgres.js but a string under
  PGLite; normalize with `dateOnly()` (`apps/api/src/lib/date.ts`). Unit tests (PGLite) and prod
  (postgres.js) will otherwise disagree.
- **`pnpm run test` is API-only** — the web and integration suites are separate commands.
- **WhatsApp is a disabled scaffold** — it logs + records `skipped`; it does not send. Config is
  in the `settings` table, not env. See [`08-ops.md`](./08-ops.md).
- **Membership prefix** — membership routes register under the `/api/v1/customers` prefix, not a
  `/membership` one.

## 6. When you finish a change

Update the matching dossier chapter **and** the README index (the freshness contract), run the
verification in §3, and — per [`AGENTS.md`](../../AGENTS.md) — log the action in `audit.md`. Do
**not** commit/push unless asked.

---

*Sources / canonical refs:* [`AGENTS.md`](../../AGENTS.md) "Boundaries",
[`aidlc-docs/aidlc-state.md`](../../aidlc-docs/aidlc-state.md), `package.json` (root scripts),
memories `feedback_git_actions`, `project_postgres_date_gotcha`, `feedback_design_dossier`.
