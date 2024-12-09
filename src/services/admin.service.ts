import { db } from "@/db";
import { Notifications, notificationTable } from "@/db/schema/notification";
import { chapterTable, novelTable, subscribeTable } from "@/db/schema/novel";
import { generateRandId } from "@/lib/utils";
import { novelPayloadDTO, editNovelPayloadDTO, chapterPayloadDTO } from "@/lib/dtos";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";

export async function addNewNovel(body: z.infer<typeof novelPayloadDTO>) {
  const [data] = await db
    .insert(novelTable)
    .values({ id: generateRandId("nvl"), ...body })
    .returning();

  return data;
}

export async function updateNovel(body: z.infer<typeof editNovelPayloadDTO>, id: string) {
  const [data] = await db
    .update(novelTable)
    .set({ ...body, last_updated: sql`(current_timestamp)` })
    .where(eq(novelTable.id, id))
    .returning();

  return data;
}

export async function deleteNovel(id: string) {
  const [data] = await db
    .delete(novelTable)
    .where(eq(novelTable.id, id))
    .returning({ id: novelTable.id });

  return data;
}

export async function getNovel(novelId: string) {
  return await db.query.novelTable.findFirst({ where: eq(novelTable.id, novelId) });
}

export async function addChapter(body: z.infer<typeof chapterPayloadDTO>) {
  const [data] = await db
    .insert(chapterTable)
    .values({ id: generateRandId("ch"), ...body })
    .returning();

  return data;
}

export async function updateLastUpdatedForNovel(novelId: string) {
  return await db
    .update(novelTable)
    .set({ last_updated: sql`(current_timestamp)` })
    .where(eq(novelTable.id, novelId));
}

export async function notifySubscribers(body: z.infer<typeof chapterPayloadDTO>) {
  const userSubs = await db.query.subscribeTable.findMany({
    where: eq(subscribeTable.novelId, body.novelId),
    columns: { userId: true },
  });

  if (userSubs.length > 0) {
    await db.insert(notificationTable).values(
      userSubs.map((item) => ({
        id: generateRandId("ntf"),
        userId: item.userId,
        novelId: body.novelId,
        type: "new_chapter",
      })) as Notifications[]
    );
  }
}

export async function updateChapter(body: z.infer<typeof chapterPayloadDTO>, id: string) {
  const [data] = await db
    .update(chapterTable)
    .set({ ...body })
    .where(eq(chapterTable.id, id))
    .returning();

  return data;
}

export async function deleteChapter(id: string) {
  const [data] = await db
    .delete(chapterTable)
    .where(eq(chapterTable.id, id))
    .returning({ id: chapterTable.id });

  return data;
}
