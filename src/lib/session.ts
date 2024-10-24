import { Context } from "hono";
import { SESSION_COOKIE_NAME } from "./auth";

// use `header()` instead of `setCookie()` to avoid TS errors

export function setSessionCookie(c: Context, token: string, expiresAt: Date) {
  if (process.env.NODE_ENV === "PROD") {
    c.header(
      "Set-Cookie",
      `${SESSION_COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}; Path=/; Secure;`,
      { append: true }
    );
  } else {
    c.header(
      "Set-Cookie",
      `${SESSION_COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}; Path=/`,
      { append: true }
    );
  }
}

export function deleteSessionTokenCookie(c: Context): void {
  if (process.env.NODE_ENV === "PROD") {
    c.header(
      "Set-Cookie",
      `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/; Secure;`,
      { append: true }
    );
  } else {
    c.header("Set-Cookie", `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`, {
      append: true,
    });
  }
}
