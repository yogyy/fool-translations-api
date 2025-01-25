import { Hono } from "hono";
import { isUser } from "@/middleware";
import { AuthContext } from "@/types";
import { zValidator } from "@hono/zod-validator";
import { db } from "@/db";
import { User } from "@/db/schema/user";
import { favoriteTable } from "@/db/schema/novel";
import { novelIdValidation } from "@/lib/dtos";
import { and, count, eq } from "drizzle-orm";
import { SQLiteError } from "bun:sqlite";

const favoriteRoutes = new Hono<AuthContext>()
  .get("/:novelId", zValidator("param", novelIdValidation), async (c) => {
    const { novelId } = c.req.valid("param");
    const user = c.get("user");

    try {
      const [totalFav] = await db
        .select({ count: count() })
        .from(favoriteTable)
        .where(eq(favoriteTable.novelId, novelId));

      const noFavorited = c.json({
        success: true,
        data: { isFavorited: false, total: totalFav.count },
      });

      if (!user) return noFavorited;

      const favorited = await db.query.favoriteTable.findFirst({
        where: and(eq(favoriteTable.novelId, novelId), eq(favoriteTable.userId, user.id)),
      });

      if (!favorited) return noFavorited;

      return c.json({
        success: true,
        data: { isFavorited: true, total: totalFav.count },
      });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .use(isUser)
  .post("/", zValidator("json", novelIdValidation), async (c) => {
    const { novelId } = c.req.valid("json");
    const user = c.get("user") as User;

    try {
      await db.insert(favoriteTable).values({ userId: user.id, novelId }).returning();

      return c.json({ success: true, action: "added", data: "This Novel added to your Favorites" });
    } catch (err) {
      if (err instanceof SQLiteError && err.code === "SQLITE_CONSTRAINT_UNIQUE") {
        await db
          .delete(favoriteTable)
          .where(and(eq(favoriteTable.novelId, novelId), eq(favoriteTable.userId, user.id)));

        return c.json({
          success: true,
          action: "deleted",
          data: "This Novel was removed from your Favorites",
        });
      }
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  });

export default favoriteRoutes;
