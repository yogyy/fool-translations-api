import { AuthContext } from "@/types";
import { Hono } from "hono";
import { db } from "@/db";
import { SQLiteError } from "bun:sqlite";
import { eq, sql } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { novelPayloadDTO, byIdParam, editNovelPayloadDTO, chapterPayloadDTO } from "@/lib/dtos";
import { chapterTable, novelTable } from "@/db/schema/novel";
import { generateRandId } from "@/lib/utils";
import { isAdmin } from "@/middleware";

const adminRoutes = new Hono<AuthContext>()
  .use(isAdmin)
  .post("/novel", zValidator("json", novelPayloadDTO), async (c) => {
    const body = c.req.valid("json");

    try {
      const [newNovel] = await db
        .insert(novelTable)
        .values({ id: generateRandId("nvl"), ...body })
        .returning();
      return c.json({ success: true, data: newNovel });
    } catch (err) {
      if (err instanceof SQLiteError && err.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return c.json({ success: false, error: `Novel '${body.title}' Already Exists` }, 400);
      }
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .put(
    "/novel/:id",
    zValidator("param", byIdParam("nvl_")),
    zValidator("json", editNovelPayloadDTO),
    async (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      try {
        const [editedNovel] = await db
          .update(novelTable)
          .set({ ...body, last_updated: sql`(current_timestamp)` })
          .where(eq(novelTable.id, id))
          .returning();
        if (!editedNovel) return c.json({ success: false, error: "Novel Not Found" }, 404);

        return c.json({ success: true, data: editedNovel });
      } catch (err) {
        console.log(err);
        return c.json({ error: "Internal Server Errror" }, 500);
      }
    }
  )
  .delete("/novel/:id", zValidator("param", byIdParam("nvl_")), async (c) => {
    const { id } = c.req.valid("param");

    try {
      const [deleted] = await db
        .delete(novelTable)
        .where(eq(novelTable.id, id))
        .returning({ id: novelTable.id });
      if (!deleted) return c.json({ success: false, error: "Novel Not Found" }, 404);

      return c.json({ success: true, data: `Novel ${deleted.id} Deleted.` });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .post("/chapter", zValidator("json", chapterPayloadDTO), async (c) => {
    const body = c.req.valid("json");

    try {
      const [newChapter] = await db
        .insert(chapterTable)
        .values({ id: generateRandId("ch"), ...body })
        .returning();

      await db
        .update(novelTable)
        .set({ last_updated: sql`(current_timestamp)` })
        .where(eq(novelTable.id, newChapter.novelId));

      return c.json({ success: true, data: newChapter });
    } catch (err) {
      if (err instanceof SQLiteError && err.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return c.json(
          { success: false, error: `Chapter ${body.chapterNum} of this Novel Already Exists` },
          400
        );
      }
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .put(
    "/chapter/:id",
    zValidator("param", byIdParam("ch_")),
    zValidator("json", chapterPayloadDTO),
    async (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      const [updated] = await db
        .update(chapterTable)
        .set({ ...body })
        .where(eq(chapterTable.id, id))
        .returning();
      if (!updated) return c.json({ success: false, error: "Chapter Not Found" }, 404);

      return c.json(updated);
    }
  )
  .delete("/chapter/:id", zValidator("param", byIdParam("ch_")), async (c) => {
    const { id } = c.req.valid("param");

    try {
      const [deleted] = await db
        .delete(chapterTable)
        .where(eq(chapterTable.id, id))
        .returning({ id: chapterTable.id });
      if (!deleted) return c.json({ success: false, error: "Chapter Not Found" }, 404);

      return c.json({ success: true, data: `Chapter ${deleted.id} Deleted.` });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  });
export default adminRoutes;
