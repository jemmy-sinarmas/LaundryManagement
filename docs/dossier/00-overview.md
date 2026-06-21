# 00 — Overview

> One-screen orientation. Authoritative product detail lives in [`docs/PRD.md`](../PRD.md).

## What it is

**Laundry Palu** is a bilingual (Bahasa Indonesia default / English) Progressive Web App for
running a laundry business in Palu, Central Sulawesi. It covers the full operational lifecycle:
customers, membership, order intake (POS), real-time order tracking, expenses, inventory, and
admin reporting. It is built to run on low-cost Android tablets at the counter, with customers
self-tracking orders via a QR code on their receipt. POS is **offline-first**.

## Users & roles

| Role | Indonesian | Access |
|---|---|---|
| Admin | — | Owner/manager. Full access: dashboard, all reports, users, settings, all branches. An admin with **no branch** assigned is a super-admin who can filter by branch. |
| Kasir | Cashier | Counter staff. Operational only: POS, customers, order status, shift. Scoped to **one branch**. |
| Pelanggan | Customer | Read-only public order tracking (no login). |

## Feature-era timeline (as-built)

The product shipped in eras; chapter [`06-features.md`](./06-features.md) has the unit-by-unit
detail. At a glance:

| Era | What landed | Where |
|---|---|---|
| v1.0 core | Auth/users, customers/items/membership, POS + orders + tracking, expenses + inventory (FIFO), reports + dashboard, PWA | Units 01–16 |
| v1.1 multi-branch | Branches; per-branch items/inventory/orders/expenses; branch-scoped reports; pickup-token QR validation | Units 17–24 (`d6e6463`) |
| v1.2 / v1.3 | PPN + gratuity on orders; admin receipt preview; promotions module | Units 25–27 (`eddbf65`) |
| — | Shift system; extended reports (sales/transactions/invoices/shifts) | Units 28–29 |
| — | Daily cash-position report + payment capture | `705a3d8` (migration 016) |
| v1.4 WhatsApp | Message templates + notification log (scaffold, disabled by default) | `eb00107` (migrations 017–018) |
| QoL A–H | Toast errors, membership visibility, notification-log UI, pagination, tracking polish, secure `/track/t/:token`, integration test suite | `3534ccc`, `b3b36a3` |
| QoL Sprint I | ESLint, order-transaction hardening, global error handler, env validation, `/ready`, toasts/skeletons UX, service + integration test backfill, postgres.js DATE fix, focused frontend tests | `9d2e254`, `d643478` |

## Glossary

| Term | Meaning |
|---|---|
| Kasir | Cashier / counter staff |
| Pelanggan | Customer |
| Kiloan | Weight-based service (per kg) |
| Satuan | Per-item service |
| Jasa lain | Other services |
| Paket Kg | Pre-paid weight package membership |
| Periodik | Time-based membership (3/6/12 months) |
| Cabang | Branch |
| FIFO | First-In-First-Out inventory costing |
| PPN | Indonesian VAT |

---

*Sources / canonical refs:* [`docs/PRD.md`](../PRD.md) (§3 users, §4 functional reqs, §8 glossary),
[`aidlc-docs/aidlc-state.md`](../../aidlc-docs/aidlc-state.md) (unit ledger).
