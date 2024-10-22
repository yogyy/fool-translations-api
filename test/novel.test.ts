import app from "@/routes/root";
import { describe, expect, test } from "bun:test";
import { cookieTest, ExpectedNovel, newNovel, updateNovel } from "./test-helper";
import { Novel } from "@/db/schema/novel";

describe("routes get many novels", () => {
  test("test get all novel", async () => {
    const res = await app.request("/api/v1/novels");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          genres: expect.any(Array),
          cover: expect.any(String),
          totalRatings: expect.any(Number),
          averageRating: expect.any(String),
          popularityScore: expect.any(Number),
        }),
      ])
    );
  });

  test("test get featured/hot", async () => {
    const res = await app.request("/api/v1/novels/featured/hot");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            image: expect.any(String),
            createdAt: expect.any(String),
            novelId: expect.any(String),
          }),
        ]),
      })
    );
  });

  test("test get featured/top", async () => {
    const res = await app.request("/api/v1/novels/featured/top");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            title: expect.any(String),
            cover: expect.any(String),
          }),
        ]),
      })
    );
  });
});

describe("novel by id", () => {
  let novelTest: { success: boolean; data: Novel };

  test("add new novel", async () => {
    const res = await app.request("/api/v1/admin/novel", {
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
    const res = await app.request(`/api/v1/novels/${novelId}`);
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
    const res = await app.request(`/api/v1/admin/novel/${novelId}`, {
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
    const res = await app.request(`/api/v1/admin/novel/${novelId}`, {
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
