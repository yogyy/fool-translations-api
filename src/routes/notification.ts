import { createDB } from "@/db";
import { notificationTable } from "@/db/schema/notification";
import { User } from "@/db/schema/user";
import { NotifSeen } from "@/lib/dtos";
import { isUser } from "@/middleware";
import { AppContext } from "@/types";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

const notAuthorized = {
  success: false,
  error: "You are not authorized to access this notification.",
};

const notificationRoutes = new Hono<AppContext>()
  .use(isUser)
  .get("/", async (c) => {
    const user = c.get("user") as User;
    const db = createDB(c.env);
    const ntf = await db.query.notificationTable.findMany({
      where: eq(notificationTable.userId, user?.id),
      columns: { novelId: false },
      with: { novel: { columns: { id: true, cover: true, title: true } } },
      orderBy: (notificationTable, { desc }) => [desc(notificationTable.createdAt)],
    });

    return c.json({ success: true, data: ntf });
  })
  .patch("/:id", zValidator("param", NotifSeen), async (c) => {
    const { id } = c.req.valid("param");
    const user = c.get("user") as User;
    const db = createDB(c.env);

    const ntf = await db.query.notificationTable.findFirst({ where: eq(notificationTable.id, id) });
    if (ntf?.userId !== user.id) return c.json(notAuthorized, 403);
    if (ntf.isRead) {
      await db.update(notificationTable).set({ isRead: false }).where(eq(notificationTable.id, id));
    } else {
      await db.update(notificationTable).set({ isRead: true }).where(eq(notificationTable.id, id));
    }
    return c.json({ success: true });
  })
  .delete("/:id", zValidator("param", NotifSeen), async (c) => {
    const { id } = c.req.valid("param");
    const user = c.get("user") as User;
    const db = createDB(c.env);

    const ntf = await db.query.notificationTable.findFirst({ where: eq(notificationTable.id, id) });
    if (ntf?.userId !== user.id) return c.json(notAuthorized, 403);

    await db.delete(notificationTable).where(eq(notificationTable.id, id));

    return c.json({ success: true });
  });

export default notificationRoutes;
