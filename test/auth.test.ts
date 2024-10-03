import app from "@/routes/root";
import { describe, expect, it, test } from "bun:test";
import { Hono } from "hono";
import { testClient } from "hono/testing";
import { loginBody, registerBody } from "./test-helper";
import { db } from "@/db";
import { userTable } from "@/db/schema";
import { eq } from "drizzle-orm";

describe("Example", () => {
  test("GET / without header Cookie", async () => {
    const res = await app.request("/api/v1");
    expect(res.status).toBe(401);
    expect(res.body).toBe(null);
  });
});

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

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toStrictEqual("/");
    expect(res.headers.get("set-cookie")).toBeDefined();
  });

  test("signup with existing email", async () => {
    const res = await app.request("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify(registerBody),
      headers: new Headers({ "Content-Type": "application/json" }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toStrictEqual({
      error: "Email already used",
    });
  });
});

describe("User Signin", () => {
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

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toStrictEqual("/");
    expect(res.headers.get("set-cookie")).toBeDefined();
  });
});

test("delete registed user test", async () => {
  await db.delete(userTable).where(eq(userTable.email, registerBody.email));
});
