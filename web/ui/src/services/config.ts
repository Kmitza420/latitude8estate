/**
 * Configuration for the `web/api` client.
 *
 * Every value is read from `import.meta.env` as a literal property access,
 * because that is the only form Astro can statically substitute — a dynamic
 * lookup such as `import.meta.env[name]` silently yields `undefined` in the
 * client bundle.
 */

function readString(raw: string | undefined, fallback: string): string {
  const value = raw?.trim();
  return value ? value : fallback;
}

function readBoolean(raw: string | undefined, fallback: boolean): boolean {
  const value = raw?.trim().toLowerCase();
  if (!value) return fallback;
  return !["false", "0", "no", "off"].includes(value);
}

function readNumber(raw: string | undefined, fallback: number): number {
  const value = Number(raw?.trim());
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * Origin of `web/api`, never with a trailing slash.
 *
 * The default matches `docker-compose.yml`, which publishes the `web_api`
 * container on host port 8001.
 */
export const API_BASE_URL = readString(
  import.meta.env.PUBLIC_API_BASE_URL,
  "http://localhost:8001",
).replace(/\/+$/, "");

/** Per-request timeout. A slow API should not hang the static build forever. */
export const API_TIMEOUT_MS = readNumber(import.meta.env.PUBLIC_API_TIMEOUT_MS, 10_000);

/**
 * When true, the enquiry and newsletter forms POST to the API.
 *
 * Defaults to *off* because neither endpoint exists yet. While it is off the
 * forms keep their current behaviour: they intercept the submit and say so.
 * See `web/api/TODO.md`.
 */
export const FORMS_ENABLED = readBoolean(import.meta.env.PUBLIC_API_FORMS_ENABLED, false);

/**
 * Every path the UI knows about, in one place.
 *
 * The trailing slashes are load-bearing: `web/api/main.py` builds the app with
 * `redirect_slashes=False`, and the list routes are registered as `"/"`, so
 * `/v1/blogs` 404s where `/v1/blogs/` succeeds.
 */
export const endpoints = {
  projects: "/v1/projects/",
  featuredProjects: "/v1/projects/featured",
  projectBySlug: (slug: string) => `/v1/projects/by-slug/${encodeURIComponent(slug)}`,
  project: (id: string) => `/v1/projects/${encodeURIComponent(id)}`,

  blogs: "/v1/blogs/",
  featuredBlogs: "/v1/blogs/featured",
  blogBySlug: (slug: string) => `/v1/blogs/by-slug/${encodeURIComponent(slug)}`,
  blog: (id: string) => `/v1/blogs/${encodeURIComponent(id)}`,

  categories: "/v1/categories/",
  category: (slug: string) => `/v1/categories/${encodeURIComponent(slug)}`,
  categoryBlogs: (slug: string) => `/v1/categories/${encodeURIComponent(slug)}/blogs`,

  /** Planned, not implemented. */
  enquiries: "/v1/enquiries/",
  /** Planned, not implemented. */
  newsletterSubscriptions: "/v1/newsletter/subscriptions/",
} as const;

/**
 * Page size used when the services walk a list endpoint to exhaustion.
 *
 * Matches the API's `le=100` cap on `limit`; asking for more is a 422.
 */
export const BULK_PAGE_SIZE = 100;

/** Safety valve on that walk, so a bad `total_pages` cannot spin forever. */
export const MAX_BULK_PAGES = 50;
