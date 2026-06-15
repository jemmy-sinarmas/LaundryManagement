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
orders ──< notification_log        (WhatsApp send/skip/fail audit)

message_templates                  (standalone; payment_receipt + ready_for_collection)
settings                           (key-value; includes whatsapp_* connection config)
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
| `message_templates` | Editable WhatsApp message templates | `type` UNIQUE + CHECK (payment_receipt/ready_for_collection); `header`/`footer` editable, body fixed |
| `notification_log` | Audit of every WhatsApp notification attempt | `status` = skipped/sent/failed; optional `order_id` FK |

## Key Business Rules Reflected in Schema

- **Money:** All monetary columns are `BIGINT` (whole IDR). No decimals stored.
- **Soft-delete:** `is_active` column on `users`, `items`, `inventory_items`. Never hard-delete.
- **Order lifecycle:** `status` column is forward-only. Enforced in application layer, not DB.
- **Membership discount:** Applied at order creation time; stored as `diskon_persen` + `diskon_amount` snapshot on the order.
- **Price snapshot:** `order_items` stores `nama_item`, `tipe`, `harga` at time of order so historical orders are unaffected by price changes.
- **WhatsApp notifications:** A payment receipt is sent when an order is created (POS checkout); a ready-for-collection notice is sent when an order reaches `siap_diambil`. Sending is scaffold-only and disabled by default (`settings.whatsapp_enabled = 'false'`) — the sender logs the rendered message and records it in `notification_log` with status `skipped`. See `docs/ARCHITECTURE.md` §9.
