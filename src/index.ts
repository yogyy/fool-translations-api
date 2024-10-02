import { serve } from "bun";
import app from "./routes/root";

const port = process.env.PORT || 4000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
