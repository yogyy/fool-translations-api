import { db } from "@/db";
import { notificationTable } from "@/db/schema/notification";
import { User } from "@/db/schema/user";
import { NotifSeen } from "@/lib/dtos";
import { isUser } from "@/middleware";
import { AuthContext } from "@/types";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

const notificationRoutes = new Hono<AuthContext>()
  .use(isUser)
  .get("/", async (c) => {
    const user = c.get("user") as User;
    const ntf = await db.query.notificationTable.findMany({
      where: eq(notificationTable.userId, user?.id),
    });

    return c.json({ success: true, data: ntf });
  })
  .patch("/seen", zValidator("json", NotifSeen), async (c) => {
    const { id } = c.req.valid("json");
    await db.update(notificationTable).set({ isRead: true }).where(eq(notificationTable.id, id));

    return c.json({ success: true });
  });

export default notificationRoutes;
