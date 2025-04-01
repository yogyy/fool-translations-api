import { drizzle } from "drizzle-orm/d1";
import * as novelSchema from "./schema/novel";
import * as userSchema from "./schema/user";
import * as ntfSchema from "./schema/notification";
import { AppContext } from "@/types";

export function createDB(env: AppContext["Bindings"]) {
  const db = drizzle(env.DB, { schema: { ...novelSchema, ...userSchema, ...ntfSchema } });
  return db;
}
