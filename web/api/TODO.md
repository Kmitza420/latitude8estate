# web/api — open work, driven by what `web/ui` renders

The public site is now wired to this API through `web/ui/src/services/`. This
file is the gap list: everything the UI asks for that the API cannot answer yet,
ordered so the blocking items come first.

Nothing here changes the API's code. It is a checklist, not a design document —
where a decision is genuinely open, it says so rather than picking for you.

**Scope note.** The public site has no accounts, no login and no authenticated
area, so nothing below asks for auth endpoints. The two write endpoints are
anonymous public submissions and must be treated as such — validated and
rate-limited, never trusted.

Contract mirrors, for cross-referencing:

| Concern | UI file |
| --- | --- |
| Wire shapes, mirrored from `core/models/dto.py` | `web/ui/src/services/dto.ts` |
| Field-by-field mapping, and every placeholder | `web/ui/src/services/mappers.ts` |
| Paths, timeouts, feature flags | `web/ui/src/services/config.ts` |

---

## 0. Blocking — the API cannot serve the site as it stands

- [ ] **The projects router is mounted under `/blogs`.**
      `endpoints/v1/routes/projects.py:10` declares
      `APIRouter(prefix="/blogs", tags=["Blogs"])`. Because `router.py` includes
      projects *before* blogs, `GET /v1/blogs/` resolves to `list_projects` and
      `GET /v1/blogs/{id}` to `get_project`, and the blogs routes are shadowed
      entirely. There is no reachable projects URL at all. Should be
      `prefix="/projects", tags=["Projects"]`. The UI already calls
      `/v1/projects/` on the assumption that this is fixed.

- [ ] **`limit=0` is a 500.** Both list routes compute
      `(count + limit - 1) // limit`, which raises `ZeroDivisionError` on
      `limit=0` — reachable by anyone who types the query string. Clamp `limit`
      to a sane range (say 1–100) and `skip` to `>= 0`, with `Query(ge=..., le=...)`.

- [ ] **The import roots disagree.** `main.py` imports `endpoints.v1.router`
      (needs `web/api` on `sys.path`), while `routes/blogs.py` imports
      `web.api.dependencies` (needs the repo root), and everything imports
      `core.*` (repo root again). Both roots have to be on the path
      simultaneously, and `web/` has no `__init__.py`, so this only works by
      namespace-package accident. Pick one root — importing `dependencies`
      relatively, or as `web.api.dependencies` everywhere including `main.py` —
      and make the Dockerfile set it explicitly.

- [ ] **`web/api/Dockerfile` is empty**, so `docker-compose build web_api`
      produces nothing. `web/ui/Dockerfile` is empty too.

- [ ] **`redirect_slashes=False` makes the trailing slash mandatory.** The app is
      built with that flag and the list routes are registered as `"/"`, so
      `/v1/blogs` 404s where `/v1/blogs/` works. That is a defensible choice, but
      it is a contract detail — the UI sends the trailing slash deliberately
      (`web/ui/src/services/config.ts`). If you would rather the bare path
      worked, register the list routes as `""` instead.

- [ ] **Set a real CORS origin list before the forms go live.** The enquiry and
      newsletter forms POST from the browser, cross-origin, so they depend on
      this. `CORS_ORIGINS` defaults to `"*"`, which does work for the site's
      requests (they send no credentials), but pairing it with
      `allow_credentials=True` is a misconfiguration that Starlette only papers
      over — and in production the same value also feeds `TrustedHostMiddleware`,
      where `"*"` defeats the point of having it. List the real origins:
      `http://localhost:4321` (astro dev), `http://localhost:3001`
      (docker-compose `web_ui`), plus the production domain. Symptom if this is
      wrong: the forms fail with an opaque network error in the browser while
      `curl` works fine.

- [ ] **`docker-compose.yml` passes the wrong build arg to `web_ui`.** It sets
      `VITE_API_BASE_URL`, but the UI is Astro, which only exposes `PUBLIC_`-
      prefixed variables. It needs `PUBLIC_API_BASE_URL`. (`crm_ui` is Vite and
      is correct as-is.)

---

## 1. Projects — columns the site renders and the model does not have

`ProjectResponse` covers the physical description of a development well. It has
nothing for the *listing* — the part a buyer actually reads. Each item below is
currently faked in `mappers.ts`; the placeholder is named so you can find it.

- [ ] **`slug`** — the site routes on `/projects/{slug}`. The UI derives one from
      `name` and de-duplicates collisions (`listAllProjects`), which means a
      rename silently breaks every inbound link to that project. Add a unique,
      indexed `slug` column, set on create and never changed casually.
- [ ] **`price`** — rendered under the title on the detail page and on every
      card. Placeholder: the string `"Price on application"`. Decide whether it
      is a display string or a number plus currency; if numeric, the UI needs a
      formatter and the API needs a currency code.
- [ ] **`tagline` / marketing description** — the hero lead and the card copy.
      Placeholder: a sentence assembled from type, city and status, which reads
      like a database record because it is one.
- [ ] **`featured`** — drives the "Featured Estates" rail on `/home`. Without it
      `getFeaturedProjects` just takes the first three in list order.
- [ ] **Floor area** — the third stat on every card, beside beds and baths.
      Currently renders as an em dash. Store the number and the unit separately.
- [ ] **Media: hero image and gallery** — there is no media table and no image
      column. Placeholders rotate through the mockup imagery, so two different
      projects can show the same photograph. See §5 for the shape.
- [ ] **Listing agent** — name, email, portrait. Placeholder: a hardcoded
      person. Probably a real `agents` table rather than three columns.
- [ ] **Documents** — floor plans and brochures. The section is hidden when
      empty, which today is always. Needs title, size/meta and a URL; anything
      not meant to be crawlable wants a signed, expiring link.
- [ ] **Card badge** — "New Listing" in the mockups. Derived from `status` for
      now ("Planned", "Under Construction"), which is informative but is not the
      editorial label the design asked for.

## 2. Projects — endpoint behaviour

- [ ] **Guarantee a stable ordering.** `ProjectRepository.list` has no `ORDER BY`,
      so PostgreSQL may return rows in any order and pagination will duplicate
      and drop listings between page 1 and page 2. Order by something total —
      `created_at DESC, id` — and make it part of the contract.
- [ ] **`GET /v1/projects/by-slug/{slug}`.** The detail route takes a UUID, so
      the UI resolves a slug by scanning the full list. Fine for a static build
      of a few dozen projects; not fine at any real size.
- [ ] **`GET /v1/projects/featured`.** Pre-ordered, not paginated. The home rail
      lays out exactly three.
- [ ] **Decide what the public sees.** `ProjectStatus.PLANNED` records are
      returned today. If a planned project should not be public, filter it
      server-side rather than leaving it to the client.

## 3. Blogs — the lifestyle section

- [ ] **Unpublished posts are served to the public.** `GET /v1/blogs/` returns
      `draft` and `archived` rows alongside `published` ones. `web/ui/src/services/posts.ts`
      filters them out client-side, which is a stopgap: the draft is still in the
      response body, and anyone can read it. Filter by status in the repository,
      and default the public API to published-only.
- [ ] **The list endpoint returns every post's full `content`.** Because
      `response_model=BlogResponse`, listing ten articles ships ten complete HTML
      bodies. Split off a `BlogSummary` (no `content`) for the list route.
- [ ] **Order by `published_at DESC`.** Same reasoning as projects, and the
      "Latest Narratives" grid trusts the order it is handed.
- [ ] **`GET /v1/blogs/by-slug/{slug}`.** `slug` is already unique and indexed,
      and it is what the site routes on. Right now the UI resolves slug → id from
      the list and then fetches the detail route, which is two round trips for
      what should be one.
- [ ] **`author_id` is an unresolvable UUID.** There is no `authors` table (the
      model comments say as much), so the byline on every article is the
      hardcoded string `"Latitude 8 Estate"`. Add the table, the foreign key, and
      either expand the author inline on the response or add an endpoint.
- [ ] **`category_id` is an unresolvable UUID.** Same problem, bigger blast
      radius: the entire category system — `/lifestyle/category/{slug}`, the four
      tiles on the lifestyle index, the eyebrow label on every card — still runs
      off fixtures in `web/ui/src/data/posts.ts`. Needs `slug`, `name`, `blurb`
      and an image per category, plus `GET /v1/categories/` and
      `GET /v1/categories/{slug}`.
- [ ] **`featured_image_url` carries no alt text.** The UI falls back to using the
      article title as the accessible name of the image, which is wrong for
      screen readers and is a real accessibility defect. Return media as an
      object (§5) with required, meaningful `alt`.
- [ ] **`content` is unsanitised HTML and the UI injects it with `set:html`.**
      This is the site's XSS trust boundary and it currently has nothing standing
      on it. Sanitise on write *and* on read, against an allowlist — `p`, `h2`,
      `h3`, `em`, `strong`, `a`, `ul`, `ol`, `li`, `blockquote`, `figure`,
      `figcaption` — stripping every event handler, `<script>` and `javascript:`
      URL. **Do not put this endpoint in front of the public before the
      sanitiser exists.**
- [ ] **No `featured` flag.** `/lifestyle` and `/home` both lead on a hero
      article; without the flag the UI leads with whatever is newest.
- [ ] **The article layout wants three body fields, not one.** The design breaks
      an article across a full-width image: `body_top`, then
      `interruption { image, caption }`, then `body_bottom`. One `content` column
      cannot express that, so the interruption never renders. Either add the
      fields or accept that the design loses its centrepiece.
- [ ] **The drop cap comes from the content.** The first paragraph needs
      `class="drop-cap"`; the UI does not add it. Worth enforcing in the CRM
      editor rather than hoping authors remember.

## 4. Endpoints the UI needs and the API does not have

The two write endpoints are called from the browser at runtime, not at build
time. Until they exist, `PUBLIC_API_FORMS_ENABLED` stays `false` in the UI and
both forms show a notice saying they are not connected. Flip it once these ship.

- [ ] **`POST /v1/enquiries/`**
      Body `{name, email, phone?, message?, project_slug?}` → `201 {id, status}`.
      `project_slug` is present when the enquiry came from a property page and
      absent from `/contact-us`. Validate the email, reject an unknown
      `project_slug`, rate-limit by IP, and return field-level errors as 422.
      Forward to the CRM and to the listing agent.
- [ ] **`POST /v1/newsletter/subscriptions/`**
      Body `{email}` → `201 {id, status}`. Double opt-in: persist as pending and
      send a confirmation mail — the UI's success copy already tells the visitor
      to check their inbox. A repeat subscribe should be idempotent, not a 409,
      and it must not disclose whether an address is already on the list.
      Rate-limit by IP.
- [ ] `GET /v1/categories/` and `GET /v1/categories/{slug}` — see §3.
- [ ] `GET /v1/projects/featured` and a featured-article route — see §2, §3.

## 5. Media, once there is somewhere to put it

Every image the site renders needs an accessible name, so media should never be
a bare string on the wire:

```
{"url": "https://…", "alt": "Human readable description"}
```

- [ ] Resolve MinIO object keys to absolute, browser-reachable URLs server-side.
      `MINIO_PUBLIC_BASE_URL` already exists in `core/settings.py` for this.
- [ ] Make `alt` required and non-empty at write time in the CRM. An empty one
      is an accessibility regression that no reviewer will catch by eye.
- [ ] Facility icons, if they ever come from the API, are Material Symbols
      ligature names (`pool`, `fitness_center`, `security`). Validate against a
      known set on write — an unrecognised name renders as literal text.
      The UI currently derives these itself in `mappers.ts`.

## 6. Cross-cutting

- [ ] **Cache headers** (`ETag`, `Cache-Control`) on the GETs. The site reads
      them at build time today, but the same responses get hit per-request the
      moment anything moves to SSR.
- [ ] **A consistent error body.** FastAPI's `{"detail": …}` is a string for
      `HTTPException` and a list of objects for a 422. The UI has to special-case
      that (`describeSubmitError` in `web/ui/src/services/forms.ts`). One shape
      would be kinder.
- [ ] **`PagninatedResponse` is misspelt** in `core/models/dto.py`. Internal
      only — the wire format is unaffected — but it will be copied around.
- [ ] **Health check.** `/health` reports `{"status": "ok"}` without touching the
      database, so it stays green while every request 500s.

## 7. Content the UI still hardcodes — decide where it belongs

Not necessarily API work; some of it is properly a build-time concern. Worth an
explicit decision rather than drift:

- [ ] The testimonial on `/home` (quote, name, detail) — `web/ui/src/pages/home.astro`.
- [ ] `/about-us` and `/contact-us`: agency copy, statistics, office addresses,
      phone number, email. All of it is invented placeholder text right now.
- [ ] Site navigation and the four categories — deliberately left in
      `web/ui/src/data/site.ts`, since routes are a build-time concern. Flagged
      so the decision is visible, not because it should move.
- [ ] **`web/ui/src/data/media.ts` points at temporary `lh3.googleusercontent.com`
      URLs emitted by the design tool. They will expire.** These are also what
      the mappers fall back to for project heroes and galleries, so the media
      work in §5 is on the critical path for the site's images, not just for the
      CMS.
