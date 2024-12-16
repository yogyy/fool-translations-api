import { Hono } from "hono";
import { AuthContext } from "@/types";
import { SQLiteError } from "bun:sqlite";
import { generateRandId } from "@/lib/utils";
import { zValidator } from "@hono/zod-validator";
import { userSigninDTO, userSignupDTO } from "@/lib/dtos";
import { createUser, findUserByEmail } from "@/services/auth.service";
import { deleteSessionTokenCookie, setSessionCookie } from "@/lib/session";
import { createSession, generateSessionToken, invalidateSession } from "@/lib/auth";

const authRoutes = new Hono<AuthContext>()
  .get("/validate", async (c) => {
    const user = c.get("user");
    const session = c.get("session");

    return c.json({ user, session });
  })
  .post("/signup", zValidator("json", userSignupDTO), async (c) => {
    const { email, name, password } = c.req.valid("json");
    const hash = await Bun.password.hash(password);

    const userId = generateRandId("usr");
    try {
      await createUser(email, userId, name, hash);

      const token = generateSessionToken();
      const session = await createSession(token, userId);
      setSessionCookie(c, token, session.expiresAt);

      return c.json({ success: true, token });
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
      const user = await findUserByEmail(email);
      if (!user) {
        return c.json({ success: false, error: "Invalid Username or Password." }, 401);
      }

      const passwordMatch = Bun.password.verify(password, user.passwordHash);
      if (!passwordMatch) {
        return c.json({ success: false, error: "Invalid Username or Password." }, 401);
      }

      const token = generateSessionToken();
      const session = await createSession(token, user?.id);
      setSessionCookie(c, token, session.expiresAt);

      return c.json({ success: true, token });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .post("/signout", async (c) => {
    const session = c.get("session");
    if (!session) return c.newResponse("", 401);

    await invalidateSession(session.id);
    deleteSessionTokenCookie(c);

    return c.json({ success: true });
  });

export default authRoutes;
