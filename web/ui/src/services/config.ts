/**
 * Where the public web API lives.
 *
 * docker-compose passes `VITE_API_BASE_URL` to this image as a build arg and
 * maps `web_api` to host port 8001, so that is the default. `PUBLIC_API_BASE_URL`
 * takes precedence when set, since that is Astro's own convention.
 */
const configured =
  import.meta.env.PUBLIC_API_BASE_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:8001";

export const API_BASE_URL = String(configured).replace(/\/+$/, "");

/** All endpoints are versioned under this prefix. */
export const API_PREFIX = "/api/v1";

export const API_URL = `${API_BASE_URL}${API_PREFIX}`;

/** Per-request timeout. Kept short so a dead API cannot stall a build. */
export const API_TIMEOUT_MS = Number(
  import.meta.env.PUBLIC_API_TIMEOUT_MS ?? 5000,
);

/**
 * When the API is unreachable, fall back to the placeholder content in
 * `src/data/` rather than failing the build. Set `PUBLIC_API_FALLBACK=false`
 * to make a missing API a hard build error instead — worth doing in CI once
 * the API is actually implemented.
 */
export const ALLOW_FALLBACK = import.meta.env.PUBLIC_API_FALLBACK !== "false";
