import { AppContext } from "@/types";
import { Hono } from "hono";
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
import { UNIQUE_CONSTRAINT } from "@/lib/utils";

const adminRoutes = new Hono<AppContext>()
  .use(isAdmin)
  .post("/novel", zValidator("json", novelPayloadDTO), async (c) => {
    const body = c.req.valid("json");

    try {
      const newNovel = await addNewNovel(c.env, body);
      return c.json({ success: true, data: newNovel });
    } catch (err: any) {
      if (err.message.includes(UNIQUE_CONSTRAINT)) {
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
        const updatedNovel = await updateNovel(c.env, body, id);
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
      const novel = await deleteNovel(c.env, id);
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
      const novel = await getNovel(c.env, body.novelId);
      if (!novel) return c.json({ success: false, error: "Novel Not Found" }, 404);

      const newChapter = await addChapter(c.env, body);

      if (newChapter) {
        await updateLastUpdatedForNovel(c.env, newChapter.novelId);
        await notifySubscribers(c.env, body);
      }

      return c.json({ success: true, data: newChapter });
    } catch (err: any) {
      if (err.message.includes(UNIQUE_CONSTRAINT)) {
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
    zValidator("json", chapterPayloadDTO.omit({ novelId: true })),
    async (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      try {
        const updatedChapter = await updateChapter(c.env, body, id);
        if (!updatedChapter) return c.json({ success: false, error: "Chapter Not Found" }, 404);

        return c.json({ success: true, data: updatedChapter });
      } catch (err: any) {
        if (err.message.includes(UNIQUE_CONSTRAINT)) {
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
      const chapter = await deleteChapter(c.env, id);
      if (!chapter) return c.json({ success: false, error: "Chapter Not Found" }, 404);

      return c.json({ success: true, data: `Chapter ${chapter.id} Deleted.` });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  });
export default adminRoutes;
