# Design Dossier — Laundry Palu

> The **canonical, end-to-end, as-built** description of the whole system. If you are an
> agent or engineer picking this project up **cold**, start here — read
> [`09-resume-cold.md`](./09-resume-cold.md) first, then the chapters in order.

## What this is (and isn't)

This dossier is the **spine** of the project's knowledge. It captures the *whole solution*
end-to-end — not just diffs — so context is never lost between sessions.

It is **not** a copy of the other docs. Each chapter **links to** the authoritative source
for its slice and only *owns* net-new content (as-built feature inventory, code-path traces,
test/CI topology, the cold-resume runbook). Canonical sources stay canonical:

| Topic | Canonical source (don't duplicate) |
|---|---|
| Product intent / requirements | [`docs/PRD.md`](../PRD.md) |
| Long-form architecture + diagrams | [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) |
| Database schema | [`docs/database/schema.sql`](../database/schema.sql) + [`ERD.md`](../database/ERD.md) |
| Schema deltas over time | `apps/api/migrations/001…018_*.sql` |
| Agent operating rules + business rules | [`AGENTS.md`](../../AGENTS.md) |
| Construction unit ledger | [`aidlc-docs/aidlc-state.md`](../../aidlc-docs/aidlc-state.md) |
| Append-only action history | [`aidlc-docs/audit.md`](../../aidlc-docs/audit.md) |

## Chapters

| # | File | Owns |
|---|---|---|
| — | [`00-overview.md`](./00-overview.md) | Business context, users/roles, glossary, feature-era timeline |
| — | [`01-architecture.md`](./01-architecture.md) | Stack, layering rule, repo map, `buildApp()`, error handler, env, health |
| — | [`02-data-model.md`](./02-data-model.md) | Table inventory, money rule, DATE gotcha, soft-delete, migrations |
| — | [`03-domain-rules.md`](./03-domain-rules.md) | Order lifecycle, membership, FIFO, invoice format, promo, PPN, pickup |
| — | [`04-api.md`](./04-api.md) | Endpoint contract, auth model, error envelope, public routes |
| — | [`05-frontend.md`](./05-frontend.md) | Route groups, stores, offline queue, POS math, i18n, PWA |
| — | [`06-features.md`](./06-features.md) | As-built feature inventory: units 01–29 + QoL Sprints A–I |
| — | [`07-testing-ci.md`](./07-testing-ci.md) | Test topology, CI gate order, how to run each suite |
| — | [`08-ops.md`](./08-ops.md) | Deploy, env vars, backups, WhatsApp scaffold |
| — | [`09-resume-cold.md`](./09-resume-cold.md) | Runbook for picking the project up from zero |

## Reading order (start here)

1. [`09-resume-cold.md`](./09-resume-cold.md) — orient + verify the build is green.
2. [`00-overview.md`](./00-overview.md) → [`01-architecture.md`](./01-architecture.md) — what & how.
3. [`03-domain-rules.md`](./03-domain-rules.md) — the rules you must not break.
4. The remaining chapters as the task demands.

## Freshness contract

This dossier is a **first-class workstream**: keeping it current is part of every feature's
Definition of Done (see [`AGENTS.md`](../../AGENTS.md) → "Adding a New Feature" checklist, and
[`aidlc-state.md`](../../aidlc-docs/aidlc-state.md) → Batch End Protocol).

When you change something, update the matching chapter **and** this index in the same change:

| If you change… | Update chapter |
|---|---|
| A DB table / migration | `02-data-model.md` |
| A business rule / calculation | `03-domain-rules.md` |
| An API route / auth behavior | `04-api.md` |
| A web route / store / hook | `05-frontend.md` |
| Ship a feature or sprint | `06-features.md` |
| A test suite / CI step | `07-testing-ci.md` |
| Deploy/env/WhatsApp config | `08-ops.md` |

**Last synced:** commit `d643478` (2026-06-21). Update this line when you refresh the dossier.

---

*Sources / canonical refs:* `docs/PRD.md`, `docs/ARCHITECTURE.md`, `AGENTS.md`,
`aidlc-docs/aidlc-state.md`.
