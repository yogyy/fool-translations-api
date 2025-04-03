import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { trimTrailingSlash } from "hono/trailing-slash";
import { AppContext } from "@/types";
import { authentication } from "@/middleware";
import authRoutes from "./auth";
import novelRoutes from "./novel";
import adminRoutes from "./novel/admin";
import chapterRoutes from "./novel/chapter";
import notificationRoutes from "./notification";
import testingRoutes from "./testing";

const app = new Hono<AppContext>()
  .use("*", logger())
  .use("*", async (c, next) => {
    const corsMiddlewareHandler = cors({
      origin: c.env.CORS_ORIGIN,
    });
    return corsMiddlewareHandler(c, next);
  })
  .use("*", authentication)
  .basePath("/api/v1")
  .use(trimTrailingSlash())
  .route("/auth", authRoutes)
  .route("/admin", adminRoutes)
  .route("/novels", novelRoutes)
  .route("/chapters", chapterRoutes)
  .route("/notifications", notificationRoutes)
  .route("/testing", testingRoutes);

// showRoutes(app); // to show available routes
export default app;
