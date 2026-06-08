# Laundry Palu — Requirements Reference
> **Status:** v1.0 COMPLETE — all 16 construction units shipped.
> This document is a living reference for future changes, not an active project plan.
> Source of truth for what the system does and the invariants it must uphold.

---

## Introduction

Laundry Palu is a bilingual (Bahasa Indonesia / English) PWA for managing a laundry business in Palu, Central Sulawesi. It covers the full operational loop: customer & membership management, POS order intake, real-time order tracking, expense & inventory management, and financial reporting.

**Stack:** Next.js 14 (frontend) + Fastify 4 (backend) + PostgreSQL 15.
**Deployment:** Single VPS, Docker Compose, PM2, nginx reverse proxy.
**Region:** `ap-southeast-1` when moving to AWS.

---

## Glossary

| Term | Meaning |
|---|---|
| Kasir | Cashier / counter staff role |
| Admin | Owner/manager role — full access |
| Kiloan | Weight-based laundry (per kg) |
| Satuan | Per-item laundry service |
| Periodik | Time-based membership (3 / 6 / 12 months) — 10% discount |
| Paket Kg | Pre-paid weight package (50 / 100 / 200 kg) — no price discount, balance deducted |
| FIFO | First-In First-Out inventory costing |
| IDR | Indonesian Rupiah — stored as `BIGINT` whole rupiah in DB |
| sisa_kg | Remaining kg balance on a Paket Kg membership |

---

## Requirement 1: User Authentication & RBAC

**User Story:** As a staff member, I want to log in with a username and password so that I can access features appropriate to my role.

### Acceptance Criteria

1. WHEN a user submits valid credentials, THEN the system SHALL return a JWT stored in an HTTP-only, SameSite=Strict cookie with 8-hour expiry.
2. WHEN a user submits invalid credentials, THEN the system SHALL return HTTP 401 with an error message, and SHALL NOT return any user data.
3. WHILE a Kasir is authenticated, THE system SHALL deny access to admin-only routes (users, reports, inventory, expense categories) with HTTP 403.
4. WHEN a JWT cookie is absent or expired, THEN the Next.js middleware SHALL redirect the request to `/login`, except for routes matching `/track/*` which are always public.
5. THE system SHALL store passwords as bcrypt hashes with cost factor 12. Plaintext passwords SHALL never appear in API responses or logs.
6. IF an Admin deactivates a user (`is_active = false`), THEN that user SHALL be denied login immediately.

---

## Requirement 2: Customer Management

**User Story:** As a Kasir or Admin, I want to create and search customers so that I can quickly associate orders with the right person.

### Acceptance Criteria

1. THE system SHALL enforce uniqueness of `no_hp` (phone number) across all customers.
2. WHEN searching by name or phone, THE system SHALL return results in under 300ms for up to 10,000 customer records.
3. THE system SHALL use soft-delete only (`is_active = false`). Hard-deleting a customer record is forbidden to preserve order history.
4. WHEN a customer is viewed, THE system SHALL display all their historical orders including completed ones.

---

## Requirement 3: Membership Management

**User Story:** As a Kasir, I want the POS to automatically apply the correct membership benefit so that customers receive their entitlement without manual calculation.

### Acceptance Criteria

1. WHEN a Periodik membership is active (current date is between `tanggal_mulai` and `tanggal_selesai`), THE system SHALL apply a 10% discount to the order total at POS.
2. WHEN a Periodik membership is expired, THE system SHALL flag it at POS with a visible warning and SHALL NOT apply the discount.
3. WHEN a Paket Kg membership is used on a kiloan order, THE system SHALL deduct the total kg from `sisa_kg`. Price discount SHALL NOT be applied for Paket Kg.
4. IF deducting kg would make `sisa_kg` negative, THE system SHALL display a warning but SHALL NOT block the order.
5. WHEN `sisa_kg` falls below 5 kg, THE system SHALL display a low-balance warning on the customer's membership badge.
6. THE system SHALL allow a customer to hold at most one active membership of each type simultaneously.

---

## Requirement 4: Item / Service Catalogue

**User Story:** As an Admin, I want to manage the list of laundry services so that prices are consistent across all orders.

### Acceptance Criteria

1. THE system SHALL support three item types: `satuan` (per item), `kiloan` (per kg), `jasa_lain` (other service).
2. WHEN an item is deactivated, THE system SHALL set `is_active = false` only. The item SHALL remain visible in historical order records.
3. Prices (harga) SHALL be stored as `BIGINT` whole IDR. No decimal IDR values are permitted.

---

## Requirement 5: POS — Order Creation

**User Story:** As a Kasir, I want to create an order for a customer and print an invoice so that we have a record and the customer has a receipt.

### Acceptance Criteria

1. THE system SHALL generate invoice numbers in the format `INV-YYYYMMDD-NNNN` where NNNN is a daily sequence that resets to 0001 each day.
2. WHEN an order is submitted, THE system SHALL snapshot item names, types, and prices into `order_items`. Future price changes SHALL NOT retroactively alter past invoices.
3. WHEN membership discount applies, THE system SHALL record `diskon_persen`, `diskon_amount`, and `membership_id` on the order.
4. WHEN the order is confirmed, THE system SHALL set the initial status to `diterima`.
5. IF the API is unreachable (offline), THE system SHALL store the order in the browser's IndexedDB `offline_orders` queue and SHALL sync it automatically when connectivity is restored.
6. THE invoice print layout SHALL include: invoice number, customer name, item list, subtotal, discount, total, and a QR code linking to the public tracking page.

---

## Requirement 6: Order Status Lifecycle

**User Story:** As a Kasir, I want to advance an order's status step by step so that the customer can track their laundry's progress.

### Acceptance Criteria

1. THE order status lifecycle is fixed and forward-only: `diterima → dicuci → dikeringkan → dibungkus → siap_diambil → selesai`.
2. WHEN a status update is requested, THE system SHALL reject any transition that skips a step or moves backward with HTTP 400.
3. EVERY status change SHALL be recorded in `order_status_history` with a timestamp and the user who made the change.
4. THE public tracking endpoint (`GET /api/v1/track/:invoiceNo`) SHALL require no authentication and SHALL return only: `invoice_no`, `customer_nama`, `status`, `status_history[]`, `created_at`.

---

## Requirement 7: Expense Management

**User Story:** As a Kasir or Admin, I want to record business expenses quickly so that the income statement stays accurate.

### Acceptance Criteria

1. WHEN an expense is linked to an inventory item (`inventory_item_id` is set), THE system SHALL automatically deduct `qty_used` from `inventory_items.qty_saat_ini`.
2. THE system SHALL support expense categories with two levels: `variabel` (variable) and `tetap` (fixed). These levels feed the income statement grouping.
3. Expense amounts SHALL be stored as `BIGINT` whole IDR.

---

## Requirement 8: Inventory Management (FIFO)

**User Story:** As an Admin, I want inventory stock and costs to update automatically so that the P&L reflects real input costs.

### Acceptance Criteria

1. WHEN stock is received (`masuk`), THE system SHALL recalculate `harga_rata_fifo` using the formula: `floor(((currentQty × currentAvg) + (inQty × inPrice)) / (currentQty + inQty))`.
2. THE system SHALL display a low-stock alert banner for any item where `qty_saat_ini ≤ stok_minimum`.
3. All inventory transactions SHALL be recorded in `inventory_transactions` as an append-only ledger. Records SHALL NOT be deleted.
4. THE system SHALL use soft-delete (`is_active = false`) for inventory items. Hard-delete is forbidden.

---

## Requirement 9: Reports & Dashboard

**User Story:** As an Admin, I want accurate financial and operational reports so that I can make informed business decisions.

### Acceptance Criteria

1. THE dashboard SHALL display: revenue today / this week / this month, order counts by status, top 5 customers by revenue this month, and low-stock alerts — all from a single API call completing in under 500ms.
2. THE income statement SHALL calculate: Revenue − Variable Costs − Fixed Costs = Net Profit, for any selectable date range.
3. WHEN a Kasir accesses any report endpoint, THE system SHALL return HTTP 403.
4. THE daily report print layout SHALL render correctly via `window.print()` without external CSS dependencies.

---

## Requirement 10: Bilingual UI

**User Story:** As an Admin or customer, I want to toggle between Bahasa Indonesia and English so that the system is accessible to both local staff and English-speaking owners.

### Acceptance Criteria

1. THE system SHALL default to Bahasa Indonesia on all pages.
2. WHEN the user toggles language, THE system SHALL persist the selection in `localStorage` and apply it immediately without a page reload.
3. ALL user-facing labels, status names, and error messages SHALL have translations in both `id.json` and `en.json`.
4. THE public tracking page SHALL include a visible language toggle accessible without login.

---

## Requirement 11: PWA & Offline

**User Story:** As a Kasir on a low-connectivity Android tablet, I want the POS to work offline so that business is not interrupted by network issues.

### Acceptance Criteria

1. THE app SHALL be installable on Android and iOS via the browser "Add to Home Screen" prompt.
2. THE app shell (HTML, CSS, JS) SHALL be served from cache-first strategy so the app loads without network.
3. WHEN the network is unavailable, THE POS SHALL accept new orders and queue them in IndexedDB.
4. WHEN connectivity is restored, THE system SHALL automatically sync all queued orders to the API, in the order they were created.
5. THE service worker SHALL serve `offline.html` as a fallback for uncached navigation requests when offline.

---

## Non-Functional Invariants (Do Not Break)

These are hard constraints that cut across all requirements:

| Invariant | Rule |
|---|---|
| Money storage | `BIGINT` whole IDR in all DB columns. No `DECIMAL` or `FLOAT` for money. |
| Money display | `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })` in UI only. |
| Soft-delete | `is_active = false` for customers, items, inventory. Never `DELETE`. |
| Order lifecycle | Forward-only. No skipping. No reversals. |
| SQL safety | Parameterised queries only (postgres.js tagged template literals). No string concatenation. |
| Layer rule | Routes → Services → Repositories → DB. Never skip. No business logic in routes or frontend. |
| No `any` | TypeScript `unknown` with narrowing. `any` is a build error. |
| Migration safety | Never edit an already-run migration file. Add a new numbered file. |
| Public route | `/track/*` requires zero authentication — never add auth middleware to this path. |
| Invoice snapshots | `order_items` stores a price/name snapshot at order time. Never join to live `items` for historical data. |
