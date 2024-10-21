import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { AuthContext } from "@/types";
import { lucia } from "@/lib/lucia-auth";

export const isAdmin = createMiddleware<AuthContext>(async (c, next) => {
  const admin = c.get("user"); // TODO: add user type admin
  // console.log(admin);
  if (!admin) return c.notFound();

  await next();
});

export const isUser = createMiddleware<AuthContext>(async (c, next) => {
  const user = c.get("user");

  if (!user) return c.newResponse("", 401);

  await next();
});

export const authentication = createMiddleware<AuthContext>(async (c, next) => {
  const sessionId = getCookie(c, lucia.sessionCookieName) ?? null;
  if (!sessionId) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }
  const { session, user } = await lucia.validateSession(sessionId);
  if (session && session.fresh) {
    // use `header()` instead of `setCookie()` to avoid TS errors
    c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize(), {
      append: true,
    });
  }
  if (!session) {
    c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize(), {
      append: true,
    });
  }
  c.set("user", user);
  c.set("session", session);
  return next();
});
