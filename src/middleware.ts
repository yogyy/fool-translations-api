import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { AppContext } from "@/types";
import { deleteSessionTokenCookie } from "./lib/session";
import { SESSION_COOKIE_NAME, validateSessionToken } from "./lib/auth";

export const authentication = createMiddleware<AppContext>(async (c, next) => {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);
  if (!sessionId) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  const { session, user } = await validateSessionToken(c.env, sessionId);
  if (!session) deleteSessionTokenCookie(c);

  c.set("user", user);
  c.set("session", session);
  return next();
});

export const isAdmin = createMiddleware<AppContext>(async (c, next) => {
  const admin = c.get("user")?.type === "admin";
  if (!admin) return c.json({ error: "Not an Admin" }, 401);

  await next();
});

export const isUser = createMiddleware<AppContext>(async (c, next) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" });

  await next();
});
