import { Hono } from "hono";
import { isUser } from "@/middleware";
import { AuthContext } from "@/types";
import { zValidator } from "@hono/zod-validator";
import { db } from "@/db";
import { User } from "@/db/schema/user";
import { favoriteTable } from "@/db/schema/novel";
import { GetRating as FavNovel } from "@/lib/dtos";
import { and, count, eq } from "drizzle-orm";
import { SQLiteError } from "bun:sqlite";

const favoriteRoutes = new Hono<AuthContext>()
  .use(isUser)
  .get("/:novelId", zValidator("param", FavNovel), async (c) => {
    const { novelId } = c.req.valid("param");
    const user = c.get("user") as User;

    try {
      const [totalFav] = await db
        .select({ count: count() })
        .from(favoriteTable)
        .where(eq(favoriteTable.novelId, novelId));

      const favorited = await db.query.favoriteTable.findFirst({
        where: and(eq(favoriteTable.novelId, novelId), eq(favoriteTable.userId, user.id)),
      });

      if (!favorited)
        return c.json({
          success: true,
          data: { isFavorited: false, totalFavorites: totalFav.count },
        });

      return c.json({
        success: true,
        data: { isFavorited: true, totalFavorites: totalFav.count },
      });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .post("/", zValidator("json", FavNovel), async (c) => {
    const { novelId } = c.req.valid("json");
    const user = c.get("user") as User;

    try {
      const [favorite] = await db
        .insert(favoriteTable)
        .values({ userId: user.id, novelId })
        .returning();

      return c.json({ success: true, data: favorite });
    } catch (err) {
      if (err instanceof SQLiteError && err.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return c.json({ success: false, error: "This novel is already in your favorites." });
      }
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  });

export default favoriteRoutes;
