# 02 — Data Model

> **Canonical schema:** [`docs/database/schema.sql`](../database/schema.sql) +
> [`docs/database/ERD.md`](../database/ERD.md). **Source of truth for deltas:**
> `apps/api/migrations/001…018_*.sql`. This chapter is the navigable inventory + the rules,
> not a copy of the DDL.

## Tables (by domain)

| Domain | Tables |
|---|---|
| Identity | `users`, `branches` |
| Customers | `customers`, `memberships` |
| Catalog | `items` |
| Orders | `orders`, `order_items`, `order_status_history`, `payments` |
| Expenses | `expense_categories`, `expenses` |
| Inventory | `inventory_items`, `inventory_transactions` |
| Promotions | `promotions` |
| Shifts | `shifts` |
| Settings | `settings` (key-value) |
| WhatsApp | `message_templates`, `notification_log` |

Relationships (simplified):

```
branches ──< users
   │
   ├──< orders >── customers ──< memberships
   │      ├──< order_items >── items (per branch)
   │      ├──< order_status_history
   │      └──< payments
   ├──< expenses >── expense_categories (global)
   └──< inventory_items >── inventory_transactions
```

## Migration history (001 → 018)

| # | File | Adds |
|---|---|---|
| 001 | `001_init.sql` | base tables (users, customers, memberships, items, orders, order_items, status history, expenses, inventory) |
| 001s | `001_init_sqlite.sql` | PGLite/SQLite-compatible variant for native-free dev/test |
| 002 | `002_seed.sql` | sample data |
| 003 | `003_settings.sql` | `settings` key-value table |
| 004 | `004_order_status_catatan.sql` | order status note |
| 005 | `005_customer_country_code.sql` | customer country code |
| 006 | `006_inventory_foto.sql` | inventory item photo |
| 007 | `007_branches.sql` | `branches` (v1.1) |
| 008 | `008_user_branch.sql` | `users.branch_id` |
| 009 | `009_item_branch.sql` | `items.branch_id` |
| 010 | `010_inventory_branch.sql` | inventory branch scoping |
| 011 | `011_order_branch.sql` | `orders.branch_id` + `pickup_token` |
| 012 | `012_expense_branch.sql` | expense branch scoping |
| 013 | `013_ppn_gratuity_order.sql` | PPN + gratuity columns |
| 014 | `014_promotions.sql` | `promotions` |
| 015 | `015_shifts.sql` | `shifts` (+ partial unique index for open shift) |
| 016 | `016_payments.sql` | `payments` (payment capture) |
| 017 | `017_message_templates.sql` | `message_templates` (WhatsApp) |
| 018 | `018_notification_log.sql` | `notification_log` (WhatsApp send audit) |

`apps/api/migrations/run.ts` is the runner. **Never modify an already-run migration — add a new
one** ([`AGENTS.md`](../../AGENTS.md) Boundaries).

## Cross-cutting rules

- **Money:** all monetary columns are `BIGINT` whole IDR (no sub-rupiah). Never store floats.
  Formatting/rounding rules → [`03-domain-rules.md`](./03-domain-rules.md).
- **Soft-delete only:** customers, items, and inventory are deactivated via `is_active = false`,
  never hard-deleted (preserves invoice history).
- **postgres.js DATE gotcha** ⚠️ — `DATE` columns come back as JS `Date` objects under
  **postgres.js** but as **strings** under **PGLite**. Repo mappers normalize with
  `dateOnly()` in [`apps/api/src/lib/date.ts`](../../apps/api/src/lib/date.ts). When you add a
  query that selects a `DATE`, map it through `dateOnly()` or unit tests (PGLite) and prod
  (postgres.js) will disagree. See memory `project_postgres_date_gotcha`.
- **DB abstraction:** `apps/api/src/lib/{db-types,sqlite-adapter}.ts` lets the same repos run on
  real Postgres (prod) and PGLite (unit tests, no native deps).

---

*Sources / canonical refs:* [`docs/database/schema.sql`](../database/schema.sql),
[`docs/database/ERD.md`](../database/ERD.md), `apps/api/migrations/*.sql`,
`apps/api/src/lib/date.ts`, [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) §4.
