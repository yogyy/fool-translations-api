import { generateRandId } from "@/lib/utils";
import { db } from ".";
import * as novelShema from "./schema/novel";
import { userTable } from "./schema/user";
import { createSession, generateSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

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

const hash = await Bun.password.hash("password");

const [userTest] = await db
  .insert(userTable)
  .values({
    email: "test@mail.id",
    id: "usr_testvcmxmonvpdp6",
    name: "tester",
    type: "admin",
    passwordHash: hash,
  })
  .returning();
const token = generateSessionToken();
const session = await createSession(token, userTest.id);
console.log("use this for testing");
console.log(
  `${SESSION_COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Expires=${session.expiresAt.toUTCString()}; Path=/`
);

console.log(`Seeding complete.`);
