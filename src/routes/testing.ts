import { createDB } from "@/db";
import { createSession, generateSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { generateRandId } from "@/lib/utils";
import { AppContext } from "@/types";
import { Hono } from "hono";
import * as novelShema from "@/db/schema/novel";
import { userTable } from "@/db/schema/user";
import { zValidator } from "@hono/zod-validator";
import { userSignupDTO } from "@/lib/dtos";
import { deleteUser } from "@/services/auth.service";

const testingRoutes = new Hono<AppContext>()
  .use(async (c, next) => {
    if (c.env?.NODE_ENV !== "development") {
      // Check your env variable
      return c.json({ error: "Route disabled in production", env: process.env.NODE_ENV }, 403);
    }
    await next();
  })
  .get("/seeding", async (c) => {
    const db = createDB(c.env);

    const [seedNovel] = await db
      .insert(novelShema.novelTable)
      .values({
        id: generateRandId("nvl"),
        title: "novel seeding",
        author: "yogyy",
        synopsis: "when i was, a young boy",
        genres: ["Fantasy", "Slice of Life"],
      })
      .returning();

    await db.insert(novelShema.chapterTable).values([
      {
        id: generateRandId("ch"),
        chapterNum: 1,
        content: "chapter 1 content",
        novelId: seedNovel.id,
        title: "chapter 1 title",
      },
      {
        id: generateRandId("ch"),
        chapterNum: 2,
        content: "chapter 2 content",
        novelId: seedNovel.id,
        title: "chapter 2 title",
      },
      {
        id: generateRandId("ch"),
        chapterNum: 3,
        content: "chapter 3 content",
        novelId: seedNovel.id,
        title: "chapter 3 title",
      },
      {
        id: generateRandId("ch"),
        chapterNum: 4,
        content: "chapter 4 content",
        novelId: seedNovel.id,
        title: "chapter 4 title",
      },
    ]);

    const [admin] = await db
      .insert(userTable)
      .values({
        email: "test@mail.id",
        id: "usr_testvcmxmonvpdp6",
        name: "tester",
        type: "admin",
        passwordHash: "password",
      })
      .returning();
    const token = generateSessionToken();
    await createSession(c.env, token, admin.id);

    return c.json({
      message: "seeding completed. use this data for testing",
      data: {
        novel_id: seedNovel.id,
        cookie: `${SESSION_COOKIE_NAME}=${token}`,
      },
    });
  })
  .post("/delete-user", zValidator("json", userSignupDTO.pick({ email: true })), async (c) => {
    const { email } = c.req.valid("json");

    await deleteUser(c.env, email);
    return c.json({ success: true });
  });

export default testingRoutes;
