import { db } from "@/db";
import { chapterTable, novelTable } from "@/db/schema";
import { AllChapterParam, byIdParam, chapterPayloadDTO } from "@/lib/dtos";
import { generateRandId } from "@/lib/utils";
import { AuthContext } from "@/types";
import { zValidator } from "@hono/zod-validator";
import { SQLiteError } from "bun:sqlite";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { Hono } from "hono";

const chapterRoutes = new Hono<AuthContext>()
  .get("/all", zValidator("query", AllChapterParam), async (c) => {
    const { novel_id } = c.req.valid("query");
    try {
      const novels = await db.select().from(chapterTable).where(eq(chapterTable.novelId, novel_id));
      if (novels.length === 0) return c.json({ success: false, error: "Chapter Not Found" }, 404);

      return c.json({ success: true, data: novels });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .get("/:id", zValidator("param", byIdParam("ch_")), async (c) => {
    const { id } = c.req.valid("param");

    try {
      const [currentCh] = await db
        .select({
          chapter: chapterTable,
          novel: {
            id: novelTable.id,
            title: novelTable.title,
            synopsis: novelTable.synopsis,
            banner: novelTable.banner,
          },
        })
        .from(chapterTable)
        .where(eq(chapterTable.id, id))
        .innerJoin(novelTable, eq(chapterTable.novelId, novelTable.id));

      if (!currentCh) return c.notFound();

      db.update(novelTable)
        .set({ totalViews: sql`${novelTable.totalViews} + 1` })
        .where(eq(novelTable.id, currentCh.novel.id))
        .run();

      const [prevCh] = await db
        .select({ id: chapterTable.id })
        .from(chapterTable)
        .where(
          and(
            eq(chapterTable.novelId, currentCh.novel.id),
            lt(chapterTable.chapterNum, currentCh.chapter.chapterNum)
          )
        )
        .limit(1);
      const [nextCh] = await db
        .select({ id: chapterTable.id })
        .from(chapterTable)
        .where(
          and(
            eq(chapterTable.novelId, currentCh.novel.id),
            gt(chapterTable.chapterNum, currentCh.chapter.chapterNum)
          )
        )
        .limit(1);

      return c.json({
        success: true,
        data: {
          ...currentCh,
          prev: prevCh?.id || null,
          next: nextCh?.id || null,
        },
      });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .post("/add", zValidator("json", chapterPayloadDTO), async (c) => {
    const body = c.req.valid("json");

    try {
      const [newChapter] = await db
        .insert(chapterTable)
        .values({
          id: generateRandId("ch"),
          ...body,
        })
        .returning();
      if (!newChapter) return c.notFound();

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
    "/:id",
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
      if (!updated) return c.notFound();

      return c.json(updated);
    }
  )
  .delete("/:id", zValidator("param", byIdParam("ch_")), async (c) => {
    const { id } = c.req.valid("param");

    try {
      const [deleted] = await db
        .delete(chapterTable)
        .where(eq(chapterTable.id, id))
        .returning({ id: chapterTable.id });
      if (!deleted) return c.notFound();

      return c.json({ success: true, data: `Chapter ${deleted.id} Deleted.` });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  });

export default chapterRoutes;
