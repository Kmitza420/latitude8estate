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
| `/about-us` | `src/pages/about-us.astro` | no mockup — placeholder copy |
| `/contact-us` | `src/pages/contact-us.astro` | no mockup — placeholder details |
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
  data/           media.ts (generated), site.ts, collections.ts,
                  projects.ts, posts.ts, pagination.ts
  services/       everything that talks to web/api (see below)
    index.ts         the barrel pages import from
    config.ts        base URL, timeouts, feature flags, endpoint paths
    http.ts          typed fetch, ApiError, fixture fallback
    dto.ts           wire shapes, mirrored from core/models/dto.py
    mappers.ts       DTO -> the view models in src/data/
    projects.ts      the portfolio
    posts.ts         lifestyle articles + categories
    forms.ts         enquiry + newsletter submissions
  layouts/        BaseLayout.astro
  pages/          routes (table above)
  styles/         global.css — @theme tokens + utilities
scripts/
  gen-media.mjs   regenerates src/data/media.ts from mockups/*.html
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
services and their fixtures stay out of the client bundle.

The modules under `src/data/` keep two jobs: they declare the view model types,
and they are the **fallback fixtures**. When a read fails, the service logs one
warning and serves the fixture instead of failing the build. That is on by
default because the API cannot yet supply most of what the site renders — no
images, prices, taglines or agents. `web/api/TODO.md` is the full gap list.

### Configuration

All four are optional and read at build time; `PUBLIC_` is required for the two
the islands need in the browser.

| Variable | Default | Meaning |
| --- | --- | --- |
| `PUBLIC_API_BASE_URL` | `http://localhost:8001` | Origin of `web/api`, as published by docker-compose |
| `PUBLIC_API_TIMEOUT_MS` | `10000` | Per-request timeout |
| `PUBLIC_API_ALLOW_FALLBACK` | `true` | Fall back to fixtures instead of failing the build |
| `PUBLIC_API_FORMS_ENABLED` | `false` | Let the forms POST for real |

Set `PUBLIC_API_ALLOW_FALLBACK=false` once the API is the real source of truth,
so a broken API fails the build loudly instead of quietly publishing stale
placeholder content.

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
  and `project.html` as Malibu / $12,500,000. The detail page won.
- **Lifestyle categories.** `blog_home.html` labelled its four tiles with
  *property* categories (Coastal / Urban / Historic / Desert) that duplicated
  the home page grid. They now carry editorial categories (Architecture,
  Interior, Lifestyle, Sustainability) resolving to real category routes.

## Known gaps

- **Images are temporary.** All 40 entries in `src/data/media.ts` point at
  `lh3.googleusercontent.com` URLs emitted by the design tool. They *will*
  expire. Replace them with real assets and move to `astro:assets`.
- **Forms have no backend.** Both forms are wired to `services/forms`, but
  `POST /v1/enquiries/` and `POST /v1/newsletter/subscriptions/` do not exist
  yet, so `PUBLIC_API_FORMS_ENABLED` is off and submission still shows an inline
  notice saying so. Flip the flag once the endpoints ship.
- **Projects are unreachable over HTTP.** `web/api` mounts its projects router
  under the `/blogs` prefix by mistake, so `/v1/projects/` 404s and the portfolio
  always falls back to fixtures. One-line fix upstream; first item in
  `web/api/TODO.md`.
- **Categories are still fixtures.** `Blog.category_id` is a UUID with no
  `categories` table behind it, so every API-sourced article is filed under a
  single placeholder category and the byline is a constant.
- **`/about-us` and `/contact-us` are placeholder content.** No mockup existed
  for either; the copy, statistics, office addresses, phone number and email are
  invented and need replacing with real agency details.
- **Carousel controls were dropped, not ported.** `home.html` drew prev/next
  arrows on the featured-estates rail and the testimonial block, but neither had
  any carousel behind it. Rather than ship dead controls, the estates arrows
  became a "View the portfolio" link and the testimonial renders as a single
  static quote. Restore the arrows alongside real carousel behaviour.
