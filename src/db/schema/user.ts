import { SQL, sql } from "drizzle-orm";
import { sqliteTable, text, integer, AnySQLiteColumn, uniqueIndex } from "drizzle-orm/sqlite-core";

export function lower(email: AnySQLiteColumn): SQL {
  return sql`lower(${email})`;
}

export const userTable = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    type: text("type", { enum: ["user", "admin"] }).default("user"),
    image: text("image"),
    passwordHash: text("password_hash").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => ({ emailUniqueIndex: uniqueIndex("emailUniqueIndex").on(lower(table.email)) })
);

export const sessionTable = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export type User = typeof userTable.$inferInsert;
export type Session = typeof sessionTable.$inferInsert;
