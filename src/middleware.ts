import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { AuthContext } from "@/types";
import { deleteSessionTokenCookie } from "./lib/session";
import { SESSION_COOKIE_NAME, validateSessionToken } from "./lib/auth";

export const isAdmin = createMiddleware<AuthContext>(async (c, next) => {
  const admin = c.get("user")?.type === "admin";
  if (!admin) return c.notFound();

  await next();
});

export const isUser = createMiddleware<AuthContext>(async (c, next) => {
  const user = c.get("user");
  if (!user) return c.newResponse("", 401);

  await next();
});

export const authentication = createMiddleware<AuthContext>(async (c, next) => {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME) ?? null;
  if (!sessionId) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  const { session, user } = await validateSessionToken(sessionId);
  if (!session) deleteSessionTokenCookie(c);

  c.set("user", user);
  c.set("session", session);
  return next();
});
