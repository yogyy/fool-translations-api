import { defineWorkersConfig, readD1Migrations } from "@cloudflare/vitest-pool-workers/config";
import path from "node:path";

export default defineWorkersConfig(async () => {
  return {
    test: {
      alias: { "@": path.resolve(__dirname, "./src") },
      poolOptions: {
        workers: {
          wrangler: { configPath: "./wrangler.jsonc" },
        },
      },
    },
  };
});
