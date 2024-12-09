import { AuthContext } from "@/types";
import { Hono } from "hono";
import { SQLiteError } from "bun:sqlite";
import { zValidator } from "@hono/zod-validator";
import { novelPayloadDTO, byIdParam, editNovelPayloadDTO, chapterPayloadDTO } from "@/lib/dtos";
import { isAdmin } from "@/middleware";
import {
  getNovel,
  addChapter,
  updateNovel,
  addNewNovel,
  deleteNovel,
  deleteChapter,
  updateChapter,
  notifySubscribers,
  updateLastUpdatedForNovel,
} from "@/services/admin.service";

const adminRoutes = new Hono<AuthContext>()
  .use(isAdmin)
  .post("/novel", zValidator("json", novelPayloadDTO), async (c) => {
    const body = c.req.valid("json");

    try {
      const newNovel = await addNewNovel(body);
      return c.json({ success: true, data: newNovel });
    } catch (err) {
      if (err instanceof SQLiteError && err.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return c.json({ success: false, error: `Novel '${body.title}' Already Exists` }, 400);
      }
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .put(
    "/novel/:id",
    zValidator("param", byIdParam("nvl_")),
    zValidator("json", editNovelPayloadDTO),
    async (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      try {
        const updatedNovel = await updateNovel(body, id);
        if (!updatedNovel) return c.json({ success: false, error: "Novel Not Found" }, 404);

        return c.json({ success: true, data: updatedNovel });
      } catch (err) {
        console.log(err);
        return c.json({ error: "Internal Server Errror" }, 500);
      }
    }
  )
  .delete("/novel/:id", zValidator("param", byIdParam("nvl_")), async (c) => {
    const { id } = c.req.valid("param");

    try {
      const novel = await deleteNovel(id);
      if (!novel) return c.json({ success: false, error: "Novel Not Found" }, 404);

      return c.json({ success: true, data: `Novel ${novel.id} Deleted.` });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .post("/chapter", zValidator("json", chapterPayloadDTO), async (c) => {
    const body = c.req.valid("json");

    try {
      const novel = await getNovel(body.novelId);
      if (!novel) return c.json({ success: false, error: "Novel Not Found" }, 404);

      const newChapter = await addChapter(body);

      if (newChapter) {
        await updateLastUpdatedForNovel(newChapter.novelId);
        await notifySubscribers(body);
      }

      return c.json({ success: true, data: newChapter });
    } catch (err) {
      if (err instanceof SQLiteError && err.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return c.json(
          { success: false, error: `Chapter ${body.chapterNum} of this Novel Already Exists` },
          400
        );
      }
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .put(
    "/chapter/:id",
    zValidator("param", byIdParam("ch_")),
    zValidator("json", chapterPayloadDTO),
    async (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      try {
        const updatedChapter = await updateChapter(body, id);
        if (!updatedChapter) return c.json({ success: false, error: "Chapter Not Found" }, 404);

        return c.json({ success: true, data: updatedChapter });
      } catch (err) {
        if (err instanceof SQLiteError && err.code === "SQLITE_CONSTRAINT_UNIQUE") {
          return c.json(
            { success: false, error: `Chapter ${body.chapterNum} of this Novel Already Exists` },
            400
          );
        }
        console.log(err);
        return c.json({ error: "Internal Server Errror" }, 500);
      }
    }
  )
  .delete("/chapter/:id", zValidator("param", byIdParam("ch_")), async (c) => {
    const { id } = c.req.valid("param");

    try {
      const chapter = await deleteChapter(id);
      if (!chapter) return c.json({ success: false, error: "Chapter Not Found" }, 404);

      return c.json({ success: true, data: `Chapter ${chapter.id} Deleted.` });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  });
export default adminRoutes;
