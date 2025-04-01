import { describe, expect, test } from "vitest";
import { getCookieValue, loginBody, registerBody } from "./test-helper";
import { invalidateSession, SESSION_COOKIE_NAME } from "@/lib/auth";

const root = "http://127.0.0.1:8787/api/v1/auth";

describe("User Register", () => {
  test("sign-up with incorrect body", async () => {
    const res = await fetch(`${root}/signup`, {
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
    const res = await fetch(`${root}/signup`, {
      method: "POST",
      body: JSON.stringify(registerBody),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toBeDefined();

    const token = getCookieValue(SESSION_COOKIE_NAME, res.headers.get("set-cookie")!);
    expect(await res.json()).toEqual({ success: true, token: token });

    await fetch(`${root}/invalidate`, {
      headers: new Headers({ Cookie: `session=${token}` }),
    }).then(async (res) => expect(await res.json()).toEqual({ success: true }));
  });

  test("signup with existing email", async () => {
    const res = await fetch(`${root}/signup`, {
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
    const res = await fetch(`${root}/signin`, {
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
    const res = await fetch(`${root}/signin`, {
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
    const res = await fetch(`${root}/signout`, {
      method: "POST",
      headers: new Headers({}),
    });

    expect(res.status).toBe(401);
  });

  test("sign-out with cookie", async () => {
    console.log(cookieSession);
    const res = await fetch(`${root}/signout`, {
      method: "POST",
      headers: new Headers({ Cookie: cookieSession as string }),
    });

    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie");
    expect(cookie).toEqual(`${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`);
    expect(await res.json()).toStrictEqual({ success: true });
  });
});

describe("delete user testing", async () => {
  test("POST /delete-testing", async () => {
    const res = await fetch(`${root}/testing/delete-user`, {
      method: "POST",
      body: JSON.stringify(registerBody),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(await res.json()).toEqual({ success: true });
  });
});
