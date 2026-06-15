# Laundry Palu — Sistem Manajemen Laundry
**Bilingual PWA | Bahasa Indonesia (default) / English**

A full-stack Progressive Web App for managing a laundry business in Palu, Central Sulawesi, Indonesia.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS + shadcn/ui |
| Backend | Fastify 4 + Zod |
| Database | PostgreSQL 15 |
| Auth | JWT (HTTP-only cookie) |
| Testing | Vitest + Supertest |
| PWA | next-pwa (Service Worker + manifest) |

---

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm 10+

### 1. Clone and install
```bash
git clone https://github.com/your-org/laundry-palu.git
cd laundry-palu
npm install
```

### 2. Environment
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials and a random JWT_SECRET
```

### 3. Database setup
```bash
cd apps/api
npm run db:reset   # creates DB, runs migrations, seeds sample data
```

### 4. Start development servers
```bash
cd ../..
npm run dev
# Web: http://localhost:3000
# API: http://localhost:4000
```

### Default login credentials (sample data)
| Username | Password | Role |
|---|---|---|
| admin | password123 | Admin |
| kasir1 | password123 | Kasir |
| kasir2 | password123 | Kasir |

---

## Documentation

| Document | Location |
|---|---|
| Product Requirements (PRD) | `docs/PRD.md` |
| Architecture & DB Schema | `docs/ARCHITECTURE.md` |
| Agent/AI Coding Guide | `AGENTS.md` (symlink → `CLAUDE.md`) |
| Sample Data SQL | `apps/api/migrations/002_seed.sql` |

---

## Development

```bash
# Type checking
npm run typecheck

# Tests
npm run test

# Linting
npm run lint

# Production build
npm run build
```

---

## Feature Summary

- ✅ User & role management (Admin / Kasir)
- ✅ Customer management with order history
- ✅ Membership (Periodik 3/6/12 bulan + Paket Kg 50/100/200kg)
- ✅ Laundry service item catalog
- ✅ POS: new order + QR scan update status
- ✅ Order tracking lifecycle (6 stages)
- ✅ Public customer tracking page (no login, QR or phone number)
- ✅ Expense entry + category management
- ✅ Inventory management with FIFO costing
- ✅ Admin dashboard with revenue KPIs + charts
- ✅ Daily, Monthly, Income Statement reports
- ✅ Printable A5 invoice with QR code
- ✅ Offline-capable POS (IndexedDB queue + Background Sync)
- ✅ i18n: Bahasa Indonesia default, English toggle
- ✅ PWA: installable on Android & iOS
- ✅ WhatsApp receipt + ready-for-collection notifications (admin-editable templates; sending disabled by default — scaffold)

---

## WhatsApp Notifications (scaffold)

Customers are automatically messaged on WhatsApp when payment is recorded (payment receipt)
and when an order is marked ready for collection. Admins manage the two message templates at
**`/message-templates`** (header/footer editable; order details rendered automatically).

Sending is **disabled by default** — until a provider is configured the backend only *logs*
the rendered message and records each attempt in the `notification_log` table. To enable, set
the WhatsApp connection fields in **Settings → Koneksi WhatsApp** (stored as `whatsapp_*` keys
in the `settings` table: `whatsapp_enabled`, `whatsapp_provider`, `whatsapp_api_url`,
`whatsapp_api_key`, `whatsapp_sender`) and implement a real provider adapter in
`apps/api/src/lib/whatsapp/adapters/`. See `docs/ARCHITECTURE.md` §9.

---

## License
MIT — see LICENSE file.
