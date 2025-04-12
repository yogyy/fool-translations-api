import { Hono } from "hono";
import { AppContext } from "@/types";
import { generateRandId } from "@/lib/utils";
import { zValidator } from "@hono/zod-validator";
import { userSigninDTO, userSignupDTO } from "@/lib/dtos";
import { createUser, findUserByEmail } from "@/services/auth.service";
import { deleteSessionTokenCookie, setSessionCookie } from "@/lib/session";
import { createSession, generateSessionToken, invalidateSession } from "@/lib/auth";

const authRoutes = new Hono<AppContext>()
  .get("/validate", async (c) => {
    const user = c.get("user");
    const session = c.get("session");

    return c.json({ user, session });
  })
  .get("/invalidate", async (c) => {
    const session = c.get("session");
    if (!session) return c.newResponse("Unauthorized", 401);

    await invalidateSession(c.env, session.id);

    return c.json({ success: true });
  })
  .post("/signup", zValidator("json", userSignupDTO), async (c) => {
    const { email, name, password } = c.req.valid("json");

    const userId = generateRandId("usr");
    try {
      await createUser({ env: c.env, email, id: userId, name, password, provider: "credentials" });

      const token = generateSessionToken();
      const session = await createSession(c.env, token, userId);
      setSessionCookie(c, token, session.expiresAt);

      return c.json({ success: true, token });
    } catch (err: any) {
      if (err.message.includes("emailUniqueIndex")) {
        return c.json({ success: false, error: "Email Already Used" }, 400);
      }
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .post("/signin", zValidator("json", userSigninDTO), async (c) => {
    const { email, password } = c.req.valid("json");

    try {
      const user = await findUserByEmail(c.env, email, "credentials");
      if (!user) {
        return c.json({ success: false, error: "Invalid Email or Password." }, 401);
      }

      const passwordMatch = password === user.password;
      if (!passwordMatch) {
        return c.json({ success: false, error: "Invalid Email or Password." }, 401);
      }

      const token = generateSessionToken();
      const session = await createSession(c.env, token, user?.id);
      setSessionCookie(c, token, session.expiresAt);

      return c.json({ success: true, token });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .post("/signout", async (c) => {
    const session = c.get("session");
    if (!session) return c.newResponse("Unauthorized", 401);

    await invalidateSession(c.env, session.id);
    deleteSessionTokenCookie(c);

    return c.json({ success: true });
  });

export default authRoutes;
