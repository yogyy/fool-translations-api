import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as novelSchema from "./schema/novel";
import * as userSchema from "./schema/user";

const sqlite = new Database("./src/db/novel.sqlite");
const db = drizzle(sqlite, { schema: { ...novelSchema, ...userSchema } });

export { db };
