import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { trimTrailingSlash } from "hono/trailing-slash";
import { AuthContext } from "@/types";
import { authentication } from "@/middleware";
import authRoutes from "./auth";
import novelRoutes from "./novel";
import adminRoutes from "./novel/admin";
import ratingRoutes from "./novel/rating";
import chapterRoutes from "./novel/chapter";
import favoriteRoutes from "./novel/favorite";
import subscribeRoutes from "./novel/subscribe";
import notificationRoutes from "./notification";

const app = new Hono<AuthContext>()
  .basePath("/api/v1")
  .use(trimTrailingSlash())
  .use("*", logger(), cors({ origin: ["http://localhost:5173"], credentials: true }))
  .use("*", authentication)
  .route("/auth", authRoutes)
  .route("/novels", novelRoutes)
  .route("/chapters", chapterRoutes)
  .route("/favorites", favoriteRoutes)
  .route("/subscribes", subscribeRoutes)
  .route("/ratings", ratingRoutes)
  .route("/admin", adminRoutes)
  .route("/notifications", notificationRoutes);

// showRoutes(app); // to show available routes
export default app;
