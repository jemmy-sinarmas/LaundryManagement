# User Stories — Multi-Branch + Pickup QR (v1.1)
Generated: 2026-06-09

---

## Epic 1: Branch Management

### S-01 — Create and manage branches
**As** an admin (owner),  
**I want to** create and manage branches (cabang),  
**So that** each physical location is tracked separately in the system.

**Definition of Done:**
- Admin can create a branch with nama, kode, and alamat
- Admin can deactivate a branch (soft-delete: `is_active = false`)
- Branch list page shows all branches with their kode and status
- Duplicate kode is rejected (409 Conflict)

---

### S-02 — Assign kasir to a branch
**As** an admin,  
**I want to** assign each kasir to a specific branch at account creation,  
**So that** their POS access, orders, and inventory are automatically scoped to that branch.

**Definition of Done:**
- User create dialog has a branch selector (required for kasir role, hidden for admin)
- JWT returned at login contains the correct `branch_id`
- Kasir cannot see or create data for other branches

---

## Epic 2: Branch-Scoped Operations

### S-03 — Kasir sees only their branch's items in POS
**As** a kasir,  
**I want to** see only the laundry services available at my branch,  
**So that** I don't accidentally use items from another location.

**Definition of Done:**
- POS item grid shows only items where `branch_id = current_user.branch_id`
- Admin branch management page allows per-branch item creation

---

### S-04 — Kasir sees only their branch's orders
**As** a kasir,  
**I want to** see only orders created at my branch,  
**So that** the order list isn't cluttered with other locations' work.

**Definition of Done:**
- Orders page filters by `branch_id` automatically for kasir
- Invoice number uses branch kode: `INV-[KODE]-YYYYMMDD-NNNN`
- Sequence restarts at 0001 each day per branch

---

### S-05 — Kasir tracks inventory for their branch
**As** a kasir / admin,  
**I want** inventory stock levels to be tracked per branch,  
**So that** each location manages its own supplies independently.

**Definition of Done:**
- Inventory page shows only items belonging to the current branch (for kasir)
- Catat Masuk / Keluar transactions are scoped to the branch
- Low-stock alerts are per-branch

---

### S-06 — Kasir records expenses for their branch
**As** a kasir,  
**I want** expenses I record to be tagged to my branch,  
**So that** per-branch P&L is accurate.

**Definition of Done:**
- Expense creation auto-assigns `branch_id` from JWT
- Expense list page shows only current branch's expenses (for kasir)

---

## Epic 3: Super-Admin Cross-Branch View

### S-07 — Admin sees consolidated dashboard
**As** an admin (owner),  
**I want to** see revenue, orders, and P&L across all branches in one dashboard,  
**So that** I can understand overall business performance.

**Definition of Done:**
- Dashboard KPI cards aggregate all branches by default
- Branch filter dropdown allows drilling into a single branch
- Report pages (daily, monthly, income statement) respect the branch filter

---

## Epic 4: Pickup QR Validation

### S-08 — Receipt QR is opaque and secure
**As** a system,  
**I want to** generate an opaque UUID token on the receipt QR,  
**So that** the customer cannot infer or forge a completion claim.

**Definition of Done:**
- `pickup_token` is a UUID v4 stored on the order record
- QR on printed receipt encodes `/pickup/[pickup_token]`
- Invoice number is NOT part of the QR URL

---

### S-09 — Kasir validates pickup by scanning QR
**As** a kasir,  
**I want to** scan a customer's receipt QR and confirm pickup in one tap,  
**So that** order completion is quick and tamper-resistant.

**Definition of Done:**
- `/pickup/[token]` requires kasir to be logged in
- If order not `siap_diambil`: show status message, button disabled
- If order is `siap_diambil`: show customer name, item summary, total; "Validate & Complete" button active
- Tapping button → order moves to `selesai`; success message shown
- If order already `selesai`: show "Sudah selesai" — no duplicate transition

---

### S-10 — Kasir handles lost receipt
**As** a kasir,  
**I want to** find a customer's order by phone number when they've lost their receipt,  
**So that** I can still complete the pickup without the QR code.

**Definition of Done:**
- Orders page search by phone number returns matching orders
- Kasir can manually advance order to `selesai` from the order detail / status update flow
- No special "lost receipt" flow needed — reuses existing status advance
