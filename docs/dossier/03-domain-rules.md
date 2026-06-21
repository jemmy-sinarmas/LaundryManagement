# 03 — Domain Rules

> The rules you **must not break** without a PRD update. Canonical list:
> [`AGENTS.md`](../../AGENTS.md) → "Key Business Rules". This chapter adds where each rule is
> enforced in code.

## Order status lifecycle (fixed, forward-only)

```
diterima → dicuci → dikeringkan → dibungkus → siap_diambil → selesai
```

No skipping, no going backward. Enforced server-side in `order.service.ts`; every transition is
written to `order_status_history`. UI status advance lives in the kasir antrian / admin orders
pages and the pickup flow.

## Membership

- **Periodik** — active subscription (3/6/12 months) gives a flat **10% discount**, applied
  automatically at POS if not expired. Expired periodik is flagged at POS.
- **Paket Kg** — pre-paid weight. Deduct order kg from `sisa_kg`; **warn (do not block)** if it
  would go negative. No price discount. Warn when `sisa_kg < 5`.
- Validation is a pure function in `membership.service.ts`.

## Order money math

Two places compute totals — keep them consistent:

- **Backend (authoritative):** `order.service.ts` `calculateOrderTotals` — subtotal, membership
  discount, **promo**, **PPN + gratuity**. Persisted to `orders`.
- **Frontend (preview):** [`apps/web/src/lib/calculations.ts`](../../apps/web/src/lib/calculations.ts)
  (`calcSubtotal`, `calcOrderTotals`) used by `usePOS`. Semantics:
  - per-line subtotal: `Math.floor(harga * qty)`
  - membership/percent discount: `Math.floor((subtotal * pct) / 100)`
  - promo `persen`: `Math.floor((subtotal * nilai) / 100)`; promo `nominal`: `Math.min(nilai, subtotal)`

All money is whole IDR (`BIGINT`). Frontend formats with
`Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })` (`lib/utils.ts` `formatIDR`).

## Invoice number

Format **`INV-[KODE]-YYYYMMDD-NNNN`** — per-branch daily sequence (v1.1). `[KODE]` is the branch
short code. Generated server-side in `apps/api/src/utils/invoice.ts`.

## FIFO inventory

Deduct oldest batch first; recompute average after each transaction:

```
harga_rata_fifo = floor(((currentQty * currentAvg) + (inQty * inPrice)) / (currentQty + inQty))
```

Implemented in `apps/api/src/utils/fifo.ts`; stock is updated when an expense is linked to an
inventory item. Low-stock alert per item via `stok_minimum`.

## Promotions

`promotions` table (migration 014). A promo is `persen` or `nominal` with `minOrder`, validity
dates, branch scope, active flag. Applied in `promotion.service.ts` / `order.service.ts` and
selectable at POS. See `04-promo` semantics above.

## PPN + gratuity

Order-level tax + gratuity (migration 013), configured in `settings`, shown on the printable
invoice. Folded into `calculateOrderTotals`.

## Pickup-token QR validation (v1.1)

- On order creation an opaque `pickup_token` (UUID) is stored on the order. The printed receipt
  QR encodes the **public tracking URL** (not the invoice number).
- At pickup: kasir opens the token page → system verifies status is `siap_diambil` → "Validate &
  Complete" advances the order to `selesai`. If not ready, page shows "belum siap diambil", no
  state change.
- **Contingency (lost receipt):** kasir finds the order by phone/invoice on the orders page and
  advances status manually.

## Public tracking (no auth)

Two endpoints, both excluded from auth middleware (details in [`04-api.md`](./04-api.md)):
- `GET /api/v1/track/t/:token` — primary customer URL; opaque, not enumerable.
- `GET /api/v1/track/:invoiceNo` — staff/legacy lookup.

---

*Sources / canonical refs:* [`AGENTS.md`](../../AGENTS.md) "Key Business Rules",
`apps/api/src/services/{order,membership,promotion}.service.ts`,
`apps/api/src/utils/{invoice,fifo}.ts`, `apps/web/src/lib/calculations.ts`,
[`docs/PRD.md`](../PRD.md) §4.
