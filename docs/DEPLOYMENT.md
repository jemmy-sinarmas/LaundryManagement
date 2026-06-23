# Deployment Runbook — Laundry Palu (containers, fresh Linux)

Step-by-step guide to host Laundry Palu on a **brand-new Linux server**, in
**Docker containers**, behind a single **HTTPS** origin. You build the images
**on the server** (no registry/CI needed) and put **Caddy** in front for
automatic TLS.

## Architecture

```
                         Internet (443/80)
                               │
                          ┌────▼────┐
                          │  Caddy  │  auto-TLS (Let's Encrypt)
                          └────┬────┘
                 /api/*  ──────┤────── everything else
                          ┌────▼────┐        ┌────▼────┐
                          │   api   │        │   web   │
                          │ :4000   │        │ :3000   │
                          └────┬────┘        └─────────┘
                          ┌────▼────┐
                          │ postgres│  (named volume, localhost-only port)
                          └─────────┘
```

**One origin, path-based routing.** The browser only ever talks to
`https://YOUR_DOMAIN`. Caddy serves the web app at `/` and proxies `/api/*` to
the API (stripping the `/api` prefix). This matters because:

- The API sets the auth **cookie**, and the **web app's own middleware reads
  that same cookie** to gate pages — so the cookie must be **same-origin** with
  the web app. Separate `app.`/`api.` subdomains would break this.
- Same origin ⇒ **no CORS** to configure.
- The web image bakes a **portable** `NEXT_PUBLIC_API_URL=/api` (no domain
  hardcoded), so the same build works on any host.

Only Caddy is exposed to the internet. `web`, `api`, and `postgres` stay on the
internal Docker network.

---

## 1. Prerequisites

- A Linux server (Ubuntu 22.04+/Debian 12 assumed below), ~2 vCPU / 2 GB RAM, with
  a non-root sudo user.
- A **domain name** with a DNS **A record** pointing at the server's public IP
  (e.g. `laundry.example.com → 203.0.113.10`). TLS will not issue without this.
- Inbound **ports 80 and 443** open to the internet.

Verify DNS before you start (should print your server IP):

```bash
dig +short laundry.example.com
```

---

## 2. Install Docker Engine + Compose plugin

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
newgrp docker            # apply the group in this shell (or log out/in)
docker --version
docker compose version
```

---

## 3. Get the code

```bash
git clone <YOUR_REPO_URL> laundry-palu
cd laundry-palu
```

All commands below are run from the repo root.

---

## 4. Configure environment

Create `.env` from the template and fill in real values:

```bash
cp .env.deploy.example .env
```

Generate strong secrets:

```bash
openssl rand -base64 24    # use for POSTGRES_PASSWORD
openssl rand -base64 48    # use for JWT_SECRET (must be >= 32 chars)
```

Edit `.env`:

```ini
DOMAIN=laundry.example.com
ACME_EMAIL=you@example.com

POSTGRES_DB=laundry_palu
POSTGRES_USER=laundry
POSTGRES_PASSWORD=<the openssl value>
DATABASE_URL=postgres://laundry:<same password>@postgres:5432/laundry_palu

JWT_SECRET=<the 48-char openssl value>
JWT_EXPIRES_IN=8h
```

Notes:
- `DATABASE_URL` host is the compose service name **`postgres`** (not localhost).
- The **same `JWT_SECRET`** is used by both the API and the web middleware —
  do not use two different values, or login will appear to succeed but every
  page redirects back to `/login`.
- If your DB password contains `@` or `:`, percent-encode it in `DATABASE_URL`
  (`@`→`%40`, `:`→`%3A`).
- `NEXT_PUBLIC_API_URL` is **not** in `.env` — it's a build-time value baked in
  as `/api` by `docker-compose.deploy.yml`.

---

## 5. Build the images on the server

```bash
docker compose -f docker-compose.deploy.yml build
```

This compiles the shared package, the Fastify API, and the Next.js web app
(standalone output, with `NEXT_PUBLIC_API_URL=/api` baked in). First build pulls
base images and can take several minutes.

---

## 6. Start Postgres, then run migrations + seed

Bring up the database and wait until it reports healthy:

```bash
docker compose -f docker-compose.deploy.yml up -d postgres
docker compose -f docker-compose.deploy.yml ps        # wait for postgres = healthy
```

Apply the schema **and** seed the initial users (**`--seed` is required on the
first deploy** — without it there are no login accounts):

```bash
docker compose -f docker-compose.deploy.yml run --rm api \
  node apps/api/dist/migrations/run.js --seed
```

This creates the schema and seeds the default accounts (all password
`password123`):

| Username | Role  |
|----------|-------|
| `admin`  | admin |
| `kasir1` | kasir |
| `kasir2` | kasir |
| `kasir3` | kasir |

> **Change the `admin` password immediately after first login** (it is a
> well-known default).

---

## 7. Start the full stack

```bash
docker compose -f docker-compose.deploy.yml up -d
```

Caddy now requests a Let's Encrypt certificate for `DOMAIN` on the first HTTPS
hit (give it ~30s). Watch it happen:

```bash
docker compose -f docker-compose.deploy.yml logs -f caddy
```

---

## 8. Verify

```bash
docker compose -f docker-compose.deploy.yml ps          # all services Up / healthy
curl -fsS https://laundry.example.com/api/health         # {"status":"ok"}
curl -fsS https://laundry.example.com/api/ready          # {"status":"ready"}
```

Then open `https://laundry.example.com` in a browser and log in as `admin` /
`password123`. A successful login that lands you on the dashboard confirms the
same-origin cookie + shared `JWT_SECRET` path is working end to end.

---

## 9. Firewall

Expose only HTTP/HTTPS; never publish 3000/4000/5432 to the internet (the
deploy compose already keeps them internal):

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp
sudo ufw enable
```

---

## 10. Day-2 operations

### Logs

```bash
docker compose -f docker-compose.deploy.yml logs -f api
docker compose -f docker-compose.deploy.yml logs -f web
```

### Update / redeploy a new version

```bash
git pull
docker compose -f docker-compose.deploy.yml build
# apply any new schema migrations (no --seed on updates):
docker compose -f docker-compose.deploy.yml run --rm api \
  node apps/api/dist/migrations/run.js
docker compose -f docker-compose.deploy.yml up -d
```

The migration runner is idempotent — it tracks applied files in a
`schema_migrations` table and skips ones already run.

### Daily database backup (cron)

```bash
sudo mkdir -p /var/backups/laundry-palu
```

Add to `crontab -e` (daily 02:00, keep 14 days):

```cron
0 2 * * * cd /home/youruser/laundry-palu && docker compose -f docker-compose.deploy.yml exec -T postgres pg_dump -U laundry laundry_palu | gzip > /var/backups/laundry-palu/db-$(date +\%F).sql.gz && find /var/backups/laundry-palu -name 'db-*.sql.gz' -mtime +14 -delete
```

Restore a dump:

```bash
gunzip -c /var/backups/laundry-palu/db-YYYY-MM-DD.sql.gz | \
  docker compose -f docker-compose.deploy.yml exec -T postgres psql -U laundry -d laundry_palu
```

### Stop / start

```bash
docker compose -f docker-compose.deploy.yml stop
docker compose -f docker-compose.deploy.yml up -d
```

---

## 11. Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| TLS cert never issues; Caddy logs ACME errors | DNS A record not pointing at this server, or port 80/443 blocked. Fix DNS/firewall; Caddy retries automatically. |
| `502 Bad Gateway` | `api` or `web` not up/healthy yet. `docker compose -f docker-compose.deploy.yml ps` and check that service's logs. |
| Login succeeds but every page bounces to `/login` | `JWT_SECRET` differs between api and web, or is missing. Ensure one value in `.env` and `up -d` again. |
| API exits with an env validation error | A required var is missing/too short. `JWT_SECRET` must be ≥32 chars; check `DATABASE_URL`. See `apps/api/src/config/env.ts`. |
| `db:reset` / migrate can't connect | Postgres not healthy yet, or `DATABASE_URL` host isn't `postgres`. Bring up postgres first (step 6). |
| No accounts to log in with | You skipped `--seed` on first deploy. Re-run the migrate command in step 6 with `--seed`. |

---

## Appendix — Alternative: prebuilt images from GHCR

If you'd rather have CI build the images and pull them (instead of building on
the server), use `docker-compose.prod.yml` with `.env.prod.example`. That path
requires the GitHub Actions `deploy.yml` workflow to have pushed images to GHCR
and a `docker login ghcr.io`. Note its web image bakes whatever
`NEXT_PUBLIC_API_URL` the workflow passed — for the same-origin setup above,
build it with `NEXT_PUBLIC_API_URL=/api`. The build-on-server flow in this
runbook is simpler for a single self-hosted box.
