# latitude8estate

Public website and CRM for Latitude 8 Estate.

| Part | What it is | Local port |
| --- | --- | --- |
| `web/api` | FastAPI service behind the public site | 8001 |
| `web/ui` | Public site, a static Astro build | 3001 (Docker) / 4321 (dev server) |
| `crm/api`, `crm/ui` | CRM, still a stub | 8000 / 3000 |
| `core` | Settings, database and storage clients, models, repositories and services shared by the APIs | |
| `scripts/seed.py` | Creates the schema and loads a sample catalogue with placeholder media | |

Datastores: PostgreSQL 15, MinIO (media) and Redis 7, all run with Docker Compose.

For deploying to a server see [DEPLOYMENT.md](DEPLOYMENT.md).

## Requirements

- Docker Desktop (Docker Compose v2)
- Node.js 22.12 or newer, only for the Astro dev server
- Python 3.12 or newer, only if you want to run the API or the seed outside Docker

## Running the project locally

The public site is a **static build**: during `npm run build` Astro fetches the
API and bakes the result into HTML. There is no fixture fallback, so the API
has to be running and seeded before the site is built. That fixes the order of
the steps below. A one-shot `docker compose up --build` fails on purpose,
because it would build the site before the API is listening.

### 1. Environment file

```bash
cp .env.example .env
```

The defaults match `docker-compose.yml`, so nothing needs editing for local
use. `.env` is read by `core/settings.py`, which means it applies to anything
you run outside a container. The containers get their values from the
`environment:` blocks in `docker-compose.yml`.

### 2. Start the datastores

```bash
docker compose up -d postgres minio redis
```

### 3. Create the schema and seed sample content

Either inside Docker, with no local Python needed:

```bash
docker compose build web_api
docker compose run --rm web_api python -m scripts.seed
```

Or with a local virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r web/api/requirements.txt
python -m scripts.seed
```

Useful flags: `--reset` drops everything first, `--no-media` skips the MinIO
upload.

### 4. Run the API and the site

**Option A: everything in Docker.** Closest to production.

```bash
docker compose up -d --build web_api
docker compose up -d --build web_ui
```

- Site: http://localhost:3001
- API health check: http://localhost:8001/health

Content changes in the database only appear on the site after you rebuild
`web_ui` again, because the HTML is generated at build time.

**Option B: dev servers with live reload.** Run the API in one terminal, with
the virtual environment from step 3 active:

```bash
uvicorn web.api.main:app --reload --port 8001
```

And the site in a second terminal:

```bash
cd web/ui
npm install
PUBLIC_API_BASE_URL=http://localhost:8001 npm run dev
```

- Site: http://localhost:4321
- The API's default `CORS_ORIGINS` already allows this origin.

### Other services

- MinIO console: http://localhost:9001, user `minioadmin`, password `minioadmin`.
- The CRM (`crm_api` on port 8000, `crm_ui` on port 3000) does not connect to
  anything yet and can be left out: `docker compose up -d --build crm_api crm_ui`
  starts it if you want to see the stub.

### Stopping

```bash
docker compose down
```

Add `-v` to also delete the database and media volumes.

## Ports in one place

| Port | Service |
| --- | --- |
| 3000 | CRM UI (Docker) |
| 3001 | Public site (Docker) |
| 4321 | Public site (Astro dev server) |
| 5432 | PostgreSQL |
| 6379 | Redis |
| 8000 | CRM API |
| 8001 | Public API |
| 9000 | MinIO API |
| 9001 | MinIO console |
