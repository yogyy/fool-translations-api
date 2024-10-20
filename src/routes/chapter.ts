import { Hono } from "hono";
import { db } from "@/db";
import { chapterTable, novelTable } from "@/db/schema/novel";
import { AllChapterParam, byIdParam } from "@/lib/dtos";
import { AuthContext } from "@/types";
import { zValidator } from "@hono/zod-validator";
import { and, eq, gt, lt, sql } from "drizzle-orm";

const chapterRoutes = new Hono<AuthContext>()
  .get("/", zValidator("query", AllChapterParam), async (c) => {
    const { novelId } = c.req.valid("query");
    try {
      const novels = await db.select().from(chapterTable).where(eq(chapterTable.novelId, novelId));
      if (novels.length === 0)
        return c.json({ success: false, error: "Novel's Chapter Not Found" }, 404);

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

      if (!currentCh) return c.json({ success: false, error: "Chapter Not Found" }, 404);

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
  });

export default chapterRoutes;
