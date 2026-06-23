# Deployment Runbook — Laundry Palu (containers, fresh Linux)

Step-by-step guide to host Laundry Palu on a **brand-new Linux server**, in
**Docker containers**, behind a single **HTTPS** origin. You build the images
**on the server** (no registry/CI needed) and put **Caddy** in front for
automatic TLS. **PostgreSQL is external** — it runs on the host, and the
containers connect to it.

## Architecture

```
                         Internet (443/80)
                               │
   ┌───────────────────────────┼──────────────────── Docker network ──┐
   │                      ┌────▼────┐                                   │
   │                      │  Caddy  │  auto-TLS (Let's Encrypt)         │
   │                      └────┬────┘                                   │
   │             /api/*  ──────┤────── everything else                 │
   │                      ┌────▼────┐        ┌────▼────┐                │
   │                      │   api   │        │   web   │                │
   │                      │ :4000   │        │ :3000   │                │
   │                      └────┬────┘        └─────────┘                │
   └───────────────────────────┼──────────────────────────────────────┘
                  host.docker.internal:5432
                               │
                       ┌───────▼────────┐
                       │  PostgreSQL    │  on the HOST (not a container)
                       │  (host process)│
                       └────────────────┘
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

Only Caddy is exposed to the internet. `web` and `api` stay on the internal
Docker network; PostgreSQL runs on the host and is reached by the `api` container
via `host.docker.internal`.

---

## 1. Prerequisites

- A Linux server (Ubuntu 22.04+/Debian 12 assumed below), ~2 vCPU / 2 GB RAM, with
  a non-root sudo user.
- A **domain name** with a DNS **A record** pointing at the server's public IP
  (e.g. `laundry.example.com → 203.0.113.10`). TLS will not issue without this.
- Inbound **ports 80 and 443** open to the internet.
- An **existing PostgreSQL server running on this host** with the `laundry_palu`
  database created and credentials you know. You do **not** need a Postgres
  *container* — but the host Postgres must be reachable from inside a container
  (see step 1a).

You do **not** need to install Node, Caddy, or Postgres-as-a-container on the
host — the api/web/Caddy runtimes all come down as Docker images. The only host
software is **Docker** (step 2) and your **existing PostgreSQL**.

Verify DNS before you start (should print your server IP):

```bash
dig +short laundry.example.com
```

### 1a. Make the host PostgreSQL reachable from containers

Create the database (once):

```bash
sudo -u postgres psql -c "CREATE DATABASE laundry_palu;"
```

A container cannot reach a Postgres that only listens on `127.0.0.1`. Allow the
Docker bridge network to connect:

1. **Listen beyond loopback** — in `postgresql.conf` (e.g.
   `/etc/postgresql/15/main/postgresql.conf`):

   ```conf
   listen_addresses = '*'
   ```

2. **Allow the Docker bridge subnet** — add to `pg_hba.conf` (e.g.
   `/etc/postgresql/15/main/pg_hba.conf`). `172.16.0.0/12` covers the default
   `172.17.0.0/16` bridge:

   ```conf
   host    all    all    172.16.0.0/12    scram-sha-256
   ```

3. Restart Postgres:

   ```bash
   sudo systemctl restart postgresql
   ```

> Keep port 5432 firewalled from the public internet (step 9) — these changes only
> need to permit the local Docker bridge, not the outside world.

Verify the host DB is reachable from a container (should print connection info for
`laundry_palu`):

```bash
docker run --rm --add-host host.docker.internal:host-gateway postgres:15 \
  psql "postgresql://postgres:Admin%40123@host.docker.internal:5432/laundry_palu" -c '\conninfo'
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

Generate a strong JWT secret:

```bash
openssl rand -base64 48    # use for JWT_SECRET (must be >= 32 chars)
```

Edit `.env`:

```ini
DOMAIN=laundry.example.com
ACME_EMAIL=you@example.com

# External Postgres on the host. Host = host.docker.internal (NOT localhost).
# Percent-encode reserved chars in the password: @ -> %40, : -> %3A.
DATABASE_URL=postgresql://postgres:Admin%40123@host.docker.internal:5432/laundry_palu

JWT_SECRET=<the 48-char openssl value>
JWT_EXPIRES_IN=8h
```

Notes:
- `DATABASE_URL` host is **`host.docker.internal`** — this resolves to the Docker
  host (where your Postgres runs) via the `extra_hosts` mapping on the `api`
  service. Do **not** use `localhost`: inside a container that points at the
  container itself, not the host.
- **Percent-encode the password.** The example password `Admin@123` is written as
  `Admin%40123` because a raw `@` is a URL delimiter (`:`→`%3A` likewise).
- The **same `JWT_SECRET`** is used by both the API and the web middleware —
  do not use two different values, or login will appear to succeed but every
  page redirects back to `/login`.
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

## 6. Run migrations + seed against the external database

With the host Postgres reachable (step 1a) and `.env` configured, apply the schema
**and** seed the initial users (**`--seed` is required on the first deploy** —
without it there are no login accounts):

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

Expose only HTTP/HTTPS. The deploy compose keeps `web`/`api` (3000/4000) internal,
and the host **Postgres (5432) must never be reachable from the internet** — it
only needs to accept connections from the local Docker bridge (step 1a). `ufw`
does not filter Docker's bridge traffic, so the rules below are safe:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp
sudo ufw enable
```

Do **not** add a public `allow 5432` rule. If you want to be explicit, deny it:

```bash
sudo ufw deny 5432/tcp
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

Postgres is on the host now, so back it up with the host's own `pg_dump` (install
the matching client with `sudo apt install postgresql-client` if it isn't already
present):

```bash
sudo mkdir -p /var/backups/laundry-palu
```

Add to `crontab -e` (daily 02:00, keep 14 days). `PGPASSWORD` here is the **raw**
password (`Admin@123`, not percent-encoded — encoding only applies inside the URL):

```cron
0 2 * * * PGPASSWORD='Admin@123' pg_dump -h localhost -U postgres laundry_palu | gzip > /var/backups/laundry-palu/db-$(date +\%F).sql.gz && find /var/backups/laundry-palu -name 'db-*.sql.gz' -mtime +14 -delete
```

Restore a dump:

```bash
gunzip -c /var/backups/laundry-palu/db-YYYY-MM-DD.sql.gz | \
  PGPASSWORD='Admin@123' psql -h localhost -U postgres -d laundry_palu
```

> No host `pg_dump`? Run it from a throwaway container instead:
> `docker run --rm --add-host host.docker.internal:host-gateway postgres:15 \`
> `pg_dump "postgresql://postgres:Admin%40123@host.docker.internal:5432/laundry_palu" | gzip > db.sql.gz`

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
| Migrate/API can't connect to the DB (`ECONNREFUSED` / timeout) | Host Postgres only listening on loopback (`listen_addresses`), `pg_hba.conf` doesn't allow the Docker bridge subnet, or the `extra_hosts: host.docker.internal:host-gateway` mapping is missing. See step 1a; verify with the `\conninfo` one-liner. |
| DB auth fails / URL parses wrong host | `@` or `:` in the password not percent-encoded (`Admin@123` → `Admin%40123`), or you used `localhost` instead of `host.docker.internal`. Fix `DATABASE_URL` in `.env`. |
| `database "laundry_palu" does not exist` | Create it on the host: `sudo -u postgres psql -c "CREATE DATABASE laundry_palu;"` (step 1a). |
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
