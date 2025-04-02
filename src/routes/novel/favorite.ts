import { Hono } from "hono";
import { isUser } from "@/middleware";
import { AppContext } from "@/types";
import { zValidator } from "@hono/zod-validator";
import { createDB } from "@/db";
import { User } from "@/db/schema/user";
import { favoriteTable } from "@/db/schema/novel";
import { byIdParam } from "@/lib/dtos";
import { and, count, eq } from "drizzle-orm";
import { FOREIGN_KEY_CONSTRAINT, UNIQUE_CONSTRAINT } from "@/lib/utils";

const favoriteRoutes = new Hono<AppContext>()
  .get("/", zValidator("param", byIdParam("nvl_")), async (c) => {
    const { id } = c.req.valid("param");
    const user = c.get("user");
    const db = createDB(c.env);

    try {
      const [totalFav] = await db
        .select({ count: count() })
        .from(favoriteTable)
        .where(eq(favoriteTable.novelId, id));

      const noFavorited = c.json({
        success: true,
        data: { isFavorited: false, total: totalFav.count },
      });

      if (!user) return noFavorited;

      const favorited = await db.query.favoriteTable.findFirst({
        where: and(eq(favoriteTable.novelId, id), eq(favoriteTable.userId, user.id)),
      });

      if (!favorited) return noFavorited;

      return c.json({ success: true, data: { isFavorited: true, total: totalFav.count } });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .use(isUser)
  .post("/", zValidator("param", byIdParam("nvl_")), async (c) => {
    const { id } = c.req.valid("param");
    const user = c.get("user") as User;
    const db = createDB(c.env);

    try {
      await db.insert(favoriteTable).values({ userId: user.id, novelId: id });

      return c.json({ success: true, action: "added", message: "Novel added to your favorites" });
    } catch (err: any) {
      if (err.message.includes(FOREIGN_KEY_CONSTRAINT)) {
        return c.json({ success: false, error: "Novel Not Found" }, 404);
      }
      if (err.message.includes(UNIQUE_CONSTRAINT)) {
        await db
          .delete(favoriteTable)
          .where(and(eq(favoriteTable.novelId, id), eq(favoriteTable.userId, user.id)));

        return c.json({
          success: true,
          action: "removed",
          message: "Novel removed from your favorites",
        });
      }

      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  });

export default favoriteRoutes;
