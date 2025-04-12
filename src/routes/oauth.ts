import { createSession, generateSessionToken } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { generateRandId } from "@/lib/utils";
import { createUser, getUserFromProviderId } from "@/services/auth.service";
import { AppContext, DiscordOAuthResponse, GoogleOAuthResponse } from "@/types";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";

const oauthRoutes = new Hono<AppContext>()
  .use(async (c, next) => {
    const providerAccessToken = getCookie(c, "access_token");
    if (!providerAccessToken) {
      return c.json({ error: "Invalid Request" }, 403);
    }
    await next();
  })
  .get("/discord", async (c) => {
    const providerAccessToken = getCookie(c, "access_token");

    try {
      const response = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${providerAccessToken}` },
      });
      const user: DiscordOAuthResponse = await response.json();

      const existingUser = await getUserFromProviderId(c.env, user.id);

      if (existingUser) {
        const token = generateSessionToken();
        const session = await createSession(c.env, token, existingUser.id);
        setSessionCookie(c, token, session.expiresAt);

        return c.json({ success: true });
      }

      const userId = generateRandId("usr");
      await createUser({
        env: c.env,
        email: user.email.toLowerCase(),
        id: userId,
        name: user.global_name || user.username,
        avatar: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
        provider: "discord",
        providerId: user.id,
      });

      const token = generateSessionToken();
      const session = await createSession(c.env, token, userId);
      setSessionCookie(c, token, session.expiresAt);

      return c.json({ success: true });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  })
  .get("/google", async (c) => {
    const providerAccessToken = getCookie(c, "access_token");

    try {
      const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${providerAccessToken}` },
      });
      const user: GoogleOAuthResponse = await response.json();

      const existingUser = await getUserFromProviderId(c.env, user.sub);
      if (existingUser) {
        const token = generateSessionToken();
        const session = await createSession(c.env, token, existingUser.id);
        setSessionCookie(c, token, session.expiresAt);

        return c.json({ success: true });
      }

      const userId = generateRandId("usr");
      await createUser({
        env: c.env,
        email: user.email.toLowerCase(),
        id: userId,
        name: user.name,
        avatar: user.picture,
        provider: "google",
        providerId: user.sub,
      });

      const token = generateSessionToken();
      const session = await createSession(c.env, token, userId);
      setSessionCookie(c, token, session.expiresAt);

      return c.json({ success: true });
    } catch (err) {
      console.log(err);
      return c.json({ error: "Internal Server Errror" }, 500);
    }
  });

export default oauthRoutes;
