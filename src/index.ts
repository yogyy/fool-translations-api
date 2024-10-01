import { serve } from "bun";
import { Hono } from "hono";
import { logger } from "hono/logger";

const app = new Hono().basePath("/api/v1");

app.use("*", logger());
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

const port = 4000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
