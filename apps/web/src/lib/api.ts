import type { AuthSession } from "../types";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
}

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

export function getAuthHeaders(session: AuthSession | null) {
  return session ? { Authorization: `Bearer ${session.token}` } : {};
}

export async function requestJson<T>(
  path: string,
  options: RequestInit = {},
  session: AuthSession | null = null
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
      ...getAuthHeaders(session)
    }
  });

  const raw = await response.text();
  let parsed: unknown = undefined;

  if (raw.length > 0) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
  }

  if (!response.ok) {
    const message =
      typeof parsed === "object" && parsed !== null && "message" in parsed
        ? String((parsed as { message?: unknown }).message ?? "Request failed")
        : response.statusText || "Request failed";
    throw new ApiError(message, response.status);
  }

  return parsed as T;
}

export async function getJson<T>(path: string, session: AuthSession | null = null) {
  return requestJson<T>(path, { method: "GET" }, session);
}

export async function postJson<T>(
  path: string,
  body: unknown,
  session: AuthSession | null = null
) {
  return requestJson<T>(path, {
    method: "POST",
    body: JSON.stringify(body)
  }, session);
}

export async function putJson<T>(
  path: string,
  body: unknown,
  session: AuthSession | null = null
) {
  return requestJson<T>(path, {
    method: "PUT",
    body: JSON.stringify(body)
  }, session);
}
