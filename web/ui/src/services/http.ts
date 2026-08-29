/**
 * The one place this site talks to `web/api`.
 *
 * Nothing above this module uses `fetch` directly, so timeouts, error shapes
 * and URL construction stay consistent between the build-time page renders and
 * the two React islands that POST from the browser.
 */

import { ALLOW_PLACEHOLDER_FALLBACK, API_BASE_URL, API_TIMEOUT_MS } from "./config";

export type QueryValue = string | number | boolean | undefined | null;

/**
 * A request that did not produce a usable response.
 *
 * `status` is the HTTP status when the server answered, and `null` when the
 * request never got that far — DNS failure, connection refused, timeout. The
 * distinction matters: a 404 is an answer ("no such post"), a `null` status is
 * the API being absent, which is what the fixture fallback exists for.
 */
export class ApiError extends Error {
  readonly status: number | null;
  readonly url: string;
  readonly body: unknown;

  constructor(
    message: string,
    options: { url: string; status?: number | null; body?: unknown; cause?: unknown },
  ) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.url = options.url;
    this.status = options.status ?? null;
    this.body = options.body;
  }

  /** The server answered, and the answer was "that does not exist". */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** The server never answered at all. */
  get isTransport(): boolean {
    return this.status === null;
  }

  /** Field-level validation errors from FastAPI's 422 response. */
  get isValidation(): boolean {
    return this.status === 422;
  }
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function timeoutSignal(): AbortSignal | undefined {
  // `AbortSignal.timeout` is present in Node 22 (the engine this package
  // requires) and every browser we target, but guard anyway rather than
  // throwing inside a build.
  return typeof AbortSignal?.timeout === "function"
    ? AbortSignal.timeout(API_TIMEOUT_MS)
    : undefined;
}

/** Pull FastAPI's `{"detail": ...}` out of an error body when it is there. */
function detailOf(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

async function request<T>(path: string, init: RequestInit, query?: Record<string, QueryValue>): Promise<T> {
  const url = buildUrl(path, query);

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: init.signal ?? timeoutSignal(),
      headers: { Accept: "application/json", ...init.headers },
    });
  } catch (cause) {
    throw new ApiError(`Could not reach ${url}`, { url, cause });
  }

  const raw = await response.text();
  let body: unknown = undefined;
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      body = raw;
    }
  }

  if (!response.ok) {
    throw new ApiError(detailOf(body, `${response.status} ${response.statusText} from ${url}`), {
      url,
      status: response.status,
      body,
    });
  }

  return body as T;
}

export function apiGet<T>(path: string, query?: Record<string, QueryValue>): Promise<T> {
  return request<T>(path, { method: "GET" }, query);
}

export function apiPost<T>(path: string, payload: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

const warned = new Set<string>();

/**
 * Run a read against the API, and drop back to the placeholder fixtures when
 * it fails.
 *
 * Each distinct `label` warns once per build, so a cold API produces a handful
 * of readable lines instead of one per page. Callers that need to tell "no
 * such record" apart from "no API" should check `ApiError.isNotFound`
 * themselves before reaching for this.
 */
export async function withFallback<T>(
  label: string,
  load: () => Promise<T>,
  fallback: () => T,
): Promise<T> {
  try {
    return await load();
  } catch (error) {
    if (!ALLOW_PLACEHOLDER_FALLBACK) throw error;

    if (!warned.has(label)) {
      warned.add(label);
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`[services] ${label}: falling back to placeholder data — ${reason}`);
    }
    return fallback();
  }
}
