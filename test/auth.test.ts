import app from "@/routes/root";
import { describe, expect, test } from "bun:test";
import { getCookieValue, loginBody, registerBody } from "./test-helper";
import { db } from "@/db";
import { userTable } from "@/db/schema/user";
import { eq } from "drizzle-orm";
import { invalidateSession, SESSION_COOKIE_NAME } from "@/lib/auth";

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

    expect(res.status).toBe(302); // redirected
    expect(res.headers.get("location")).toStrictEqual("/");
    expect(res.headers.get("set-cookie")).toBeDefined();

    // delete session from sign-up
    const sessionId = getCookieValue(res.headers.get("set-cookie")!, SESSION_COOKIE_NAME);
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

    expect(res.status).toBe(302); // redirected
    expect(res.headers.get("location")).toStrictEqual("/");
    expect(res.headers.get("set-cookie")).toStrictEqual(cookieSession);
  });

  test("sign-out with no cookie", async () => {
    const res = await app.request("/api/v1/auth/signout", {
      method: "POST",
      headers: new Headers({}),
    });

    expect(res.status).toBe(401);
  });

  test("sign-out with cookie", async () => {
    const res = await app.request("/api/v1/auth/signout", {
      method: "POST",
      headers: new Headers({ Cookie: cookieSession as string }),
    });

    expect(res.status).toBe(302); // redirected
    expect(res.headers.get("location")).toStrictEqual("/");
    const cookie = res.headers.get("set-cookie");
    expect(cookie).toEqual(`${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`);
  });

  test("delete registered user test", async () => {
    await db.delete(userTable).where(eq(userTable.email, registerBody.email));
  });
});
