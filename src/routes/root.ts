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
  .basePath("/api/v1")
  .use(trimTrailingSlash())
  .use("*", logger(), cors({ origin: ["http://localhost:5173"], credentials: true }))
  .use("*", authentication)
  .route("/auth", authRoutes)
  .route("/admin", adminRoutes)
  .route("/novels", novelRoutes)
  .route("/chapters", chapterRoutes)
  .route("/notifications", notificationRoutes)
  .route("/testing", testingRoutes);

// showRoutes(app); // to show available routes
export default app;
