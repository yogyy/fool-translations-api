import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, check, unique } from "drizzle-orm/sqlite-core";
import { userTable } from "./user";
import { novelTable } from "./novel";

export const notificationTable = sqliteTable(
  "notification",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id),
    novelId: text("novel_id").references(() => novelTable.id),
    type: text("type", { enum: ["new_chapter"] }),
    isRead: integer("is_read", { mode: "boolean" }).default(false),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => ({
    checkConstraint: check(
      `type_check`,
      sql`${table.type} != 'new_chapter' OR ${table.novelId} IS NOT NULL`
    ),
  })
);

export type Notifications = typeof notificationTable.$inferInsert;
