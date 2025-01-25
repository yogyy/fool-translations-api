import { db } from "@/db";
import { subscribeTable } from "@/db/schema/novel";
import { AuthContext } from "@/types";
import { zValidator } from "@hono/zod-validator";
import { and, count, eq } from "drizzle-orm";
import { Hono } from "hono";
import { novelIdValidation as NovelById } from "@/lib/dtos";
import { isUser } from "@/middleware";
import { User } from "@/db/schema/user";
import { SQLiteError } from "bun:sqlite";

const subscribeRoutes = new Hono<AuthContext>()
  .get("/:novelId", zValidator("param", NovelById), async (c) => {
    const { novelId } = c.req.valid("param");
    const user = c.get("user");

    try {
      const [totalSubs] = await db
        .select({ count: count() })
        .from(subscribeTable)
        .where(eq(subscribeTable.novelId, novelId));

      const noSubs = c.json({
        success: true,
        data: { isSubscribed: false, total: totalSubs.count },
      });

      if (!user) return noSubs;

      const favorited = await db.query.subscribeTable.findFirst({
        where: and(eq(subscribeTable.novelId, novelId), eq(subscribeTable.userId, user.id)),
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
  .post("/notify", zValidator("json", NovelById), async (c) => {
    const { novelId } = c.req.valid("json");
    const user = c.get("user") as User;

    try {
      await db.insert(subscribeTable).values({ userId: user.id, novelId }).returning();

      return c.json({
        success: true,
        action: "add",
        data: "You've subscribed to this novel",
      });
    } catch (err) {
      if (err instanceof SQLiteError && err.code === "SQLITE_CONSTRAINT_UNIQUE") {
        await db
          .delete(subscribeTable)
          .where(and(eq(subscribeTable.novelId, novelId), eq(subscribeTable.userId, user.id)));

        return c.json({
          success: true,
          action: "delete",
          data: "You've unsubscribed from this novel",
        });
      }
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  });

export default subscribeRoutes;
