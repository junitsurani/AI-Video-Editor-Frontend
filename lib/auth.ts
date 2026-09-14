import { demoMode } from "./demo";

export type User = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};
export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
  ) {
    super(message);
  }
}
let csrf: string | undefined;
let pending: Promise<string> | undefined;
export function clearCsrf() {
  csrf = undefined;
  pending = undefined;
}
export async function csrfHeaders(): Promise<Record<string, string>> {
  if (!csrf) {
    pending ??= fetch("/api/auth/csrf", {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error("Unable to start a secure session. Please retry.");
        const body = await response.json();
        csrf = body.csrf_token;
        return csrf!;
      })
      .finally(() => {
        pending = undefined;
      });
    await pending;
  }
  return { "X-Frame-CSRF": csrf! };
}
export async function authRequest<T>(path: string, data?: unknown): Promise<T> {
  if (demoMode) {
    const response = await fetch("/api/demo-session", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(data as Record<string, unknown>),
        action: path,
      }),
    });
    const body = await response.json();
    if (!response.ok)
      throw new AuthError(body.error, undefined, response.status);
    clearCsrf();
    return body as T;
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch("/api/auth" + path, {
      method: data === undefined ? "GET" : "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers:
        data === undefined
          ? undefined
          : { "Content-Type": "application/json", ...(await csrfHeaders()) },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    let body;
    try {
      body = await response.json();
    } catch {
      throw new Error("We couldn’t connect. Please try again.");
    }
    if (body.code === "csrf_invalid" && attempt === 0) {
      clearCsrf();
      continue;
    }
    if (!response.ok)
      throw new AuthError(
        body.error || "Please try again.",
        body.code,
        response.status,
      );
    if (
      ["/login", "/logout", "/verify-email", "/reset-password"].includes(path)
    )
      clearCsrf();
    return body as T;
  }
  throw new Error("Your session changed. Please retry.");
}
export function safeNext(value: string | null | undefined) {
  // Only studio destinations; reject protocol-relative URLs, backslashes and control characters.
  if (
    !value ||
    /[\\\x00-\x20]/.test(value) ||
    !/^\/studio(?:[/?]|$)/.test(value)
  )
    return "/studio";
  const url = new URL(value, "https://frame.invalid");
  return url.origin === "https://frame.invalid"
    ? url.pathname + url.search
    : "/studio";
}

export function redirectToLogin() {
  clearCsrf();
  window.location.replace(
    "/login?next=" +
      encodeURIComponent(
        safeNext(window.location.pathname + window.location.search),
      ),
  );
}
