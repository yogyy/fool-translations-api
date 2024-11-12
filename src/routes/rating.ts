import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { SQLiteError } from "bun:sqlite";
import { AuthContext } from "@/types";
import { isUser } from "@/middleware";
import { RatingTable } from "@/db/schema/novel";
import { GetRating, RatingDTO } from "@/lib/dtos";
import { db } from "@/db";
import { User } from "@/db/schema/user";

const ratingRoutes = new Hono<AuthContext>()
  .use(isUser)
  .get("/:novelId", zValidator("param", GetRating), async (c) => {
    const { novelId } = c.req.valid("param");
    const user = c.get("user") as User;

    try {
      const userRating = await db.query.RatingTable.findFirst({
        where: and(eq(RatingTable.novelId, novelId), eq(RatingTable.userId, user.id)),
      });

      if (!userRating) return c.json({ success: false, error: "Rating Not Found" });

      return c.json({ success: true, data: userRating });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .post("/rate", zValidator("json", RatingDTO), async (c) => {
    const { novelId, rating } = c.req.valid("json");
    const user = c.get("user") as User;

    try {
      const [newRating] = await db
        .insert(RatingTable)
        .values({ userId: user.id, novelId, rating })
        .returning();

      return c.json({ success: true, data: newRating });
    } catch (err) {
      if (err instanceof SQLiteError && err.code === "SQLITE_CONSTRAINT_UNIQUE") {
        const [updateRating] = await db
          .update(RatingTable)
          .set({ rating })
          .where(and(eq(RatingTable.novelId, novelId), eq(RatingTable.userId, user.id)))
          .returning();

        return c.json({ success: true, data: updateRating });
      }
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  });

export default ratingRoutes;
