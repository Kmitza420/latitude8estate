import {
  ALLOW_FALLBACK,
  API_TIMEOUT_MS,
  API_URL,
} from "./config";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly path?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Once a request fails because nothing is listening, every later request in the
 * same process would fail the same way. During a static build that is dozens of
 * five-second timeouts, so the first connection failure trips this breaker and
 * the rest short-circuit immediately.
 */
let apiUnreachable = false;
let warnedUnreachable = false;

/** Reset between test runs. */
export function resetApiBreaker() {
  apiUnreachable = false;
  warnedUnreachable = false;
}

export function isApiUnreachable() {
  return apiUnreachable;
}

function warnOnce(reason: string) {
  if (warnedUnreachable) return;
  warnedUnreachable = true;
  console.warn(
    `[services] Web API unreachable at ${API_URL} (${reason}).\n` +
      `[services] Serving placeholder content from src/data/. ` +
      `Set PUBLIC_API_FALLBACK=false to make this a build error instead.`,
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (apiUnreachable) {
    throw new ApiError("API previously unreachable", undefined, path);
  }

  const url = `${API_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
  } catch (cause) {
    // Connection refused, DNS failure or timeout — the API is not up.
    apiUnreachable = true;
    warnOnce(cause instanceof Error ? cause.message : String(cause));
    throw new ApiError(`Request to ${url} failed`, undefined, path);
  }

  if (!response.ok) {
    throw new ApiError(
      `${response.status} ${response.statusText} for ${path}`,
      response.status,
      path,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) });
}

/**
 * Run a read against the API, falling back to bundled placeholder content when
 * it is not available. Only for GETs — writes must surface their failure to the
 * user rather than pretending to succeed.
 */
export async function readWithFallback<T>(
  label: string,
  read: () => Promise<T>,
  fallback: () => T,
): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (!ALLOW_FALLBACK) throw error;
    if (!(error instanceof ApiError)) throw error;
    if (error.status !== undefined) {
      // The API answered, just not usefully. Worth its own line in the log.
      console.warn(`[services] ${label}: ${error.message}; using placeholder content.`);
    }
    return fallback();
  }
}
