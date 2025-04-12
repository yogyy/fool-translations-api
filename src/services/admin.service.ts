import { createDB } from "@/db";
import { Notifications, notificationTable } from "@/db/schema/notification";
import { chapterTable, novelTable, subscribeTable } from "@/db/schema/novel";
import { generateRandId } from "@/lib/utils";
import { novelPayloadDTO, editNovelPayloadDTO, chapterPayloadDTO } from "@/lib/dtos";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { AppContext } from "@/types";

export async function addNewNovel(
  env: AppContext["Bindings"],
  body: z.infer<typeof novelPayloadDTO>
) {
  const [data] = await createDB(env)
    .insert(novelTable)
    .values({ id: generateRandId("nvl"), ...body })
    .returning();

  return data;
}

export async function updateNovel(
  env: AppContext["Bindings"],
  body: z.infer<typeof editNovelPayloadDTO>,
  id: string
) {
  const [data] = await createDB(env)
    .update(novelTable)
    .set({ ...body, lastUpdated: sql`(current_timestamp)` })
    .where(eq(novelTable.id, id))
    .returning();

  return data;
}

export async function deleteNovel(env: AppContext["Bindings"], id: string) {
  const [data] = await createDB(env)
    .delete(novelTable)
    .where(eq(novelTable.id, id))
    .returning({ id: novelTable.id });

  return data;
}

export async function getNovel(env: AppContext["Bindings"], novelId: string) {
  return await createDB(env).query.novelTable.findFirst({ where: eq(novelTable.id, novelId) });
}

export async function addChapter(
  env: AppContext["Bindings"],
  body: z.infer<typeof chapterPayloadDTO>
) {
  const [data] = await createDB(env)
    .insert(chapterTable)
    .values({ id: generateRandId("ch"), ...body })
    .returning();

  return data;
}

export async function updateLastUpdatedForNovel(env: AppContext["Bindings"], novelId: string) {
  return await createDB(env)
    .update(novelTable)
    .set({ lastUpdated: sql`(current_timestamp)` })
    .where(eq(novelTable.id, novelId));
}

export async function notifySubscribers(
  env: AppContext["Bindings"],
  body: z.infer<typeof chapterPayloadDTO>
) {
  const userSubs = await createDB(env).query.subscribeTable.findMany({
    where: eq(subscribeTable.novelId, body.novelId),
    columns: { userId: true },
  });

  if (userSubs.length > 0) {
    await createDB(env)
      .insert(notificationTable)
      .values(
        userSubs.map((item) => ({
          id: generateRandId("ntf"),
          userId: item.userId,
          novelId: body.novelId,
          type: "new_chapter",
        })) as Notifications[]
      );
  }
}

const updateChSchema = chapterPayloadDTO.omit({ novelId: true });
export async function updateChapter(
  env: AppContext["Bindings"],
  body: z.infer<typeof updateChSchema>,
  id: string
) {
  const [data] = await createDB(env)
    .update(chapterTable)
    .set({ ...body })
    .where(eq(chapterTable.id, id))
    .returning();

  return data;
}

export async function deleteChapter(env: AppContext["Bindings"], id: string) {
  const [data] = await createDB(env)
    .delete(chapterTable)
    .where(eq(chapterTable.id, id))
    .returning({ id: chapterTable.id });

  return data;
}
