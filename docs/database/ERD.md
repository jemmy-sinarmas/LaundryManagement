# Entity Relationship Diagram — Laundry Palu

## Relationships

```
users ──────────────────────< orders >────────────── customers
  │                               │                      │
  │ (created_by)          order_items              memberships
  │                               │                      │
  │ (changed_by)               items            (customer_id)
  │
  └── expenses >──────── expense_categories
  │     │
  │     └── (inventory_item_id, optional)
  │
  └── inventory_transactions >── inventory_items

orders ──< order_status_history
```

## Table Summary

| Table | Purpose | Key Constraints |
|---|---|---|
| `users` | System users (admin/kasir) | `username` UNIQUE; `role` CHECK |
| `customers` | Laundry customers | `no_hp` UNIQUE |
| `memberships` | Periodik or Paket Kg membership per customer | `tipe` CHECK; linked to `customers` |
| `items` | Laundry service catalog | `tipe` CHECK (satuan/kiloan/jasa_lain); soft-delete via `is_active` |
| `orders` | Invoices / transactions | `invoice_no` UNIQUE format INV-YYYYMMDD-NNNN; `status` CHECK; `total` = `subtotal` - `diskon_amount` |
| `order_items` | Line items per order (price snapshot) | CASCADE DELETE with parent order |
| `order_status_history` | Audit trail of status changes | Append-only; one row per transition |
| `expense_categories` | Categories for expenses | `level` CHECK (variabel/tetap) |
| `expenses` | Operational expenses | Optional link to inventory item for stock deduction |
| `inventory_items` | Supply stock tracker | `harga_rata_fifo` recalculated on each 'masuk' transaction |
| `inventory_transactions` | FIFO ledger for stock in/out | `tipe` CHECK (masuk/keluar) |

## Key Business Rules Reflected in Schema

- **Money:** All monetary columns are `BIGINT` (whole IDR). No decimals stored.
- **Soft-delete:** `is_active` column on `users`, `items`, `inventory_items`. Never hard-delete.
- **Order lifecycle:** `status` column is forward-only. Enforced in application layer, not DB.
- **Membership discount:** Applied at order creation time; stored as `diskon_persen` + `diskon_amount` snapshot on the order.
- **Price snapshot:** `order_items` stores `nama_item`, `tipe`, `harga` at time of order so historical orders are unaffected by price changes.
