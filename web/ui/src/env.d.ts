/// <reference types="astro/client" />

/**
 * Environment variables consumed by `src/services/`.
 *
 * All three carry the `PUBLIC_` prefix because the two React islands
 * (`ContactForm`, `NewsletterForm`) read them in the browser, and Astro only
 * inlines `PUBLIC_`-prefixed names into the client bundle. The prerendered
 * pages read the same values at build time.
 *
 * There is no fallback switch any more: the site renders what the API returns,
 * and a build against an unreachable API fails instead of quietly publishing
 * placeholder content.
 */
interface ImportMetaEnv {
  /** Origin of `web/api`, without a trailing slash. Default: http://localhost:8001 */
  readonly PUBLIC_API_BASE_URL?: string;
  /** Per-request timeout in milliseconds. Default: 10000 */
  readonly PUBLIC_API_TIMEOUT_MS?: string;
  /** Let the enquiry and newsletter forms POST for real. Default: false */
  readonly PUBLIC_API_FORMS_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
