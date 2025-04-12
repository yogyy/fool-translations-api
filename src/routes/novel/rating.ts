import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";

import { AppContext } from "@/types";
import { isUser } from "@/middleware";
import { RatingTable as table } from "@/db/schema/novel";
import { byIdParam } from "@/lib/dtos";
import { createDB } from "@/db";
import { User } from "@/db/schema/user";
import { FOREIGN_KEY_CONSTRAINT, UNIQUE_CONSTRAINT } from "@/lib/utils";
import { z } from "zod";

export const RatingDTO = z.object({
  rating: z.number().min(1).max(5),
});

const ratingRoutes = new Hono<AppContext>()
  .use(isUser)
  .get("/", zValidator("param", byIdParam("nvl_")), async (c) => {
    const { id } = c.req.valid("param");
    const user = c.get("user") as User;
    const db = createDB(c.env);

    try {
      const userRating = await db.query.RatingTable.findFirst({
        where: and(eq(table.novelId, id), eq(table.userId, user.id)),
      });

      if (!userRating) return c.json({ success: true, data: { isRated: true, rating: 0 } });

      return c.json({ success: true, data: { isRated: true, rating: userRating.rating } });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .post("/", zValidator("param", byIdParam("nvl_")), zValidator("json", RatingDTO), async (c) => {
    const { id } = c.req.valid("param");
    const { rating } = c.req.valid("json");
    const user = c.get("user") as User;
    const db = createDB(c.env);

    const dataReturned = { novelId: table.novelId, userId: table.userId, rate: table.rating };

    try {
      const [newRating] = await db
        .insert(table)
        .values({ userId: user.id, novelId: id, rating })
        .returning(dataReturned);

      return c.json({ success: true, message: "Rating submitted successfully", data: newRating });
    } catch (err: any) {
      if (err.message.includes(FOREIGN_KEY_CONSTRAINT)) {
        return c.json({ success: false, error: "Novel Not Found" }, 404);
      }
      if (err.message.includes(UNIQUE_CONSTRAINT)) {
        const [updateRating] = await db
          .update(table)
          .set({ rating })
          .where(and(eq(table.novelId, id), eq(table.userId, user.id)))
          .returning(dataReturned);

        return c.json({
          success: true,
          message: "Rating updated successfully",
          data: updateRating,
        });
      }
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  });

export default ratingRoutes;
