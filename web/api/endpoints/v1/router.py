"""Public web API, v1.

Consumer: the Astro site in `web/ui`. Nothing here is implemented yet — the
list below is the contract that UI already codes against.

The wire format is mirrored, field for field, in
`web/ui/src/services/dto.ts`. Keep the two in step: the UI maps snake_case
responses to its own camelCase models in `web/ui/src/services/mappers.ts`, so a
rename here is a one-file change there.

Until these exist, every read in the UI falls back to the placeholder fixtures in
`web/ui/src/data/` and the site still builds. Set `PUBLIC_API_FALLBACK=false` in
the UI build once these endpoints are live, so a broken API fails the build
instead of silently serving stale placeholder content.

All routes are mounted under `/api/v1`.
"""

# ---------------------------------------------------------------------------
# TODO: Wiring
# ---------------------------------------------------------------------------
# TODO(api): Create `router = APIRouter(prefix="/api/v1", tags=["public"])` and
#   include it from `web/api/main.py`. The UI builds every request as
#   `${API_BASE_URL}/api/v1/...`, so the prefix is part of the contract.
#
# TODO(api): Add CORS middleware in `main.py`. The browser calls POST endpoints
#   directly from the published site, so the origins serving `web/ui`
#   (http://localhost:4321 in dev, http://localhost:3001 from docker-compose,
#   plus the production domain) must be allowed for GET, POST and OPTIONS.
#   Without this the enquiry and newsletter forms fail with an opaque network
#   error in the browser while working fine from curl.
#
# TODO(api): Define the shared pagination envelope once and reuse it. Every
#   list endpoint returns:
#       {"items": [...], "page": int, "page_size": int,
#        "total": int, "total_pages": int}
#   `total_pages` must be at least 1 even when `total` is 0, because the UI
#   renders its pagination control straight from it.
#
# TODO(api): Media is returned as an object, never a bare string:
#       {"url": "https://...", "alt": "Human readable description"}
#   `url` should be a fully qualified, publicly reachable URL — resolve MinIO
#   object keys to absolute URLs server-side. `alt` is required and must be
#   meaningful; the UI renders it as the accessible name of every hero and card
#   image, and empty alt text there is a real accessibility regression.
#
# TODO(api): Return 404 with a JSON body for unknown slugs on all detail
#   endpoints. During a static build a 404 aborts that page rather than
#   falling back, which is the behaviour we want.

# ---------------------------------------------------------------------------
# TODO: Properties  (drives /projects, /projects/page/N, /projects/[slug], /home)
# ---------------------------------------------------------------------------
# TODO(api): GET /properties
#   Query: page (int, default 1), page_size (int, default 3, cap it — the UI
#          asks for page_size=500 when it needs the full list for static paths).
#   Returns: paginated envelope of PropertySummary:
#       slug, name, tagline, price, city, badge (nullable), featured (bool),
#       beds, baths, area, hero (media)
#   Notes: `price`, `beds`, `baths` and `area` are pre-formatted display
#          strings ("$12,500,000", "6.5", "12,400 sqft"). If the UI should ever
#          sort or filter on them, add separate numeric fields rather than
#          changing these — the UI prints them verbatim.
#   Ordering must be stable across pages, or pagination will duplicate and drop
#   listings between page 1 and page 2.
#
# TODO(api): GET /properties/featured
#   Returns: a bare array (not paginated) of PropertySummary where featured is
#            true. Drives the "Featured Estates" rail on /home, which lays out
#            three across — return them already ordered.
#
# TODO(api): GET /properties/{slug}
#   Returns: PropertyDetail — every PropertySummary field plus:
#       address (list[str], one line per element, street first)
#       quick_specs, interior, exterior  -> [{"label": ..., "value": ...}]
#       facilities                       -> [{"icon": ..., "label": ...}]
#       technical                        -> list[str]
#       nearby                           -> [{"title": ..., "places": [{label, value}]}]
#       documents                        -> [{"title": ..., "meta": ..., "url": ...}]
#       gallery                          -> list[media]
#       agent                            -> {"name", "email", "portrait": media}
#   Notes: `icon` values are Material Symbols ligature names ("pool",
#          "fitness_center", "security"). Validate against a known set on write
#          in the CRM — an unrecognised name renders as literal text in the UI.
#          `documents[].url` should be a signed, expiring link for anything not
#          meant to be publicly crawlable.

# ---------------------------------------------------------------------------
# TODO: Lifestyle  (drives /lifestyle, /lifestyle/category/N, /lifestyle/[slug])
# ---------------------------------------------------------------------------
# TODO(api): GET /categories
#   Returns: bare array of Category:
#       slug, name, blurb, image (media), featured (bool)
#   Notes: `featured` selects the four tiles shown on the /lifestyle index.
#          Every category returned gets a generated route, so do not return
#          empty ones unless the category page should exist while empty.
#
# TODO(api): GET /categories/{slug}
#   Returns: a single Category. Used for the category page hero.
#
# TODO(api): GET /posts
#   Query: category (slug, optional), page, page_size
#   Returns: paginated envelope of PostSummary:
#       slug, title, category (slug), excerpt, image (media), author,
#       published_at (ISO date, "2024-10-24"), featured (bool)
#   Notes: order newest first — the UI slices the first three for its "Latest
#          Narratives" grid and trusts the order it is given.
#
# TODO(api): GET /posts/featured
#   Returns: a single PostDetail — the article headlining /lifestyle and /home.
#            Decide what happens when nothing is flagged featured: either fall
#            back to the newest post or return 404, but be consistent.
#
# TODO(api): GET /posts/{slug}
#   Returns: PostDetail — every PostSummary field plus:
#       body_top      (HTML string, rendered above the full-width image break)
#       interruption  (nullable, {"image": media, "caption": str})
#       body_bottom   (nullable HTML string, rendered below the break)
#   Notes: the UI injects both body fields with `set:html`, so this endpoint is
#          the trust boundary. Sanitise on write and again on read — allow only
#          a known-safe tag set (p, h2, h3, em, strong, a, ul, ol, li,
#          blockquote, figure, figcaption) and strip every event handler and
#          script. Do not ship this endpoint before the sanitiser.
#          The first paragraph of `body_top` should carry `class="drop-cap"` for
#          the styled initial; the UI does not add it.

# ---------------------------------------------------------------------------
# TODO: Submissions  (called from the browser, not at build time)
# ---------------------------------------------------------------------------
# TODO(api): POST /enquiries
#   Body: {"name", "email", "phone"?, "message"?, "property_slug"?}
#   Returns: 201 with {"id": str, "status": str}
#   Notes: `property_slug` is present when the enquiry came from a property
#          page and absent from the /contact-us form. Validate the email,
#          reject unknown `property_slug` values, and rate-limit by IP — this
#          is an unauthenticated public endpoint. Forward to the CRM and to
#          the listing agent. Return field-level validation errors as 422 so
#          the form can show them; the UI currently renders the message only.
#
# TODO(api): POST /newsletter/subscriptions
#   Body: {"email"}
#   Returns: 201 with {"id": str, "status": str}
#   Notes: double opt-in — persist as pending and send a confirmation mail. The
#          UI already tells the user to check their inbox. Make a repeat
#          subscribe idempotent rather than a 409, and rate-limit by IP.

# ---------------------------------------------------------------------------
# TODO: Content the UI still hardcodes
# ---------------------------------------------------------------------------
# TODO(api): Decide whether these should become endpoints or stay in the UI:
#   - The testimonial on /home (quote, attribution) — currently hardcoded in
#     `web/ui/src/pages/home.astro`.
#   - The agency copy, statistics and office addresses on /about-us and
#     /contact-us — currently hardcoded and entirely invented placeholder text.
#   - Site navigation and the four categories — deliberately kept in
#     `web/ui/src/data/site.ts`, since routes are a build-time concern.
#
# TODO(api): Add cache headers (ETag / Cache-Control) on the GET endpoints. The
#   UI reads them at build time today, but the same responses will be hit
#   per-request if the site ever moves to SSR.
