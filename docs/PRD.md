# Product Requirements Document (PRD)
## Laundry Palu — Business Management System
**Version:** 1.0.0  
**Date:** 2025-06-06  
**Author:** Product Team  
**Status:** Approved for Development

---

## 1. Executive Summary

Laundry Palu is a bilingual (Bahasa Indonesia default / English option) Progressive Web App (PWA) for managing a laundry business in Palu, Central Sulawesi, Indonesia. The system covers the full operational lifecycle: customer management, membership, order intake (POS), real-time order tracking, expense management, inventory, and reporting/dashboard for admin. It is designed to run on low-cost Android tablets at the counter and smartphones for customers to self-track orders via QR code.

---

## 2. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Eliminate paper-based tracking | Zero paper invoices within 30 days of go-live |
| Reduce order status inquiry calls | ≥ 70% customers self-track via QR/phone number |
| Accurate financial reporting | Reconciled daily/monthly P&L generated in < 10 seconds |
| Staff onboarding | Cashier productive within 1 hour of training |

---

## 3. Users & Roles

| Role | Description | Key Screens |
|---|---|---|
| **Admin** | Owner/manager. Full access. | Dashboard, All Reports, User Mgmt, Settings |
| **Kasir (Cashier)** | Counter staff. Operational access only. | POS, Customer Lookup, Order Status Update |
| **Pelanggan (Customer)** | End customer. Read-only order tracking. | Tracking page (public, no login required) |

---

## 4. Functional Requirements

### 4.1 User Management
- CRUD for system users (Admin, Kasir)
- Fields: Nama Lengkap, Username, Password (bcrypt), Role
- Role-based access control (RBAC): Admin sees all menus; Kasir sees POS + Customer + Order only
- Password reset by Admin only

### 4.2 Customer Management
- CRUD for customers
- Fields: Nama, Alamat, No HP (unique, used for QR tracking lookup)
- Search by name or phone number
- Customer history: list of all orders

### 4.3 Membership Management
- Two membership types:
  - **Periodik (Periodic):** 3-month, 6-month, or 1-year subscription. Gives 10% discount on all orders during the period.
  - **Pre-paid Weight (Paket Kg):** Buy in advance — 50 Kg, 100 Kg, or 200 Kg. Balance deducted per order.
- Membership linked to customer record
- System warns when pre-paid balance < 5 Kg
- System flags expired periodic membership at POS

### 4.4 Item / Service Management
- CRUD for laundry service items
- Fields: Nama Item, Tipe (Satuan / Kiloan / Jasa Lain), Harga Satuan
- Soft-delete only (no hard delete to preserve invoice history)

### 4.5 POS Interface
Two flows:

**New Order Flow:**
1. Search / select customer (or quick-add new customer)
2. Select item(s), quantity / weight
3. System applies membership discount if applicable
4. Preview invoice total
5. Confirm → generate Invoice with unique ID
6. Print two copies: Internal (A5) + Customer copy (A5 with QR code)
7. Status set to **Diterima**

**Existing Order Flow (Update Status):**
1. Scan QR code on invoice OR search by invoice ID
2. View current status
3. Update to next status in lifecycle

**Order Status Lifecycle:**
```
Diterima → Dicuci → Dikeringkan → Dibungkus → Siap Diambil → Selesai
```

### 4.6 Customer Tracking (Public Page)
- No login required
- Input: phone number OR scan QR code
- Output: list of active/recent orders with current status and timeline
- Bilingual label toggle

### 4.7 Expense Entry
- Fields: Tanggal, Jumlah (IDR), Kategori Biaya, Deskripsi/Komentar
- Quick-entry form (optimised for mobile)

### 4.8 Expense Category Management
- CRUD for expense categories
- Fields: Nama Kategori, Level (Biaya Variabel / Biaya Tetap)

### 4.9 Inventory Management
- CRUD for inventory items (detergent, packaging, hangers, etc.)
- Fields: Nama, Satuan, Qty, Harga Rata-rata (FIFO cost)
- On expense entry: option to link to inventory item → auto-update qty and FIFO cost
- Low-stock alert threshold per item

### 4.10 Branch Management (v1.1)
- CRUD for branches (Cabang)
- Fields: Nama Cabang, Kode Cabang (short code, e.g. PLW), Alamat, Status Aktif
- Each branch has its own item catalog, inventory stock, orders, and expenses
- Customers are shared across all branches (global pool)
- Each Kasir is assigned to exactly one branch — they can only see/create data for their branch
- Admin with no branch assignment = super-admin: sees all branches, can filter by branch on all screens

### 4.11 Pickup QR Validation (v1.1)
- On order creation, generate an opaque `pickup_token` (UUID, stored on the order; never exposed in URLs as the invoice number)
- Printed receipt QR encodes: `https://[domain]/pickup/[pickup_token]`
- At pickup: kasir scans customer's receipt QR on their device → `/pickup/[token]` page opens → system verifies order is `siap_diambil` → kasir taps "Validate & Complete" → order advances to `selesai`
- If order is not yet `siap_diambil`: page shows "Belum siap diambil" message; no state change
- **Contingency (lost receipt):** kasir searches for the order on the Orders page by customer phone number or invoice number and manually advances status — no receipt required

### 4.12 Reports & Dashboard

**Dashboard (Admin Home):**
- Revenue today / this week / this month (IDR)
- Active orders count by status (Kanban-style summary)
- Top 5 customers by revenue this month
- Low-stock inventory alerts
- Expense vs Revenue chart (last 30 days)

**Daily Report:**
- List of orders closed today with amounts
- Total revenue
- Total expenses
- Net income

**Monthly Revenue Report:**
- Revenue per day (bar chart)
- Revenue by item/service type
- New vs returning customers

**Income Statement (Laporan Laba Rugi):**
- Revenue
- Variable costs
- Fixed costs
- Gross profit
- Net profit
- Selectable date range

**Inventory Report:**
- Current stock levels
- FIFO cost valuation
- Consumption history

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Language** | Bahasa Indonesia default; English toggle stored in browser localStorage |
| **PWA** | Installable on Android/iOS; works offline for POS (order sync when back online); Web App Manifest + Service Worker |
| **Performance** | First Contentful Paint < 2s on 3G; API response < 300ms for POS operations |
| **Security** | JWT auth (HTTP-only cookie); HTTPS enforced; parameterised SQL only; RBAC enforced server-side |
| **Accessibility** | WCAG 2.1 AA; large touch targets (min 44px); high-contrast mode |
| **Print** | Invoice print via browser print API; A5 format; QR code embedded as SVG |
| **Database** | PostgreSQL 15+; all monetary values stored as INTEGER (IDR sen) |
| **Backup** | Daily pg_dump to local file; optional S3 integration |

---

## 6. Out of Scope (v1.0)

- Online payment gateway integration
- WhatsApp notification (planned v1.1)
- Customer mobile app (native iOS/Android)
- Loyalty points beyond current membership model

---

## 7. Assumptions & Constraints

- Multi-branch deployment; single shared database instance (all branches share one PostgreSQL DB, filtered by branch_id)
- Internet connectivity available but not guaranteed at POS (offline-first POS)
- Staff literacy in Bahasa Indonesia; English option for owner review
- Thermal printer NOT required for v1.0 (browser print to PDF/paper)
- Server: VPS or local machine with Node.js 20+ and PostgreSQL 15+

---

## 8. Glossary

| Term | Meaning |
|---|---|
| Kasir | Cashier / counter staff |
| Pelanggan | Customer |
| Kiloan | Weight-based laundry service (per kg) |
| Satuan | Per-item laundry service |
| Paket Kg | Pre-paid weight package |
| Periodik | Time-based membership (3/6/12 months) |
| FIFO | First In, First Out inventory costing |
