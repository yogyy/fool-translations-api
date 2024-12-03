import { Hono } from "hono";
import { logger } from "hono/logger";
import { AuthContext } from "@/types";
import authRoutes from "./auth";
import novelRoutes from "./novel";
import { cors } from "hono/cors";
import chapterRoutes from "./chapter";
import adminRoutes from "./admin";
import ratingRoutes from "./rating";
import { authentication } from "@/middleware";
import favoriteRoutes from "./favorite";
import { trimTrailingSlash } from "hono/trailing-slash";
import notificationRoutes from "./notification";
import subscribeRoutes from "./subscribe";

const app = new Hono<AuthContext>()
  .basePath("/api/v1")
  .use("*", logger(), cors({ origin: ["http://localhost:5173"], credentials: true }))
  .use(trimTrailingSlash())
  .use("*", authentication)
  .route("/auth", authRoutes)
  .route("/novels", novelRoutes)
  .route("/chapters", chapterRoutes)
  .route("/favorites", favoriteRoutes)
  .route("/subscribes", subscribeRoutes)
  .route("/ratings", ratingRoutes)
  .route("/admin", adminRoutes)
  .route("/notifications", notificationRoutes);

export default app;
