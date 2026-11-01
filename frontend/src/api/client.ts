import { useAuthStore } from "@/store/authStore";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** FastAPI errors are {detail: string} or {detail: [{msg}]} for validation errors. */
async function errorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) return body.detail[0]?.msg ?? "Invalid request";
  } catch {}
  return `Request failed (${res.status})`;
}

/** fetch with base URL, auth header and error handling. Returns the raw Response (for streaming). */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = useAuthStore.getState().token;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  // Expired/invalid token: clearing the session makes useAuth({required}) redirect to /auth.
  if (res.status === 401 && token) useAuthStore.getState().logout();
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  return res;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  return (res.status === 204 ? undefined : await res.json()) as T;
}
