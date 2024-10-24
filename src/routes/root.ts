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

const app = new Hono<AuthContext>().basePath("/api/v1");

app.use(
  "*",
  logger(),
  cors({
    origin: ["http://localhost:5173"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    credentials: true,
  })
);
app.use("*", authentication);
app.route("/auth", authRoutes);
app.route("/novels", novelRoutes);
app.route("/chapters", chapterRoutes);
app.route("/ratings", ratingRoutes);
app.route("/admin", adminRoutes);

export default app;
