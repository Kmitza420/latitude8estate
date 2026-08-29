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
 * When true, a failed read falls back to the placeholder fixtures in
 * `src/data/` instead of failing the build.
 *
 * This defaults to *on* because the API cannot yet supply most of what the
 * site renders — there are no images, prices, taglines or agents behind
 * `/v1/projects/` (see `web/api/TODO.md`). Turn it off once the API is the
 * real source of truth, so that a broken API fails the build loudly rather
 * than quietly publishing stale placeholder content.
 */
export const ALLOW_PLACEHOLDER_FALLBACK = readBoolean(
  import.meta.env.PUBLIC_API_ALLOW_FALLBACK,
  true,
);

/**
 * When true, the enquiry and newsletter forms POST to the API.
 *
 * Defaults to *off* because neither endpoint exists yet. While it is off the
 * forms keep their current behaviour: they intercept the submit and say so.
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
  /** Not reachable yet — see the router prefix bug in `web/api/TODO.md`. */
  projects: "/v1/projects/",
  project: (id: string) => `/v1/projects/${encodeURIComponent(id)}`,
  blogs: "/v1/blogs/",
  blog: (id: string) => `/v1/blogs/${encodeURIComponent(id)}`,
  /** Planned, not implemented. */
  enquiries: "/v1/enquiries/",
  /** Planned, not implemented. */
  newsletterSubscriptions: "/v1/newsletter/subscriptions/",
} as const;

/** Page size used when the services walk a list endpoint to exhaustion. */
export const BULK_PAGE_SIZE = 100;

/** Safety valve on that walk, so a bad `total_pages` cannot spin forever. */
export const MAX_BULK_PAGES = 50;
