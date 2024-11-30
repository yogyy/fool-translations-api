import app from "@/routes/root";
import { describe, expect, test } from "bun:test";
import { getCookieValue, loginBody, registerBody } from "./test-helper";
import { db } from "@/db";
import { userTable } from "@/db/schema/user";
import { eq } from "drizzle-orm";
import { invalidateSession, SESSION_COOKIE_NAME } from "@/lib/auth";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";

describe("User Register", () => {
  test("sign-up with incorrect body", async () => {
    const res = await app.request("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          issues: expect.any(Array),
        }),
      })
    );
  });

  test("signup with correct body", async () => {
    const res = await app.request("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify(registerBody),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toBeDefined();

    const token = getCookieValue(SESSION_COOKIE_NAME, res.headers.get("set-cookie")!);
    expect(await res.json()).toEqual({ success: true, token: token });

    // delete session from sign-up
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token!)));
    console.log("session id", sessionId);
    await invalidateSession(sessionId!);
  });

  test("signup with existing email", async () => {
    const res = await app.request("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify(registerBody),
      headers: new Headers({ "Content-Type": "application/json" }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toStrictEqual({
      success: false,
      error: "Email Already Used",
    });
  });
});

describe("User Signin & Signout", () => {
  let cookieSession: string | null;

  test("sign-in with incorrect body", async () => {
    const res = await app.request("/api/v1/auth/signin", {
      method: "POST",
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          issues: expect.any(Array),
        }),
      })
    );
  });

  test("sign-in with correct body", async () => {
    const res = await app.request("/api/v1/auth/signin", {
      method: "POST",
      body: JSON.stringify(loginBody),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    cookieSession = res.headers.get("set-cookie");

    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toStrictEqual(cookieSession);

    const token = getCookieValue(SESSION_COOKIE_NAME, cookieSession!);
    expect(await res.json()).toEqual({ success: true, token: token });
  });

  test("sign-out with no cookie", async () => {
    const res = await app.request("/api/v1/auth/signout", {
      method: "POST",
      headers: new Headers({}),
    });

    expect(res.status).toBe(401);
  });

  test("sign-out with cookie", async () => {
    console.log(cookieSession);
    const res = await app.request("/api/v1/auth/signout", {
      method: "POST",
      headers: new Headers({ Cookie: cookieSession as string }),
    });

    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie");
    expect(cookie).toEqual(`${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`);
    expect(await res.json()).toStrictEqual({ success: true });
  });
});

test("delete user testing", async () => {
  await db.delete(userTable).where(eq(userTable.email, registerBody.email));
});
