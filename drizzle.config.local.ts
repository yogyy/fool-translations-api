import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/*.ts",
  dialect: "sqlite",
  out: "./drizzle",
  dbCredentials: {
    url: "./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/b19148cacff93f4ab2f727da854289125237724a7a920b9ad0a370c89ef4e3b6.sqlite",
  },
});
