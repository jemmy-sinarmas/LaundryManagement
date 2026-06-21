# 08 — Operations

> Long-form deployment + security: [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) §7–§9.

## Topology (single VPS)

```
Internet → nginx (TLS) → Next.js :3000 + Fastify :4000
                              └── PostgreSQL :5432 (local)
```

- Process manager: **PM2** (`ecosystem.config.cjs`).
- Containers: `Dockerfile.api`, `Dockerfile.web`, `docker-compose.yml` (postgres + api + web).
- Backups: daily `pg_dump` (cron) → local file (optional S3).
- Health: orchestrators probe `GET /health` (liveness) and `GET /ready` (DB reachable).

## Environment variables

| Var | App | Notes |
|---|---|---|
| `DATABASE_URL` | api | required |
| `JWT_SECRET` | api | **≥ 32 chars** (enforced by `loadEnv`) |
| `JWT_EXPIRES_IN` | api | default `8h` |
| `PORT` | api | default `4000` |
| `CORS_ORIGIN` | api | default `http://localhost:3000` |
| `NODE_ENV` | both | `development` / `production` / `test` |
| `NEXT_PUBLIC_API_URL` | web | backend URL |

Never commit `.env`; use `.env.example`. `loadEnv()` fails fast on a bad/missing var
([`01-architecture.md`](./01-architecture.md)).

## Deploy checklist

1. Set/verify all env vars.
2. Run migrations on the target: `pnpm --filter @laundry-palu/api run migrate`.
3. Build: `pnpm run build`. Never deploy with a red test suite.
4. Start under PM2.
5. **Smoke test:** login → POS → create order → tracking page. Always hit the public tracking
   routes (`/api/v1/track/t/:token` and `/api/v1/track/:invoiceNo`).
6. Log the deploy in [`aidlc-docs/audit.md`](../../aidlc-docs/audit.md).

## WhatsApp notifications (scaffold — disabled by default)

Customers can receive a WhatsApp message at two lifecycle points: **payment receipt** (`POST
/orders`) and **ready for collection** (status → `siap_diambil`). Both fire **fire-and-forget**
from the order route handlers, so a notification failure can never affect the order.

- **Provider-agnostic sender** — `apps/api/src/lib/whatsapp/` (`sender.ts`, `render.ts`,
  `index.ts`, `adapters/`). `getSender(config, logger)` returns the **HttpAdapter** when
  `whatsapp_enabled` is true, else the **LogAdapter**.
- **Disabled by default:** with `whatsapp_enabled='false'` (seeded default) no live call is made —
  the rendered message is logged and written to `notification_log` with status `skipped`. To go
  live: wire a real provider (Fonnte/Wablas/Watzap/Meta) into the `HttpAdapter` and flip the flag.
- **Config is NOT env-based** — it lives in the `settings` table: `whatsapp_enabled`,
  `whatsapp_provider`, `whatsapp_api_url`, `whatsapp_api_key`, `whatsapp_sender` (admin-editable).
- **Templates** (`message_templates`): admin edits header + footer only; the order-detail body is
  a fixed system layout rendered in `render.ts`. Indonesian-only for now.
- Every attempt (`sent` / `skipped` / `failed`) is recorded in `notification_log`.

---

*Sources / canonical refs:* [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) §8–§9,
`apps/api/src/lib/whatsapp/`, `ecosystem.config.cjs`, `docker-compose.yml`,
[`AGENTS.md`](../../AGENTS.md) "Environment Variables" + Phase 3 Operations.
