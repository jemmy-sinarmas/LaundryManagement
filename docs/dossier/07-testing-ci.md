# 07 — Testing & CI

## Three test suites

| Suite | Config | Env | Covers |
|---|---|---|---|
| **API unit** | `apps/api/vitest.config.ts` | PGLite (no real DB) | services + utils; all business-rule branches. Mock repositories. |
| **API integration** | `apps/api/vitest.integration.config.ts` | real PostgreSQL `laundry_palu_test` | full request path via `buildApp()` + `fastify.inject()`. 19 tests (customers 11 + orders 8). |
| **Web unit** | `apps/web/vitest.config.ts` | jsdom | POS money math, offline sync, store, and pure helpers. 41 tests. |

### API integration details
- `tests/integration/global-setup.ts` **auto-creates** the `laundry_palu_test` DB and runs
  migrations on first run.
- `beforeEach` truncates all tables; `beforeAll` seeds base data + acquires a JWT once.
- Credentials come from `apps/api/.env.test` (gitignored; CI writes it pointing at its Postgres
  service container).
- Run: `pnpm --filter @laundry-palu/api run test:integration`.

### Web unit details (`apps/web/tests/unit/`)
`calculations.test.ts` (POS math), `offlineSync.test.ts` (stop-on-first-failure queue drain),
`posStore.test.ts` (cart + pending queue), `utils.test.ts` (`formatIDR`/`formatDate`/`cn`),
`escpos.test.ts` (byte builders), `auth.test.ts` (`decodeToken`). jsdom is required because
`posStore` uses `zustand/persist` (localStorage) and the auth tests use `btoa`/`atob`.

## CI gate order — `.github/workflows/ci.yml`

Runs on every push and PRs to `master`/`main`. Postgres 15 service container attached. Steps:

1. checkout → setup Node 20 → setup pnpm 9.1.0 → cache pnpm store
2. `pnpm install --frozen-lockfile`
3. **Typecheck (api + web)** — `pnpm run typecheck`
4. **Lint (api + web)** — `pnpm run lint`
5. **Unit tests (api)** — `pnpm --filter @laundry-palu/api run test`
6. **Unit tests (web)** — `pnpm --filter @laundry-palu/web run test`
7. write `apps/api/.env.test` pointing at the service container
8. **Integration tests** — `pnpm --filter @laundry-palu/api run test:integration`

## Running locally

```bash
pnpm run typecheck      # tsc --noEmit, both apps
pnpm run lint           # eslint, both apps
pnpm run test           # ⚠ api unit tests ONLY (root script)
pnpm --filter @laundry-palu/web run test          # web unit tests
pnpm --filter @laundry-palu/api run test:integration   # needs a reachable Postgres
pnpm run build          # shared → api → web production build
```

> **Gotcha:** the root `pnpm run test` runs **only the API** unit suite. The web suite and the
> integration suite are separate commands (CI runs all three). Don't assume `pnpm test` covers
> the frontend.

---

*Sources / canonical refs:* `apps/api/vitest.config.ts`,
`apps/api/vitest.integration.config.ts`, `apps/web/vitest.config.ts`,
`apps/api/tests/integration/global-setup.ts`, `.github/workflows/ci.yml`,
`package.json` (root scripts), [`AGENTS.md`](../../AGENTS.md) "Testing Standards".
