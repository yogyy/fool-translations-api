import { db } from "@/db";
import { notificationTable } from "@/db/schema/notification";
import { User } from "@/db/schema/user";
import { NotifSeen } from "@/lib/dtos";
import { isUser } from "@/middleware";
import { AuthContext } from "@/types";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

const notAuthorized = {
  success: false,
  error: "You are not authorized to access this notification.",
};

const notificationRoutes = new Hono<AuthContext>()
  .use(isUser)
  .get("/", async (c) => {
    const user = c.get("user") as User;
    const ntf = await db.query.notificationTable.findMany({
      where: eq(notificationTable.userId, user?.id),
    });

    return c.json({ success: true, data: ntf });
  })
  .patch("/", zValidator("json", NotifSeen), async (c) => {
    const { id } = c.req.valid("json");
    const user = c.get("user") as User;

    const ntf = await db.query.notificationTable.findFirst({ where: eq(notificationTable.id, id) });
    if (ntf?.userId !== user.id) return c.json(notAuthorized, 403);

    await db.update(notificationTable).set({ isRead: true }).where(eq(notificationTable.id, id));
    return c.json({ success: true });
  })
  .delete("/", zValidator("json", NotifSeen), async (c) => {
    const { id } = c.req.valid("json");
    const user = c.get("user") as User;

    const ntf = await db.query.notificationTable.findFirst({ where: eq(notificationTable.id, id) });
    if (ntf?.userId !== user.id) return c.json(notAuthorized, 403);

    await db.delete(notificationTable).where(eq(notificationTable.id, id));

    return c.json({ success: true });
  });

export default notificationRoutes;
