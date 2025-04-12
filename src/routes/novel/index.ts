import { createDB } from "@/db";
import { Hono } from "hono";
import { avg, count, desc, eq, sql, SQLWrapper } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { byIdParam, AllNovelParams } from "@/lib/dtos";
import { novelTable, RatingTable } from "@/db/schema/novel";
import { AppContext } from "@/types";
import ratingRoutes from "./rating";
import favoriteRoutes from "./favorite";
import subscribeRoutes from "./subscribe";

const novelRoutes = new Hono<AppContext>()
  .get("/", zValidator("query", AllNovelParams), async (c) => {
    const { sort, status, genre, page, pageSize } = c.req.valid("query");
    const db = createDB(c.env);

    const orderColumn: SQLWrapper =
      sort === "recent"
        ? novelTable.lastUpdated
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
          lastUpdated: novelTable.lastUpdated,
          totalViews: novelTable.totalViews,
          status: novelTable.status,
          popularityScore: sql`${count(RatingTable.id)} * ${avg(RatingTable.rating)}`,
        })
        .from(novelTable)
        .leftJoin(RatingTable, eq(novelTable.id, RatingTable.novelId))
        .where(status !== "all" ? eq(novelTable.status, status) : undefined)
        .groupBy(novelTable.id)
        .orderBy(desc(orderColumn))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      return c.json({ success: true, data: novels });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .get("/featured/hot", async (c) => {
    const db = createDB(c.env);
    try {
      const hotNovels = await db.query.SpotlightTable.findMany();

      return c.json({ success: true, data: hotNovels });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .get("/featured/top", async (c) => {
    const db = createDB(c.env);
    try {
      const topnovels = await db
        .select({
          id: novelTable.id,
          title: novelTable.title,
          cover: novelTable.cover,
          genres: novelTable.genres,
        })
        .from(novelTable)
        .leftJoin(RatingTable, eq(novelTable.id, RatingTable.novelId))
        .groupBy(novelTable.id)
        .orderBy(desc(sql`${count(RatingTable.id)} * ${avg(RatingTable.rating)}`))
        .limit(10);

      return c.json({ success: true, data: topnovels });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .get("/:id", zValidator("param", byIdParam("nvl_")), async (c) => {
    const { id } = c.req.valid("param");
    const db = createDB(c.env);

    const updateView = db
      .update(novelTable)
      .set({ totalViews: sql`${novelTable.totalViews} + 1` })
      .where(eq(novelTable.id, id))
      .prepare();

    try {
      const novelbyId = await db.query.novelTable.findFirst({ where: eq(novelTable.id, id) });
      if (!novelbyId) return c.json({ success: false, error: "Novel Not Found" }, 404);

      const [rating] = await db
        .select({ value: avg(RatingTable.rating) })
        .from(RatingTable)
        .where(eq(RatingTable.novelId, id));

      updateView.run();
      return c.json({
        success: true,
        data: { ...novelbyId, averageRating: Number(rating.value) },
      });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .route("/:id/rating", ratingRoutes)
  .route("/:id/favorite", favoriteRoutes)
  .route("/:id/subscribe", subscribeRoutes);

export default novelRoutes;
