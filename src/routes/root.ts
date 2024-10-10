import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { logger } from "hono/logger";
import { getCookie } from "hono/cookie";
import { AuthContext } from "@/types";
import { lucia } from "@/lib/lucia-auth";
import authRoutes from "./auth";
import novelRoutes from "./novel";

const app = new Hono<AuthContext>().basePath("/api/v1");

app.use("*", logger());
app.use(csrf());
app.use("*", async (c, next) => {
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

app.route("/auth", authRoutes);
app.route("/novels", novelRoutes);

export default app;
