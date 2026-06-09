# Architecture Document
## Laundry Palu — System Architecture
**Version:** 1.0.0  
**Date:** 2025-06-06

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Admin/Kasir  │  │   Customer   │  │  Print (browser) │  │
│  │  PWA (Next)  │  │ Tracking PWA │  │   Invoice A5     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────┘  │
└─────────┼─────────────────┼───────────────────────────────  ┘
          │  HTTPS/REST     │  HTTPS/REST (public, no auth)
┌─────────▼─────────────────▼───────────────────────────────  ┐
│                   BACKEND (Fastify)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │ Auth Plugin │  │ RBAC Plugin │  │  Route Plugins       │ │
│  │ (JWT/cookie)│  │             │  │  /api/v1/*           │ │
│  └─────────────┘  └─────────────┘  └──────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐│
│  │                  Service Layer                           ││
│  │  UserSvc  CustomerSvc  MembershipSvc  OrderSvc           ││
│  │  ItemSvc  ExpenseSvc   InventorySvc   ReportSvc          ││
│  └──────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────┐│
│  │              Repository Layer (pg/postgres.js)           ││
│  └──────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────  ┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  PostgreSQL 15                               │
│   Schema: public  (all tables)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR + CSR hybrid; great PWA support; file-based routing |
| UI | Tailwind CSS + shadcn/ui | Fast development; accessible components |
| State | Zustand + React Query | Lightweight; server state separate from UI state |
| i18n | next-i18next | Simple JSON-based translation; Bahasa Indonesia default |
| Backend | Fastify 4 | Fast; low overhead; plugin-based; TypeScript-native |
| ORM/DB | postgres.js (raw SQL) | Simple; no magic; full control; KISS principle |
| Database | PostgreSQL 15 | Reliable; JSON support; excellent for financial data |
| Auth | JWT in HTTP-only cookie | Secure; stateless; works with Next.js middleware |
| QR Code | qrcode (Node) / react-qr-code | Generate invoice QR server-side or client-side |
| PWA | next-pwa | Service Worker + manifest via Next.js |
| Testing | Vitest + Supertest | Fast unit/integration tests |

---

## 3. Repository Structure (MECE)

```
laundry-palu/
│
├── AGENTS.md                   # Agent/AI coding instructions (symlink → CLAUDE.md)
├── CLAUDE.md                   # Primary agent spec
├── README.md                   # Human-readable project overview
├── docker-compose.yml          # Local dev: postgres + app
├── .env.example                # Environment variable template
│
├── apps/
│   ├── web/                    # Next.js 14 frontend (PWA)
│   │   ├── public/
│   │   │   ├── manifest.json   # PWA manifest
│   │   │   ├── sw.js           # Service worker (generated by next-pwa)
│   │   │   └── icons/          # App icons (192x192, 512x512)
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   │   ├── (auth)/
│   │   │   │   │   └── login/
│   │   │   │   ├── (admin)/    # Admin-only layout
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── users/
│   │   │   │   │   ├── customers/
│   │   │   │   │   ├── membership/
│   │   │   │   │   ├── items/
│   │   │   │   │   ├── expenses/
│   │   │   │   │   ├── inventory/
│   │   │   │   │   └── reports/
│   │   │   │   ├── (kasir)/    # Cashier layout
│   │   │   │   │   ├── pos/
│   │   │   │   │   └── orders/
│   │   │   │   └── track/      # Public: customer order tracking
│   │   │   │       └── [invoiceId]/
│   │   │   ├── components/
│   │   │   │   ├── ui/         # shadcn/ui base components
│   │   │   │   ├── layout/     # Sidebar, Header, BottomNav
│   │   │   │   ├── pos/        # POS-specific components
│   │   │   │   ├── reports/    # Chart components
│   │   │   │   └── invoice/    # PrintableInvoice component
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── lib/
│   │   │   │   ├── api.ts      # API client (fetch wrapper)
│   │   │   │   ├── auth.ts     # Auth helpers
│   │   │   │   └── utils.ts    # Shared utilities
│   │   │   ├── store/          # Zustand stores
│   │   │   │   ├── authStore.ts
│   │   │   │   └── posStore.ts # Offline order queue
│   │   │   └── i18n/
│   │   │       ├── id.json     # Bahasa Indonesia (default)
│   │   │       └── en.json     # English
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   └── api/                    # Fastify backend
│       ├── src/
│       │   ├── server.ts       # Entry point; plugin registration
│       │   ├── plugins/
│       │   │   ├── auth.ts     # JWT plugin
│       │   │   ├── cors.ts
│       │   │   └── db.ts       # postgres.js connection pool (decorated on fastify instance)
│       │   ├── routes/
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── customers/
│       │   │   ├── membership/
│       │   │   ├── items/
│       │   │   ├── orders/
│       │   │   ├── expenses/
│       │   │   ├── inventory/
│       │   │   ├── reports/
│       │   │   └── tracking/   # Public, no auth
│       │   ├── services/       # Business logic (pure functions)
│       │   │   ├── order.service.ts
│       │   │   ├── membership.service.ts
│       │   │   ├── inventory.service.ts
│       │   │   └── report.service.ts
│       │   ├── repositories/   # DB access (SQL only, no ORM magic)
│       │   │   ├── user.repo.ts
│       │   │   ├── customer.repo.ts
│       │   │   ├── order.repo.ts
│       │   │   └── ...
│       │   ├── schemas/        # Zod + JSON Schema for validation
│       │   └── utils/
│       │       ├── invoice.ts  # Invoice ID generation
│       │       └── fifo.ts     # FIFO cost calculation
│       ├── migrations/         # Raw SQL migration files
│       │   ├── 001_init.sql
│       │   ├── 002_seed.sql    # Sample data
│       │   └── run.ts          # Migration runner
│       ├── tests/
│       │   ├── unit/
│       │   └── integration/
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared types/constants (imported by both apps)
│       ├── src/
│       │   ├── types.ts        # Shared TypeScript interfaces
│       │   └── constants.ts    # Order statuses, membership types, etc.
│       └── package.json
│
└── docs/
    ├── PRD.md
    ├── ARCHITECTURE.md         # This file
    ├── AGENTS.md               # Agent spec
    └── database/
        ├── ERD.md              # Entity Relationship Diagram (text)
        └── schema.sql          # Canonical schema reference
```

---

## 4. Database Schema

### 4.1 Entity Relationship (simplified)

```
branches ──< users
    │
    ├──< orders >────── customers
    │        │               │
    │    order_items     memberships
    │        │
    │      items (per branch)
    │
    ├──< expenses >────── expense_categories (global)
    │
    └──< inventory_items >────── inventory_transactions
```

### 4.2 Tables

```sql
-- ─────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        VARCHAR(100) NOT NULL,
  username    VARCHAR(50) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,   -- bcrypt
  role        VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'kasir')),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- CUSTOMERS
-- ─────────────────────────────────────────────
CREATE TABLE customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        VARCHAR(100) NOT NULL,
  alamat      TEXT,
  no_hp       VARCHAR(20) UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- MEMBERSHIPS
-- ─────────────────────────────────────────────
CREATE TABLE memberships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  tipe            VARCHAR(20) NOT NULL CHECK (tipe IN ('periodik', 'paket_kg')),
  -- Periodik fields
  durasi_bulan    INTEGER,              -- 3, 6, or 12
  tanggal_mulai   DATE,
  tanggal_selesai DATE,
  -- Paket Kg fields
  paket_kg        DECIMAL(10,2),        -- 50, 100, 200
  sisa_kg         DECIMAL(10,2),
  -- common
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ITEMS (laundry services)
-- ─────────────────────────────────────────────
CREATE TABLE items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        VARCHAR(100) NOT NULL,
  tipe        VARCHAR(20) NOT NULL CHECK (tipe IN ('satuan', 'kiloan', 'jasa_lain')),
  harga       BIGINT NOT NULL,          -- IDR in whole rupiah
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ORDERS (invoices)
-- ─────────────────────────────────────────────
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no      VARCHAR(30) UNIQUE NOT NULL, -- e.g. INV-20250606-0001
  customer_id     UUID NOT NULL REFERENCES customers(id),
  membership_id   UUID REFERENCES memberships(id),
  diskon_persen   DECIMAL(5,2) DEFAULT 0,
  subtotal        BIGINT NOT NULL,       -- before discount
  diskon_amount   BIGINT DEFAULT 0,
  total           BIGINT NOT NULL,       -- after discount
  status          VARCHAR(30) NOT NULL DEFAULT 'diterima'
                    CHECK (status IN ('diterima','dicuci','dikeringkan',
                                      'dibungkus','siap_diambil','selesai')),
  catatan         TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ORDER ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES items(id),
  nama_item   VARCHAR(100) NOT NULL,    -- snapshot at time of order
  tipe        VARCHAR(20) NOT NULL,     -- snapshot
  harga       BIGINT NOT NULL,          -- snapshot
  qty         DECIMAL(10,2) NOT NULL,   -- units or kg
  subtotal    BIGINT NOT NULL
);

-- ─────────────────────────────────────────────
-- ORDER STATUS HISTORY
-- ─────────────────────────────────────────────
CREATE TABLE order_status_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id),
  status      VARCHAR(30) NOT NULL,
  changed_by  UUID REFERENCES users(id),
  changed_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- EXPENSE CATEGORIES
-- ─────────────────────────────────────────────
CREATE TABLE expense_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        VARCHAR(100) NOT NULL,
  level       VARCHAR(20) NOT NULL CHECK (level IN ('variabel', 'tetap')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- EXPENSES
-- ─────────────────────────────────────────────
CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal         DATE NOT NULL,
  jumlah          BIGINT NOT NULL,
  category_id     UUID NOT NULL REFERENCES expense_categories(id),
  deskripsi       TEXT,
  inventory_item_id UUID REFERENCES inventory_items(id),  -- optional link
  qty_used        DECIMAL(10,2),
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INVENTORY ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE inventory_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama            VARCHAR(100) NOT NULL,
  satuan          VARCHAR(30) NOT NULL,  -- pcs, liter, kg, etc.
  qty_saat_ini    DECIMAL(10,2) DEFAULT 0,
  harga_rata_fifo BIGINT DEFAULT 0,
  stok_minimum    DECIMAL(10,2) DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INVENTORY TRANSACTIONS (FIFO ledger)
-- ─────────────────────────────────────────────
CREATE TABLE inventory_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID NOT NULL REFERENCES inventory_items(id),
  tipe            VARCHAR(10) NOT NULL CHECK (tipe IN ('masuk', 'keluar')),
  qty             DECIMAL(10,2) NOT NULL,
  harga_per_unit  BIGINT,              -- for 'masuk' transactions
  referensi       TEXT,                -- e.g. expense_id or manual
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- BRANCHES (v1.1)
-- ─────────────────────────────────────────────
CREATE TABLE branches (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama       VARCHAR(100) NOT NULL,
  kode       VARCHAR(10) UNIQUE NOT NULL,   -- short code e.g. PLW, PLT
  alamat     TEXT,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- branch_id added to: users (nullable), items, orders, inventory_items, expenses
-- pickup_token UUID UNIQUE added to orders

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_invoice_no ON orders(invoice_no);
CREATE INDEX idx_customers_no_hp ON customers(no_hp);
CREATE INDEX idx_expenses_tanggal ON expenses(tanggal);
CREATE INDEX idx_inventory_trans_item ON inventory_transactions(item_id);
```

---

## 5. API Design

### Base URL
`/api/v1`

### Authentication
All endpoints except `/api/v1/auth/login` and `/api/v1/track/*` require JWT in HTTP-only cookie.

### Key Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| POST | /auth/login | Public | Login, returns JWT cookie |
| DELETE | /auth/logout | Any | Clear cookie |
| GET | /users | Admin | List users |
| POST | /users | Admin | Create user |
| GET | /customers | Admin, Kasir | List/search customers |
| POST | /customers | Admin, Kasir | Create customer |
| GET | /membership/:customerId | Admin, Kasir | Get active membership |
| POST | /membership | Admin | Create membership |
| GET | /items | Admin, Kasir | List active items |
| POST | /orders | Admin, Kasir | Create order (POS) |
| PATCH | /orders/:id/status | Admin, Kasir | Update order status |
| GET | /orders | Admin, Kasir | List orders (filterable) |
| POST | /expenses | Admin, Kasir | Record expense |
| GET | /inventory | Admin | List inventory |
| POST | /inventory/transaction | Admin | Add/remove stock |
| GET | /reports/daily | Admin | Daily report |
| GET | /reports/monthly | Admin | Monthly revenue |
| GET | /reports/income-statement | Admin | Income statement |
| GET | /track/:invoiceNo | Public | Customer order tracking |
| GET | /branches | Admin | List branches |
| POST | /branches | Admin | Create branch |
| PATCH | /branches/:id | Admin | Update branch |
| GET | /orders/pickup/:token | Kasir, Admin | Fetch order by pickup token |
| PATCH | /orders/pickup/:token/complete | Kasir, Admin | Validate pickup → advance to selesai |

---

## 6. PWA Offline Strategy

| Resource | Strategy |
|---|---|
| App shell (HTML, CSS, JS) | Cache First |
| API GET requests | Network First with stale fallback |
| POS order creation (offline) | Background Sync — queue in IndexedDB, sync on reconnect |
| Images/icons | Cache First |

Offline capability is critical for POS. Orders created while offline are stored in the browser's IndexedDB `offline_orders` store and synced via Background Sync API when connectivity is restored.

---

## 7. Security

- Passwords: bcrypt with cost factor 12
- JWT: HS256, 8-hour expiry, HTTP-only SameSite=Strict cookie
- Input validation: Zod schemas on all API inputs
- SQL: parameterised queries only (postgres.js tagged template literals)
- CORS: restricted to own domain in production
- Rate limiting: Fastify rate-limit plugin (100 req/min per IP on auth routes)
- HTTPS: enforced at reverse proxy (nginx/caddy)

---

## 8. Deployment (Single VPS)

```
Internet → nginx (TLS termination) → Next.js (port 3000) + Fastify (port 4000)
                                          └─── PostgreSQL (port 5432, local)
```

- Process manager: PM2
- Backup: cron `pg_dump` daily → `/var/backups/laundry-palu/`
- Environment variables via `.env` (never committed)
