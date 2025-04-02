import { subscribeTable } from "@/db/schema/novel";
import { AppContext } from "@/types";
import { zValidator } from "@hono/zod-validator";
import { and, count, eq } from "drizzle-orm";
import { Hono } from "hono";
import { byIdParam } from "@/lib/dtos";
import { isUser } from "@/middleware";
import { User } from "@/db/schema/user";
import { createDB } from "@/db";
import { FOREIGN_KEY_CONSTRAINT, UNIQUE_CONSTRAINT } from "@/lib/utils";

const subscribeRoutes = new Hono<AppContext>()
  .get("/", zValidator("param", byIdParam("nvl_")), async (c) => {
    const { id } = c.req.valid("param");
    const user = c.get("user");
    const db = createDB(c.env);

    try {
      const [totalSubs] = await db
        .select({ count: count() })
        .from(subscribeTable)
        .where(eq(subscribeTable.novelId, id));

      const noSubs = c.json({
        success: true,
        data: { isSubscribed: false, total: totalSubs.count },
      });

      if (!user) return noSubs;

      const favorited = await db.query.subscribeTable.findFirst({
        where: and(eq(subscribeTable.novelId, id), eq(subscribeTable.userId, user.id)),
      });

      if (!favorited) return noSubs;

      return c.json({
        success: true,
        data: { isSubscribed: true, total: totalSubs.count },
      });
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
      await db.insert(subscribeTable).values({ userId: user.id, novelId: id });

      return c.json({ success: true, action: "added", message: "You've subscribed to this novel" });
    } catch (err: any) {
      if (err.message.includes(FOREIGN_KEY_CONSTRAINT)) {
        return c.json({ success: false, error: "Novel Not Found" }, 404);
      }
      if (err.message.includes(UNIQUE_CONSTRAINT)) {
        await db
          .delete(subscribeTable)
          .where(and(eq(subscribeTable.novelId, id), eq(subscribeTable.userId, user.id)));

        return c.json({
          success: true,
          action: "removed",
          message: "You've unsubscribed from this novel",
        });
      }
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  });

export default subscribeRoutes;
