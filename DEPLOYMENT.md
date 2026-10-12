# Deploying latitude8estate on a VPS with Docker Compose

> **Status: written from the repository, not yet run end to end.** Every command,
> port and variable below was read off `docker-compose.yml`, the Dockerfiles,
> `core/settings.py`, `web/api/main.py` and `scripts/seed.py`. Nobody has
> executed this sequence on a real VPS yet, so treat the first deployment as a
> rehearsal and expect to correct details here as you go.

Target: one small Linux VPS (Ubuntu 22.04/24.04 or Debian 12), everything in
Docker Compose behind a host reverse proxy terminating TLS.

---

## 1. What you are deploying

Eight services. Only three are meant to be reachable from the internet.

| Service | Image / build | Container port | Published by default | Public? |
| --- | --- | --- | --- | --- |
| `postgres` | postgres:15-alpine | 5432 | `5432` | **no** |
| `minio` | minio/minio | 9000, 9001 | `9000`, `9001` | media only, via proxy |
| `minio_init` | minio/mc | — | — | no (runs once, exits) |
| `redis` | redis:7-alpine | 6379 | `6379` | **no** |
| `web_api` | `web/api/Dockerfile`, context `.` | 8000 | `8001` | yes, via proxy |
| `web_ui` | `web/ui/Dockerfile` | 80 (nginx) | `3001` | yes, via proxy |
| `crm_api` | `crm/api/Dockerfile` | 8000 | `8000` | optional |
| `crm_ui` | `crm/ui/Dockerfile` | 80 (nginx) | `3000` | optional |

`crm_api` and `crm_ui` are stubs — `crm_api` imports nothing from `core/` yet.
If you only need the public site, deploy `postgres`, `minio`, `minio_init`,
`redis`, `web_api` and `web_ui` and leave the CRM out.

### Two architectural facts that drive everything below

**The public site is a static build.** `web/ui` is Astro in static mode: during
`npm run build` it fetches the API and bakes the result into HTML. There is no
server rendering and **no fixture fallback** — a build against an unreachable or
empty API fails rather than publishing an empty site. Two consequences:

1. The API must be running *and seeded* **before** the `web_ui` image is built.
2. **Content changes do not appear until you rebuild `web_ui`.** Editing a
   project in the database changes nothing on the live site on its own. Plan for
   a rebuild step in your content workflow.

**`PUBLIC_API_BASE_URL` is a build argument, not a runtime one.** It is compiled
into the HTML and the client bundle. Changing it later means rebuilding the
image. It must be a URL that is reachable **both** from inside the build
container (for the build-time fetches) and from visitors' browsers (for the
forms). Getting this wrong is the single most common way to end up with a site
that looks fine locally and is broken in production.

---

## 2. Before you start: three things that are unsafe as committed

`docker-compose.yml` is written for local development. Do not deploy it
unchanged.

1. **Every datastore port is published on all interfaces.** `5432`, `6379`,
   `9000`, `9001` are bound to `0.0.0.0`. On a VPS with a public IP that puts
   PostgreSQL, Redis and MinIO on the internet. Docker's port publishing writes
   its own iptables rules and **bypasses `ufw`**, so "I enabled the firewall" is
   not protection here.
2. **Every credential is the default.** `postgres/postgres`,
   `minioadmin/minioadmin`, and `AUTH_JWT_SECRET_KEY` defaults to
   `$uper$ecretK3y` in `core/settings.py`.
3. **Credentials are inline in the compose file**, not read from `.env`. The
   `environment:` blocks hardcode them, so editing `.env` alone changes nothing
   for the containers. (`.env` *is* read by `core/settings.py`, which matters for
   anything you run outside a container.)

Section 4 fixes all three with an override file.

---

## 3. Prepare the VPS

Minimum realistic sizing: **2 vCPU, 4 GB RAM, 40 GB disk.** The Astro build is
the memory spike; 2 GB will likely OOM during `npm ci` + `npm run build`. Add
swap if you are on 2 GB.

```bash
# Docker Engine + Compose plugin (official convenience script)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"   # log out and back in
docker compose version            # expect v2.x

# Host firewall. Note this does NOT constrain Docker-published ports.
sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp
sudo ufw enable
```

Clone the repository and point DNS at the server:

```bash
sudo mkdir -p /srv && cd /srv
sudo git clone https://github.com/Kmitza420/latitude8estate.git
sudo chown -R "$USER:$USER" latitude8estate
cd latitude8estate
```

DNS A records, both at the VPS IP:

| Host | Serves |
| --- | --- |
| `example.com` | the public site (`web_ui`) |
| `api.example.com` | the API (`web_api`) |

Using a subdomain for the API keeps the proxy config simple. A single-domain
`/api` prefix also works but means path rewriting; the API mounts its routes at
`/v1/...`, so `/api/v1/...` would need the `/api` stripped before it reaches
uvicorn.

---

## 4. Production configuration

### 4.1 Generate secrets

```bash
cd /srv/latitude8estate
umask 077
cat > .env.prod <<EOF
POSTGRES_PASSWORD=$(openssl rand -hex 24)
MINIO_ROOT_USER=l8e-$(openssl rand -hex 6)
MINIO_ROOT_PASSWORD=$(openssl rand -hex 24)
AUTH_JWT_SECRET_KEY=$(openssl rand -hex 32)
PUBLIC_SITE_ORIGIN=https://example.com
PUBLIC_API_ORIGIN=https://api.example.com
EOF
```

Keep `.env.prod` off git — confirm `.gitignore` covers it before your first
commit on the server.

### 4.2 The override file

Create `docker-compose.prod.yml` beside the committed compose file. Compose
merges them, so this changes only what it names.

```yaml
# docker-compose.prod.yml — production overrides.
#
#   docker compose -f docker-compose.yml -f docker-compose.prod.yml <cmd>
#
# Three jobs: stop publishing datastores to the internet, replace the default
# credentials, and point every browser-facing URL at the real domain.

services:
  postgres:
    # Loopback only. Nothing outside the compose network needs this.
    ports: ["127.0.0.1:5432:5432"]
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

  redis:
    ports: ["127.0.0.1:6379:6379"]

  minio:
    # 9000 stays on loopback; the reverse proxy fronts it for media.
    # 9001 is the admin console — tunnel to it, do not publish it.
    ports:
      - "127.0.0.1:9000:9000"
      - "127.0.0.1:9001:9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}

  minio_init:
    # The bootstrap must authenticate with the new credentials too.
    entrypoint: >
      /bin/sh -c "
      mc alias set local http://minio:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD} &&
      mc mb --ignore-existing local/latitude8estate-media &&
      mc anonymous set download local/latitude8estate-media &&
      mc mb --ignore-existing local/latitude8estate-files &&
      echo 'minio buckets ready'
      "

  web_api:
    ports: ["127.0.0.1:8001:8000"]
    environment:
      # production: disables /docs, /redoc and /openapi.json, and enables
      # TrustedHostMiddleware. See the warning in 4.3 about CORS_ORIGINS.
      ENVIRONMENT: production
      LOG_LEVEL: INFO
      DATABASE_PASSWORD: ${POSTGRES_PASSWORD}
      MINIO_ACCESS_KEY: ${MINIO_ROOT_USER}
      MINIO_SECRET_KEY: ${MINIO_ROOT_PASSWORD}
      AUTH_JWT_SECRET_KEY: ${AUTH_JWT_SECRET_KEY}
      # Browser-facing base for the public media bucket, proxied at /media.
      MINIO_PUBLIC_BASE_URL: ${PUBLIC_SITE_ORIGIN}/media
      # Real origins only. This also becomes the TrustedHost allow-list.
      CORS_ORIGINS: ${PUBLIC_SITE_ORIGIN},${PUBLIC_API_ORIGIN}
    restart: unless-stopped

  web_ui:
    ports: ["127.0.0.1:3001:80"]
    build:
      args:
        # Baked into the static HTML and the client bundle at build time.
        PUBLIC_API_BASE_URL: ${PUBLIC_API_ORIGIN}
        # The enquiry and newsletter endpoints do not exist yet. Leave false
        # until POST /v1/enquiries/ and POST /v1/newsletter/subscriptions/ ship
        # (web/api/TODO.md §4), or both forms will POST into a 404.
        PUBLIC_API_FORMS_ENABLED: "false"
    restart: unless-stopped

  # Not deployed. Remove this block if you do want the CRM.
  crm_api:
    profiles: ["crm"]
  crm_ui:
    profiles: ["crm"]
```

Make the long command tolerable:

```bash
echo 'COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml' >> .env.prod
alias dc='docker compose --env-file .env.prod'
```

Compose reads `.env` for variable substitution by default, not `.env.prod`, so
`--env-file .env.prod` is required on **every** invocation. Omit it and
`${POSTGRES_PASSWORD}` expands to an empty string — which starts a Postgres
with no password or fails outright.

### 4.3 Two configuration traps

**`CORS_ORIGINS` doubles as the TrustedHost allow-list in production.**
`web/api/main.py` builds `allowed_hosts` from the hostnames in `CORS_ORIGINS`
plus `localhost`. If the `Host` header the API receives is not in that list,
every request gets a bare 400 from the middleware, before any route runs — which
looks like the API is broken rather than misconfigured. Whatever hostname your
proxy forwards must appear in `CORS_ORIGINS`.

**`MINIO_PUBLIC_BASE_URL` is a browser URL, not a service URL.** MinIO is
`minio:9000` inside the compose network and something else entirely outside it.
The API embeds this base in every image URL it returns, and those URLs are read
by a browser. Set it to the proxied public path (`https://example.com/media`),
never `http://minio:9000/...`.

---

## 5. Reverse proxy and TLS

Bring the proxy up **before** building `web_ui`, because the build fetches
`PUBLIC_API_BASE_URL` — a public HTTPS URL that must already resolve and serve.

Caddy is the shortest path to working TLS. `/srv/latitude8estate/Caddyfile`:

```
example.com {
    # The public site.
    reverse_proxy 127.0.0.1:3001

    # Public media bucket. The API hands out https://example.com/media/<key>.
    handle_path /media/* {
        reverse_proxy 127.0.0.1:9000 {
            rewrite /latitude8estate-media{uri}
        }
    }
}

api.example.com {
    reverse_proxy 127.0.0.1:8001
}
```

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
sudo cp Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy obtains certificates automatically once DNS resolves and 80/443 are open.
If you prefer nginx + certbot, the proxy targets are the same; keep
`proxy_set_header Host $host` so the TrustedHost check in 4.3 sees the right
hostname.

---

## 6. First deployment

Order matters. This is the sequence from the header of `docker-compose.yml`,
with the production flags added.

```bash
cd /srv/latitude8estate
export COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml

# 1. Datastores. minio_init creates the media bucket and makes it anonymously
#    readable — without it every image 403s.
docker compose --env-file .env.prod up -d postgres minio minio_init redis
docker compose --env-file .env.prod ps          # wait for healthy

# 2. Schema + content. Runs inside the API image, so no host Python is needed.
#    web/api/Dockerfile copies scripts/ in precisely for this.
docker compose --env-file .env.prod run --rm web_api python -m scripts.seed

# 3. The API.
docker compose --env-file .env.prod up -d --build web_api
curl -fsS http://127.0.0.1:8001/health && echo OK

# 4. Confirm the API actually has content. An empty list here means step 5
#    will fail, which is the intended behaviour.
curl -fsS http://127.0.0.1:8001/v1/projects/ | head -c 400

# 5. The static site. Only now, because this build reads the API.
docker compose --env-file .env.prod up -d --build web_ui
```

Note the **trailing slashes** on API paths. `web/api/main.py` builds the app with
`redirect_slashes=False` and registers list routes as `"/"`, so `/v1/projects`
404s where `/v1/projects/` succeeds.

Then check from outside:

```bash
curl -I https://example.com                      # 200, the site
curl -I https://example.com/property-management   # 200, a nested route
curl -fsS https://api.example.com/health          # {"status":"ok"}
curl -I https://example.com/media/<some-key>      # 200, an image
```

### About `scripts/seed.py`

Read its docstring before running it in production. Two things matter:

- **Schema management is `create_all`, not migrations.** It creates missing
  tables and **will not alter an existing one**. Once the schema stops moving,
  introduce Alembic; until then a column change means a manual migration or a
  reset.
- **`--reset` drops everything.** Never run it against a populated production
  database.

The seed is demonstration content — a representative catalogue with deliberate
gaps, plus branded SVG placeholder images uploaded to MinIO. For a real launch
you want the schema created and your own content loaded, not this. `--no-media`
skips the MinIO upload.

---

## 7. Updating a deployment

```bash
cd /srv/latitude8estate
git pull

# API or core changed:
docker compose --env-file .env.prod up -d --build web_api

# UI changed — OR database content changed, OR PUBLIC_API_BASE_URL changed:
docker compose --env-file .env.prod up -d --build web_ui
```

**The second case is the one people forget.** The site is static, so a content
edit is invisible until `web_ui` is rebuilt. If editors expect their changes to
appear, either give them a "publish" button that triggers this rebuild, or run it
on a schedule.

A rebuild takes a minute or two and the old container keeps serving until the new
one is ready, so there is no downtime — but if the build fails, **nothing is
replaced and the previous site stays up.** That is the intended behaviour: a
failed build never publishes an empty site.

---

## 8. Backups

Two named volumes hold all state: `latitude8estate_postgres_data` and
`latitude8estate_minio_data`.

```bash
#!/bin/sh
# /usr/local/bin/l8e-backup.sh
set -eu
cd /srv/latitude8estate
OUT=/var/backups/l8e
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "$OUT"

docker compose --env-file .env.prod exec -T postgres \
  pg_dump -U postgres latitude8estate_db | gzip > "$OUT/db-$STAMP.sql.gz"

docker run --rm -v latitude8estate_minio_data:/data:ro -v "$OUT":/out alpine \
  tar czf "/out/media-$STAMP.tar.gz" -C /data .

cp .env.prod "$OUT/env-$STAMP"          # the secrets; without them a restore is useless
find "$OUT" -type f -mtime +14 -delete
```

```bash
sudo chmod 700 /usr/local/bin/l8e-backup.sh
echo '17 3 * * * /usr/local/bin/l8e-backup.sh' | sudo crontab -
```

Copy the output off the box — a backup on the same VPS does not survive losing
the VPS. **Test a restore once**, before you need it.

---

## 9. Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `web_ui` build fails on "Could not reach …" | API not running, not seeded, or `PUBLIC_API_BASE_URL` unreachable from the build container. There is no fallback, by design. |
| Site builds, but every image is broken | `MINIO_PUBLIC_BASE_URL` not browser-reachable, or `minio_init` never ran so the bucket is still private (403). |
| API returns bare 400 to everything | `ENVIRONMENT=production` + the forwarded `Host` missing from `CORS_ORIGINS`. See 4.3. |
| Forms show "not connected to a backend yet" | Expected. The endpoints do not exist; `PUBLIC_API_FORMS_ENABLED` is false. |
| `/v1/projects` 404s, `/v1/projects/` works | `redirect_slashes=False`. Keep the trailing slash. |
| Nested routes 404 or redirect to the wrong port | `web/ui/nginx.conf` handles this with `absolute_redirect off` and `try_files $uri $uri/index.html`. Check it was copied into the image. |
| Content edited but site unchanged | Static build. Rebuild `web_ui` (section 7). |
| `${VAR}` empty / Postgres starts passwordless | `--env-file .env.prod` was omitted. |
| Site shows stale content after a rebuild | `/_astro/` assets are `immutable` for a year — correct, they are fingerprinted. HTML is not cached; hard-refresh to confirm. |

`/health` runs a real database query, so a `503 {"status":"unhealthy"}` means
the API is up and Postgres is not — check `postgres` before suspecting the API.

Logs: `docker compose --env-file .env.prod logs -f web_api`.

---

## 10. Pre-launch checklist

**Infrastructure**

- [ ] `5432`, `6379`, `9000`, `9001` bound to `127.0.0.1` — verify from another
      host with `nmap -Pn <ip>`, not by reading the config
- [ ] Postgres, MinIO and JWT secrets all changed from defaults
- [ ] `.env.prod` is `chmod 600` and git-ignored
- [ ] `ENVIRONMENT=production` (confirm `/docs` on the API is 404)
- [ ] `CORS_ORIGINS` lists the real origins and nothing else — never `*`, which
      is invalid with `allow_credentials=True` and defeats TrustedHost
- [ ] TLS valid on both hosts; HTTP redirects to HTTPS
- [ ] Backups running, and **one restore actually tested**
- [ ] `restart: unless-stopped` on `web_api` and `web_ui` so a reboot recovers
- [ ] Log rotation configured (`/etc/docker/daemon.json`, `log-opts max-size`)

**Known gaps in the application itself** — these are not deployment issues, but
do not launch without deciding on them:

- [ ] **Images are temporary.** `web/ui/src/data/media.ts` still points at
      `lh3.googleusercontent.com` URLs emitted by the design tool. They **will**
      expire. Replace them with real assets in MinIO. See `web/api/TODO.md` §5.
- [ ] **Both forms are inert.** `POST /v1/enquiries/` and
      `POST /v1/newsletter/subscriptions/` do not exist. The site tells visitors
      so rather than failing silently, but an estate agency with a dead enquiry
      form has no lead capture at all. `web/api/TODO.md` §4.
- [ ] **`/property-management` copy makes unverified commercial promises** — a
      15-minute SLA, a 24-hour guaranteed reply, certified artisans, NDA-bound
      staff. This came from a design tool. Confirm or rewrite it.
- [ ] **No migration tool.** Schema is `create_all`; it will not alter existing
      tables. Adopt Alembic before the first schema change in production.
- [ ] **No rate limiting** on the write endpoints once they ship. They are
      anonymous public submissions.
- [ ] Rebuild story for content editors decided (section 7).

---

## Appendix: ports at a glance

| Public | → | Container |
| --- | --- | --- |
| `https://example.com` | → | `web_ui` :80 (nginx, static) |
| `https://example.com/media/*` | → | `minio` :9000, bucket `latitude8estate-media` |
| `https://api.example.com` | → | `web_api` :8000 (uvicorn) |

Loopback only: `5432` postgres · `6379` redis · `9001` MinIO console (reach it
with `ssh -L 9001:127.0.0.1:9001 user@vps`).
