import { db } from "@/db";
import { novelTable } from "@/db/schema";
import { novelPayloadDTO, byIdParam, editNovelPayloadDTO } from "@/lib/dtos";
import { generateRandId } from "@/lib/utils";
import { AuthContext } from "@/types";
import { zValidator } from "@hono/zod-validator";
import { SQLiteError } from "bun:sqlite";
import { desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";

const novelRoutes = new Hono<AuthContext>()
  .get("/updated", async (c) => {
    try {
      const novels = await db.query.novelTable.findMany({
        orderBy: desc(novelTable.last_updated),
      });

      return c.json(novels);
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .get("/:id", zValidator("param", byIdParam("nvl_")), async (c) => {
    const { id } = c.req.valid("param");

    const updateView = db
      .update(novelTable)
      .set({ totalViews: sql`${novelTable.totalViews} + 1` })
      .where(eq(novelTable.id, id))
      .prepare();

    try {
      const novelbyId = await db.query.novelTable.findFirst({
        where: eq(novelTable.id, id),
        with: {
          chapters: {
            columns: { id: true, title: true, chapterNum: true },
          },
        },
      });
      if (!novelbyId) return c.notFound();

      const [rating] = await db
        .select({ value: avg(RatingTable.rating) })
        .from(RatingTable)
        .where(eq(RatingTable.novelId, id));

      updateView.run();
      return c.json({
        success: true,
        data: {
          ...novelbyId,
          average_rating: Number(rating.value),
        },
      });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .post("/add", zValidator("json", novelPayloadDTO), async (c) => {
    const body = c.req.valid("json");

    try {
      const [newNovel] = await db
        .insert(novelTable)
        .values({ id: generateRandId("nvl"), ...body })
        .returning();
      return c.json({ success: true, data: newNovel });
    } catch (err) {
      if (err instanceof SQLiteError && err.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return c.json({ success: false, error: `Novel '${body.title} Already Exists'` }, 400);
      }
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .put(
    "/:id",
    zValidator("param", byIdParam("nvl_")),
    zValidator("json", editNovelPayloadDTO),
    async (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      try {
        const [editedNovel] = await db
          .update(novelTable)
          .set({ ...body })
          .where(eq(novelTable.id, id))
          .returning();
        if (!editedNovel) return c.notFound();

        return c.json({ success: true, data: editedNovel });
      } catch (err) {
        console.log(err);
        return c.json({ error: "Internal Server Errror" }, 500);
      }
    }
  )
  .delete("/:id", zValidator("param", byIdParam("nvl_")), async (c) => {
    const { id } = c.req.valid("param");

    try {
      const [deleted] = await db
        .delete(novelTable)
        .where(eq(novelTable.id, id))
        .returning({ id: novelTable.id });
      if (!deleted) return c.notFound();

      return c.json({ success: true, data: `Novel ${deleted.id} Deleted.` });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  });

export default novelRoutes;
