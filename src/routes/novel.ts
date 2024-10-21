import { db } from "@/db";
import { Hono } from "hono";
import { avg, count, desc, eq, sql, SQLWrapper } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { byIdParam, AllNovelParams } from "@/lib/dtos";
import { novelTable, RatingTable } from "@/db/schema/novel";
import { AuthContext } from "@/types";

const novelRoutes = new Hono<AuthContext>()
  .get("/", zValidator("query", AllNovelParams), async (c) => {
    const { sort, status, genre, page, pageSize } = c.req.valid("query");

    const orderColumn: SQLWrapper =
      sort === "recent"
        ? novelTable.last_updated
        : sort === "views"
        ? novelTable.totalViews
        : sql`${count(RatingTable.id)} * ${avg(RatingTable.rating)}`;

    try {
      const novels = await db
        .select({
          id: novelTable.id,
          title: novelTable.title,
          genres: novelTable.genres,
          cover: novelTable.cover,
          totalRatings: count(RatingTable.id),
          averageRating: avg(RatingTable.rating),
          popularityScore: sql`${count(RatingTable.id)} * ${avg(RatingTable.rating)}`,
        })
        .from(novelTable)
        .leftJoin(RatingTable, eq(novelTable.id, RatingTable.novelId))
        .where(status !== "all" ? eq(novelTable.status, status) : undefined)
        .groupBy(novelTable.id)
        .orderBy(desc(orderColumn))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      return c.json(novels);
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .get("/featured/hot", async (c) => {
    try {
      const hotNovels = await db.query.SpotlightTable.findMany();

      return c.json({ success: true, data: hotNovels });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .get("/featured/top", async (c) => {
    try {
      const topnovels = await db
        .select({
          id: novelTable.id,
          title: novelTable.title,
          cover: novelTable.cover,
        })
        .from(novelTable)
        .leftJoin(RatingTable, eq(novelTable.id, RatingTable.novelId))
        .groupBy(novelTable.id)
        .orderBy(desc(sql`${count(RatingTable.id)} * ${avg(RatingTable.rating)}`))
        .limit(20);

      return c.json({ success: true, data: topnovels });
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
      if (!novelbyId) return c.json({ success: false, error: "Novel Not Found" }, 404);

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
  });

export default novelRoutes;
