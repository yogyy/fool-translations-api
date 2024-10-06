import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, unique } from "drizzle-orm/sqlite-core";
import { userTable } from "./user";

export const novelTable = sqliteTable("novel", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  genres: text("genres", { mode: "json" })
    .$type<string[]>()
    .default(sql`(json_array())`),
  synopsis: text("synopsis").notNull(),
  cover: text("cover"),
  banner: text("banner"),
  totalViews: integer("total_views").default(0),
  last_updated: text("published_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
});

export const chapterTable = sqliteTable("novel_chapter", {
  id: text("id").primaryKey(),
  chapterNum: integer("chapter_number").notNull(),
  title: text("title").notNull(),
  createdAt: text("created_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
  content: text("content").notNull(),
  novelId: text("novel_id")
    .references(() => novelTable.id, { onDelete: "cascade" })
    .notNull(),
});

export const RatingTable = sqliteTable(
  "novel_rating",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    novelId: text("novel_id")
      .references(() => novelTable.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => userTable.id)
      .notNull(),
    rating: real("rating").notNull(),
    createdAt: text("created_at")
      .default(sql`(current_timestamp)`)
      .notNull(),
  },
  (table) => ({
    unq: unique().on(table.novelId, table.userId),
  })
);

export const novelRelations = relations(novelTable, ({ many }) => ({
  chapters: many(chapterTable),
  rating: many(RatingTable),
}));

export const chapterRelations = relations(chapterTable, ({ one }) => ({
  novel: one(novelTable, {
    fields: [chapterTable.novelId],
    references: [novelTable.id],
  }),
}));

export const ratingRelations = relations(RatingTable, ({ one }) => ({
  novel: one(novelTable, {
    fields: [RatingTable.novelId],
    references: [novelTable.id],
  }),
}));

export type Novel = typeof novelTable.$inferInsert;
export type Chapter = typeof chapterTable.$inferInsert;
