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

const app = new Hono<AuthContext>().basePath("/api/v1");

app.use(
  "*",
  logger(),
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(trimTrailingSlash());
app.use("*", authentication);
app.route("/auth", authRoutes);
app.route("/novels", novelRoutes);
app.route("/chapters", chapterRoutes);
app.route("/favorites", favoriteRoutes);
app.route("/ratings", ratingRoutes);
app.route("/admin", adminRoutes);

export default app;
