import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { SQLiteError } from "bun:sqlite";
import { db } from "@/db";
import { AuthContext } from "@/types";
import { lucia } from "@/lib/lucia-auth";
import { userTable } from "@/db/schema/user";
import { generateRandId } from "@/lib/utils";
import { zValidator } from "@hono/zod-validator";
import { userSigninDTO, userSignupDTO } from "@/lib/dtos";

const authRoutes = new Hono<AuthContext>()
  .post("/signup", zValidator("json", userSignupDTO), async (c) => {
    const { email, name, password } = c.req.valid("json");
    const hash = await Bun.password.hash(password);

    const userId = generateRandId("usr");
    try {
      await db.insert(userTable).values({ email, id: userId, name, passwordHash: hash });

      const session = await lucia.createSession(userId, {});
      c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize(), { append: true });

      return c.redirect("/");
    } catch (err) {
      if (err instanceof SQLiteError && err.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return c.json({ success: false, error: "Email Already Used" }, 400);
      }
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .post("/signin", zValidator("json", userSigninDTO), async (c) => {
    const { email, password } = c.req.valid("json");

    try {
      const user = await db.query.userTable.findFirst({
        where: eq(userTable.email, email),
      });
      if (!user) {
        return c.json({ success: false, error: "Invalid Username or Password." }, 401);
      }

      const passwordMatch = Bun.password.verify(password, user.passwordHash);
      if (!passwordMatch) {
        return c.json({ success: false, error: "Invalid Username or Password." }, 401);
      }

      const session = await lucia.createSession(user?.id, {});
      c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize(), { append: true });
      c.header("Location", "/", { append: true });

      return c.redirect("/");
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .post("/signout", async (c) => {
    const session = c.get("session");
    if (!session) {
      return c.body(null, 401);
    }

    await lucia.invalidateSession(session.id);
    c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize());
    return c.redirect("/");
  });

export default authRoutes;
