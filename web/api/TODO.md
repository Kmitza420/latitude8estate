# web/api — open work

The public site (`web/ui`) reads this API through `web/ui/src/services/`. This
file tracks the gap between what the site renders and what the API can answer.

> **Note on branches.** An earlier copy of this file exists on `aco_b01`, left
> there by the accidental merge of `api` into that branch. This is the current
> one. When `api` is merged into `aco_b01`, take this version.

Contract mirrors, for cross-referencing:

| Concern | UI file |
| --- | --- |
| Wire shapes, mirrored from `core/models/dto.py` | `web/ui/src/services/dto.ts` |
| Field-by-field mapping | `web/ui/src/services/mappers.ts` |
| Paths, timeouts, feature flags | `web/ui/src/services/config.ts` |

---

## Closed

The consolidation pass closed the whole of the previous blocking list and most
of the data-model gaps. Recorded here so the same ground is not re-covered.

- [x] **Projects router was mounted under `/blogs`**, shadowing the blogs
      routes and leaving no reachable projects URL. Now `/v1/projects`.
- [x] **`limit=0` was a 500** (`ZeroDivisionError` in the `total_pages`
      calculation, reachable from the query string). `skip`/`limit` are now
      validated by `SkipParam`/`LimitParam` in `web/api/dependencies.py`, and
      `PaginationMetadata.build` clamps independently.
- [x] **Import roots disagreed.** One root now — the repository root. The
      service runs as `uvicorn web.api.main:app`.
- [x] **Services called repositories with a positional dict** where `**kwargs`
      was expected, so every write raised `TypeError`. See
      `core/services/base.to_columns`, which also handles the scalar-vs-JSONB
      dump-mode distinction.
- [x] **Response DTOs had no `from_attributes`**, so no ORM row could be
      serialised.
- [x] **No stable ordering.** `created_at DESC, id` — total, so pagination
      cannot duplicate or drop a row. Blogs order on `published_at DESC`.
- [x] **Unpublished posts were served to the public.** Filtered in the
      repository now, on the list *and* detail routes.
- [x] **The list route shipped every post's full `content`.** `BlogSummary`.
- [x] **`content` was unsanitised HTML** injected with `set:html`.
      `core/services/sanitize.py`, applied on write and on read.
- [x] **`author_id` / `category_id` were unresolvable UUIDs.** Real `authors`
      and `categories` tables, real FKs, expanded inline on the response.
- [x] **No slug, price, floor area, featured flag, media, documents or agent
      on `Project`.** All added; media and documents are object keys resolved
      through `MINIO_PUBLIC_BASE_URL` on read.
- [x] **`featured_image_url` carried no alt text.** Now a `MediaRef` with
      `alt` required and non-empty at validation time.
- [x] **`GET /v1/blogs/by-slug/{slug}`** and `/v1/projects/by-slug/{slug}` —
      the site routes on slugs; it no longer takes two round trips.
- [x] **`/health` did not touch the database.** It runs `SELECT 1` and returns
      503 when that fails.
- [x] **`CORS_ORIGINS` defaulted to `"*"`** while `allow_credentials=True`.
- [x] **`PagninatedResponse` was misspelt.**
- [x] **`requirements.txt` was missing `psycopg2-binary`, `minio` and `nh3`** —
      all three imported, none declared.
- [x] **Nothing created the tables or wrote a row.** `python -m scripts.seed`.

---

## Open

### 1. Schema management

- [ ] **Adopt Alembic.** `scripts/seed.py` calls `create_all`, which creates
      missing tables and silently ignores changes to existing ones. Every
      schema change from here needs a migration, not a reseed.

### 2. Write endpoints the UI is already coded against

Both are called from the browser at runtime. `PUBLIC_API_FORMS_ENABLED` stays
`false` in the UI until they exist, and both forms show a "not connected"
notice rather than failing silently. They are anonymous public writes and must
be treated as such.

- [ ] **`POST /v1/enquiries/`** — body `{name, email, phone?, message?,
      project_slug?}` → `201 {id, status}`. Validate the email, reject an
      unknown `project_slug`, rate-limit by IP, return field errors as 422.
      Forward to the CRM and the listing agent.
- [ ] **`POST /v1/newsletter/subscriptions/`** — body `{email}` →
      `201 {id, status}`. Double opt-in; the UI's success copy already tells
      the visitor to check their inbox. A repeat subscribe must be idempotent,
      not a 409, and must not disclose whether an address is on the list.
      Rate-limit by IP.
- [ ] Redis is already in `docker-compose.yml` and is the obvious place to put
      the rate limiter.

### 3. Media

- [ ] **Documents are served from the public bucket.** Fine for a brochure,
      wrong for anything that should not be crawlable.
      `ObjectStorage.presigned_url` exists for this; route document URLs
      through it once there is a private bucket to put them in.
- [ ] **No upload endpoint.** The CRM needs one; `ObjectStorage.put_object`
      is the piece it is missing, plus content-type and size validation.
- [ ] **Facility icons are derived in the UI** (`mappers.ts`) from the boolean
      feature vocabulary. If they ever move server-side, validate against the
      Material Symbols set on write — an unrecognised name renders as text.

### 4. Cross-cutting

- [ ] **Cache headers** (`ETag`, `Cache-Control`) on the GETs. The site reads
      them at build time today, but the same responses get hit per-request the
      moment anything moves to SSR.
- [ ] **A consistent error body.** FastAPI's `{"detail": …}` is a string for
      `HTTPException` and a list of objects for a 422; the UI special-cases
      that in `describeSubmitError`.
- [ ] **No tests.** The sanitiser, `to_columns`, the published-only filter and
      the pagination arithmetic are the four things most worth pinning down.

### 5. Content the UI still holds — decide where it belongs

Not necessarily API work, but worth an explicit decision rather than drift:

- [ ] Site navigation and the four nav tiles — deliberately in
      `web/ui/src/data/site.ts`, since routes are a build-time concern.
- [ ] Page hero artwork for `/home`, `/projects`, `/lifestyle`, `/about-us`
      is still site chrome in `web/ui/src/data/media.ts`, pointing at
      temporary `lh3.googleusercontent.com` URLs **that will expire**. Record
      data no longer depends on them, but these six or so images do.
- [ ] `/about-us` and `/contact-us` prose. The fabricated statistics, offices
      and phone number are gone (the page now reports real aggregates over the
      portfolio), but the remaining agency copy is still placeholder text.
