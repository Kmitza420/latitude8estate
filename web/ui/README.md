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

## Data / the API service layer

Pages no longer import `src/data/` directly — they go through `src/services/`,
which talks to the public web API (`web/api`).

```
src/services/
  config.ts      base URL, timeout, fallback switch
  http.ts        fetch wrapper: timeouts, ApiError, unreachable-API breaker
  dto.ts         the wire contract (snake_case, as FastAPI emits it)
  mappers.ts     DTO -> the camelCase domain models components already use
  properties.ts  getProperties / getAllProperties / getFeaturedProperties / getProperty
  posts.ts       getAllPosts / getPostsByCategory / getFeaturedPost / getPost /
                 getCategories / getCategory / getCategoryLabels / getRelatedPosts
  forms.ts       submitEnquiry / subscribeToNewsletter
```

**Reads run at build time.** Static routes are generated from the API:
`getStaticPaths` asks it for slugs, then each page loads its own detail.

**Writes run in the browser.** The enquiry and newsletter forms POST from the
client and report failures — they never show a false confirmation.

**The API is not implemented yet.** Every endpoint these call is a TODO in
[`web/api/endpoints/v1/router.py`](../api/endpoints/v1/router.py). Until it
exists, reads fall back to the placeholder fixtures in `src/data/`, log one
warning, and the site builds normally. The first connection failure trips a
breaker so a dead API costs one timeout per build, not one per request.

Configuration:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PUBLIC_API_BASE_URL` | — | Preferred; Astro's own convention |
| `VITE_API_BASE_URL` | `http://localhost:8001` | What docker-compose passes as a build arg |
| `PUBLIC_API_TIMEOUT_MS` | `5000` | Per-request timeout |
| `PUBLIC_API_FALLBACK` | `true` | Set `false` to make a missing API a build error — do this in CI once the API is live |

Only `src/data/site.ts` and `src/data/collections.ts` stay local by design:
navigation and routes are a build-time concern. `src/data/media.ts`,
`projects.ts` and `posts.ts` are now fallback fixtures only.

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

Content is plain TypeScript modules under `src/data/`, not content collections —
they are placeholder data standing in for what will eventually come from
`web/api`. Swap the module bodies for fetches and the pages need no changes.

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
- **Forms have no backend.** `ContactForm` and `NewsletterForm` intercept
  submission and show an inline notice saying so. Wire them to `web/api`.
- **`/about-us` and `/contact-us` are placeholder content.** No mockup existed
  for either; the copy, statistics, office addresses, phone number and email are
  invented and need replacing with real agency details.
- **Carousel controls were dropped, not ported.** `home.html` drew prev/next
  arrows on the featured-estates rail and the testimonial block, but neither had
  any carousel behind it. Rather than ship dead controls, the estates arrows
  became a "View the portfolio" link and the testimonial renders as a single
  static quote. Restore the arrows alongside real carousel behaviour.
