import { describe, expect, test } from "vitest";
import { cookieTest, ExpectedNovel, localURL, newNovel, updateNovel } from "./test-helper";
import { Novel } from "@/db/schema/novel";

interface ReturnType<T> {
  success: boolean;
  data: Array<T>;
}

describe("routes get many novels", () => {
  test("test get all novel", async () => {
    const res = await fetch(`${localURL}/novels`);
    const data: ReturnType<any> = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test("test get featured/hot", async () => {
    const res = await fetch(`${localURL}/novels/featured/hot`);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.arrayContaining([]),
      })
    );
  });

  test("test get featured/top", async () => {
    const res = await fetch(`${localURL}/novels/featured/top`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.arrayContaining([]),
      })
    );
  });
});

describe("novel by id", () => {
  let novelTest: { success: boolean; data: Novel };

  test("add new novel", async () => {
    const res = await fetch(`${localURL}/admin/novel`, {
      method: "POST",
      body: JSON.stringify(newNovel),
      headers: new Headers({
        "Content-Type": "application/json",
        Cookie: cookieTest,
      }),
    });

    novelTest = await res.json();

    expect(res.status).toBe(200);
    expect(novelTest).toEqual(
      expect.objectContaining({
        success: true,
        data: ExpectedNovel,
      })
    );
  });

  test("get novel by id", async () => {
    const novelId = novelTest.data.id;
    const res = await fetch(`${localURL}/novels/${novelId}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      expect.objectContaining({
        success: true,
        data: ExpectedNovel,
      })
    );
  });

  test("update novel by id", async () => {
    const novelId = novelTest.data.id;
    const res = await fetch(`${localURL}/admin/novel/${novelId}`, {
      method: "PUT",
      body: JSON.stringify(updateNovel),
      headers: new Headers({
        "Content-Type": "application/json",
        Cookie: cookieTest,
      }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      expect.objectContaining({
        success: true,
        data: ExpectedNovel,
      })
    );
  });

  test("delete novel by id", async () => {
    const novelId = novelTest.data.id;
    const res = await fetch(`${localURL}/admin/novel/${novelId}`, {
      method: "DELETE",
      headers: new Headers({
        Cookie: cookieTest,
      }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      expect.objectContaining({
        success: true,
        data: `Novel ${novelId} Deleted.`,
      })
    );
  });
});
