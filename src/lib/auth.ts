import { Context } from "hono";
import { getCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
import { createDB } from "@/db";
import { sha256 } from "@oslojs/crypto/sha2";
import { Session, sessionTable, User, userTable } from "@/db/schema/user";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { AppContext } from "@/types";

export function generateSessionToken(long = 20): string {
  const bytes = new Uint8Array(long);
  crypto.getRandomValues(bytes);
  const token = encodeBase32LowerCaseNoPadding(bytes);
  return token;
}

const SESSION_REFRESH_INTERVAL_MS = 1000 * 60 * 60 * 24 * 15; // 15 days
const SESSION_MAX_DURATION_MS = SESSION_REFRESH_INTERVAL_MS * 2; // 30 days
export const SESSION_COOKIE_NAME = "session";

export async function createSession(
  env: AppContext["Bindings"],
  token: string,
  userId: string
): Promise<Session> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: Session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + SESSION_MAX_DURATION_MS),
  };
  await createDB(env).insert(sessionTable).values(session);
  return session;
}

export async function validateRequest(c: Context): Promise<SessionValidationResult> {
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
  if (!sessionToken) {
    return { session: null, user: null };
  }
  return validateSessionToken(c.env, sessionToken);
}

export async function validateSessionToken(
  env: AppContext["Bindings"],
  token: string
): Promise<SessionValidationResult> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const result = await createDB(env)
    .select({ user: userTable, session: sessionTable })
    .from(sessionTable)
    .innerJoin(userTable, eq(sessionTable.userId, userTable.id))
    .where(eq(sessionTable.id, sessionId));

  if (result.length < 1) {
    return { session: null, user: null };
  }

  const { user, session } = result[0];

  if (Date.now() >= session.expiresAt.getTime()) {
    await createDB(env).delete(sessionTable).where(eq(sessionTable.id, session.id));
    return { session: null, user: null };
  }

  if (Date.now() >= session.expiresAt.getTime() - SESSION_REFRESH_INTERVAL_MS) {
    session.expiresAt = new Date(Date.now() + SESSION_MAX_DURATION_MS);
    await createDB(env)
      .update(sessionTable)
      .set({ expiresAt: session.expiresAt })
      .where(eq(sessionTable.id, session.id));
  }

  delete (user as any).password;

  return { session, user };
}

export async function invalidateSession(
  env: AppContext["Bindings"],
  sessionId: string
): Promise<void> {
  // await fetch(
  //   `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.CLOUDFLARE_DATABASE_ID}/query`,
  //   {
  //     method: "POST",
  //     body: JSON.stringify({
  //       sql: "DELETE FROM session where id = ?",
  //       params: [`${sessionId}`],
  //     }),
  //   }
  // );
  const db = createDB(env);
  await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
}

export type SessionValidationResult =
  | { session: Session; user: Omit<User, "password"> }
  | { session: null; user: null };
