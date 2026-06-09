# Requirements — Multi-Branch + Pickup QR (v1.1)
Generated: 2026-06-09

---

## Functional Requirements

### FR-01 Branch Management
- Admin can create, view, update, and soft-delete branches.
- Each branch has: `nama`, `kode` (unique short code, max 10 chars), `alamat`, `is_active`.
- At least one branch must exist before any kasir can be created.

### FR-02 User–Branch Assignment
- Each kasir must be assigned to exactly one branch at creation time.
- Admin (super-admin) has `branch_id = NULL` — full cross-branch access.
- A kasir cannot be reassigned to a different branch after creation (can be changed only by admin via edit).
- JWT payload includes `branch_id` (null for admin).

### FR-03 Branch-Scoped Data
- **Items:** Each item belongs to one branch. Kasir sees only their branch's items in POS.
- **Inventory:** Each inventory item belongs to one branch. Stock levels are independent per branch.
- **Orders:** Each order is tagged with the branch where it was created. Kasir can only view and create orders for their own branch.
- **Expenses:** Each expense is tagged to the branch of the user who recorded it.
- **Customers:** Shared globally — no branch scope. Any branch can serve any customer.
- **Expense categories:** Shared globally.
- **Memberships:** Shared globally (tied to customer, not branch).

### FR-04 Invoice Number Format
- New format: `INV-[KODE]-YYYYMMDD-NNNN` where `KODE` is the branch's short code.
- Sequence `NNNN` resets to `0001` each day **per branch**.
- Example: Branch "PLW" on 2026-06-09, first order of the day → `INV-PLW-20260609-0001`.

### FR-05 Super-Admin Cross-Branch View
- Admin (branch_id = NULL) can see all data across all branches.
- Dashboard and report pages offer a branch filter dropdown (default: "All Branches").
- When a branch is selected, all metrics and lists filter to that branch only.

### FR-06 Pickup QR — Opaque Token
- On order creation, a `pickup_token` (UUID v4) is generated and stored on the order.
- The token is globally unique (UNIQUE constraint on `orders.pickup_token`).
- The printed receipt QR code encodes the URL: `https://[domain]/pickup/[pickup_token]`.
- The invoice number is NOT embedded in the QR URL.

### FR-07 Pickup QR — Validation Flow
- The `/pickup/[token]` page requires the kasir to be authenticated (JWT cookie).
- On load: system fetches the order by `pickup_token`. If not found → 404.
- If order status is NOT `siap_diambil` → show "Belum siap diambil" message; disable the validate button.
- If order status IS `siap_diambil` → show order summary (customer name, items, total); enable "Validate & Complete" button.
- On confirm: PATCH `/api/v1/orders/pickup/:token/complete` → advances status to `selesai` (uses existing status transition logic).
- If already `selesai` → show "Sudah selesai" confirmation; no further action.

### FR-08 Pickup Contingency (Lost Receipt)
- No additional UI required. Kasir uses the existing Orders page to search by customer phone number or invoice number and manually advances status to `selesai`.

---

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Security** | `pickup_token` must be a cryptographically random UUID — not sequential, not derivable from invoice number |
| **Auth** | `/pickup/:token` requires valid JWT; pickup_token alone is not sufficient for auth |
| **DB** | `pickup_token` has a UNIQUE index; `branch_id` columns have FK indexes |
| **Migration** | All schema changes are additive (new migrations only; existing migrations never modified) |
| **Backward compat** | Existing v1.0 orders (no branch_id, no pickup_token) must remain readable after migration |
| **Performance** | Pickup token lookup: single indexed query < 50ms |
| **i18n** | All new UI strings have keys in both `id.json` and `en.json` |

---

## Acceptance Criteria

| # | Scenario | Expected Result |
|---|---|---|
| AC-01 | Create branch "Palu Barat" with kode "PLW" | Branch appears in admin branch list; kode is unique |
| AC-02 | Create kasir with branch = PLW; log in as that kasir | JWT carries `branch_id` = PLW's UUID |
| AC-03 | Kasir-PLW opens POS | Only PLW items appear; PLT items are invisible |
| AC-04 | Kasir-PLW creates order | Invoice number is `INV-PLW-YYYYMMDD-NNNN`; order has `branch_id` = PLW |
| AC-05 | Kasir-PLW opens Orders page | Only PLW orders visible |
| AC-06 | Super-admin opens Dashboard | Shows combined revenue across all branches; branch filter dropdown available |
| AC-07 | Print receipt for any order | QR encodes `/pickup/[uuid]` — NOT `/track/[invoiceNo]` |
| AC-08 | Kasir opens `/pickup/[token]` when order is `diterima` | "Belum siap diambil" shown; button disabled |
| AC-09 | Kasir opens `/pickup/[token]` when order is `siap_diambil` | Order summary shown; "Validate & Complete" button active |
| AC-10 | Kasir taps "Validate & Complete" | Order moves to `selesai`; success screen shown |
| AC-11 | Kasir opens `/pickup/[token]` for already-`selesai` order | "Sudah selesai" shown; no state change |
| AC-12 | Customer lost receipt; kasir searches by phone | Order found in Orders list; status manually advanced to `selesai` |
