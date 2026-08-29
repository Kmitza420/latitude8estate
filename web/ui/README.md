# web/ui — latitude8estate public site

Astro 7 + React 19 + Tailwind v4. Static output; every route is prerendered.
No user accounts — the site is entirely public.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run preview  # serve dist/
```

`astro dev` and `astro preview` run as managed background servers in this
version — use `astro dev stop` / `astro preview stop` (and `… status`, `… logs`)
rather than expecting Ctrl+C on a wrapper process to stop them.

## Routes

| Route | Source | Origin |
| --- | --- | --- |
| `/` | `astro.config.mjs` redirect | → `/home` |
| `/home` | `src/pages/home.astro` | `mockups/home.html` |
| `/projects` | `src/pages/projects/index.astro` | `mockups/projects.html` |
| `/projects/page/[page]` | `src/pages/projects/page/[page].astro` | pagination control in `projects.html` |
| `/projects/[slug]` | `src/pages/projects/[slug].astro` | `mockups/project.html` |
| `/lifestyle` | `src/pages/lifestyle/index.astro` | `mockups/blog_home.html` |
| `/lifestyle/category/[category]` | `src/pages/lifestyle/category/[category].astro` | `mockups/blog_category.html` |
| `/lifestyle/[slug]` | `src/pages/lifestyle/[slug].astro` | `mockups/blog.html` |
| `/about-us` | `src/pages/about-us.astro` | no mockup — agency copy, real portfolio figures |
| `/contact-us` | `src/pages/contact-us.astro` | no mockup — form, email, real markets |
| anything else | `src/pages/404.astro` | → `/home` |

Both the bare root and any unknown path land on `/home`. The 404 is a meta
refresh, the same mechanism Astro emits for the `/` redirect, so the static host
must be configured to serve `404.html` for unknown paths — `error_page 404
/404.html;` for nginx. `web/ui/Dockerfile` is currently empty, so that is not
set up yet.

The blog section is named **Lifestyle**; there is no `/journal`.

## Navigation

`src/data/site.ts` holds the single category list — **Home, Projects, Lifestyle,
About Us** — plus the **Contact Us** call to action. That one array drives the
top bar, the hamburger drawer, the footer, and (via `src/data/collections.ts`)
the tile grid on the home page, so the four categories cannot drift apart.

## Colour

The header sits transparent over each page's hero and drops to solid `primary`
green once scrolled past it. Lettering is gold (`secondary-fixed`, `#ffdf9f`) in
both states. The footer shares that same `primary` green band with gold
lettering, so the two bookend the page identically.

## Heroes

Every page opens on the same hero: a full-viewport image (`h-dvh`, min 600px)
with the copy overlaid at its lower-left corner. Only the wash over the image
varies, via `Hero.astro`'s `overlay` prop:

| Overlay | Used by |
| --- | --- |
| `scrim` | `/home`, property detail — soft top-to-bottom gradient |
| `tint` | `/projects`, `/lifestyle`, category pages — flat green multiply |
| `gradient` | articles — heavy bottom-up green |
| `dark` | `/about-us`, `/contact-us` — heaviest wash, holds the photo back |

## Design tokens

The six mockups each carried an identical `tailwind.config` object inline. That
token set now lives once, in the `@theme` block of `src/styles/global.css`,
translated to Tailwind v4 CSS variables. Names are unchanged, so mockup markup
ports across verbatim: `bg-surface-container-low`, `text-secondary-fixed`,
`px-margin-desktop`, `py-section-gap`, `font-headline-lg`, `text-display-lg`.

Two deliberate changes from the mockups:

- **`max-w-container-max` is now `max-w-page`.** Tailwind v4 resolves `max-w-*`
  against the `--container-*` namespace rather than the spacing scale, so the
  token is `--container-page: 1440px`.
- **`unit-N` classes are gone.** The mockups used `mb-unit-3`, `space-y-unit-6`,
  `pb-unit-10` and friends, but their config only defined `spacing.unit`, so
  those classes never generated any CSS. They were replaced with the values they
  intended (`unit` = 8px, so `unit-3` = 24px = `mb-6`).

The `luxury-shadow`, `hero-overlay`, `drop-cap` and `hide-scrollbar` helpers are
`@utility` definitions in the same file.

## Structure

```
src/
  components/
    react/          interactive islands (see below)
      SiteNav.tsx      top bar + hamburger drawer
      ContactForm.tsx  enquiry form (property sidebar + /contact-us)
      NewsletterForm.tsx
      Field.tsx        labelled input/textarea
      Icon.tsx
    Hero.astro         all 8 hero variants (align/size/overlay/animate)
    CategoryTile.astro home tiles + lifestyle category tiles
    PropertyCard.astro card (home rail) + tile (portfolio grid)
    PostCard.astro     card / compact / overlay
    Footer, Newsletter, Pagination, PortfolioView, SectionHeading, Icon
  data/           view model types + site chrome; no records live here
                  media.ts (page heroes and nav tiles only), site.ts,
                  collections.ts, projects.ts, posts.ts, pagination.ts
  services/       everything that talks to web/api (see below)
    index.ts         the barrel pages import from
    config.ts        base URL, timeouts, feature flags, endpoint paths
    http.ts          typed fetch, ApiError, `optional` for 404s
    dto.ts           wire shapes, mirrored from core/models/dto.py
    mappers.ts       DTO -> the view models in src/data/
    projects.ts      the portfolio
    posts.ts         lifestyle articles + categories
    forms.ts         enquiry + newsletter submissions
  layouts/        BaseLayout.astro
  pages/          routes (table above)
  styles/         global.css — @theme tokens + utilities
```

**React is reserved for interactive components.** `SiteNav` (scroll state +
drawer), `ContactForm` and `NewsletterForm` hydrate as islands — `client:load`
for the nav, `client:visible` for the forms. Everything presentational stays in
`.astro` and ships zero JavaScript.

## Data

Pages read through `src/services/`, never with a bare `fetch`. The services
return the same `Project`, `Post` and `Category` types declared in `src/data/`,
so the components below them are unaware a network exists.

```astro
---
import { listAllProjects, paginate } from "../services";
const { projects, totalPages } = paginate(await listAllProjects(), 1, PAGE_SIZE);
---
```

The site is a static build, so the reads happen once at build time. The two
React islands are the exception: they POST from the browser at runtime, and
import `services/forms` directly rather than through the barrel, so the read
services stay out of the client bundle.

**There are no fixtures.** `src/data/` declares the view model types and holds
the site's own chrome artwork — page heroes and the four nav tiles — and
nothing else. Every project, article, category, author and agent the site
renders comes from `web/api`, and a read that fails stops the build rather than
substituting something plausible.

That is the point of the whole arrangement: the site cannot display anything
the database does not hold. Where a record has no value for something — no
published price, no photography, no listing agent — the view model carries
`null` and the component omits that piece of layout. It never fills it in.

The API must therefore be running and populated before a build:

```bash
docker compose up -d postgres minio minio_init
python -m scripts.seed          # from the repository root
uvicorn web.api.main:app --port 8001
npm run build
```

### Configuration

All three are optional and read at build time; `PUBLIC_` is required for the
ones the islands need in the browser.

| Variable | Default | Meaning |
| --- | --- | --- |
| `PUBLIC_API_BASE_URL` | `http://localhost:8001` | Origin of `web/api`, as published by docker-compose |
| `PUBLIC_API_TIMEOUT_MS` | `10000` | Per-request timeout |
| `PUBLIC_API_FORMS_ENABLED` | `false` | Let the forms POST for real |

## What was reconciled from the mockups

The mockups were generated per-page, so shared chrome had drifted:

- **Nav.** Four separate treatments (`nav-scrolled`, `glass-nav`,
  `nav-transparent`, `#top-navbar.scrolled`) collapsed into one `SiteNav`.
- **Side drawer.** Only `home.html` had one. It is now on every page, carrying
  the same four categories as the top bar, with Escape, scrim-click and body
  scroll lock.
- **Footer.** Three layouts collapsed to one.
- **Accounts removed.** The mockups' account icon, "Exclusive Member Access"
  drawer label, and settings/privacy/sign-out links are gone.
- **The Glass Pavilion.** `home.html` listed it as Beverly Hills / $24,500,000
  and `project.html` as Malibu / $12,500,000. Moot now: listings come from the
  database, and a price is whatever `price_from` says or nothing at all.
- **Lifestyle categories.** `blog_home.html` labelled its four tiles with
  *property* categories (Coastal / Urban / Historic / Desert) that duplicated
  the home page grid. The tiles now come from the `categories` table, showing
  whichever rows are flagged `featured`.

## Known gaps

- **Site chrome images are temporary.** The eight entries left in
  `src/data/media.ts` — page heroes and the four nav tiles — still point at
  `lh3.googleusercontent.com` URLs emitted by the design tool, and they *will*
  expire. Record imagery no longer depends on them (it comes from MinIO through
  the API), but these eight do. Replace them and move to `astro:assets`.
- **Forms have no backend.** Both forms are wired to `services/forms`, but
  `POST /v1/enquiries/` and `POST /v1/newsletter/subscriptions/` do not exist
  yet, so `PUBLIC_API_FORMS_ENABLED` is off and submission still shows an inline
  notice saying so. Flip the flag once the endpoints ship.
- **`/about-us` and `/contact-us` prose.** The invented statistics, the three
  invented offices and the invented telephone number are gone — the pages now
  report figures counted from the portfolio, and contact is the form plus a
  real email address. The remaining agency prose is still placeholder copy and
  needs writing.
- **Carousel controls were dropped, not ported.** `home.html` drew prev/next
  arrows on the featured-estates rail, but there was no carousel behind them.
  Rather than ship dead controls they became a "View the portfolio" link.
  Restore them alongside real carousel behaviour if the rail ever needs it.
  (The mockup's testimonial block is gone entirely: nothing in the database
  backs a client quotation, so that band reports the portfolio instead.)
