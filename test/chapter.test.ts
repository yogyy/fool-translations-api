import app from "@/routes/root";
import { describe, expect, it, test } from "bun:test";
import { cookieTest, newChapter } from "./test-helper";
import { db } from "@/db";
import { Chapter, chapterTable } from "@/db/schema/novel";
import { eq } from "drizzle-orm";

describe("/chapters", () => {
  let chapterTest: { success: boolean; data: Chapter };

  test("should success add new chapter", async () => {
    const res = await app.request("/api/v1/admin/chapter", {
      method: "POST",
      body: JSON.stringify(newChapter),
      headers: new Headers({
        "Content-Type": "application/json",
        Cookie: cookieTest,
      }),
    });

    chapterTest = await res.json();

    console.log(chapterTest);

    expect(res.status).toBe(200);
    expect(chapterTest).toEqual(
      expect.objectContaining({
        success: true,
        data: {
          id: expect.stringMatching(/ch_/),
          chapterNum: expect.any(Number),
          title: expect.any(String),
          createdAt: expect.any(String),
          content: expect.any(String),
          novelId: expect.stringMatching(/nvl_/),
        },
      })
    );
  });

  it("should return 400 if novelId is missing", async () => {
    const res = await app.request("/api/v1/chapters");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      success: false,
      error: {
        issues: [
          {
            code: "invalid_type",
            expected: "string",
            received: "undefined",
            path: ["novelId"],
            message: "Required",
          },
        ],
        name: "ZodError",
      },
    });
  });

  it("should return 404 if no novel's chapters are found", async () => {
    const res = await app.request("/api/v1/chapters?novelId=nvl_wrongnovelid0000");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      success: false,
      error: "Novel's Chapter Not Found",
    });
  });

  it("should return success when novel's chapters are found", async () => {
    const { novelId } = chapterTest.data;
    const res = await app.request(`/api/v1/chapters?novelId=${novelId}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      data: expect.arrayContaining([
        expect.objectContaining({
          id: expect.stringMatching(/ch_/),
          title: expect.any(String),
          novelId: expect.stringMatching(/nvl_/),
          createdAt: expect.any(String),
          chapterNum: expect.any(Number),
        }),
      ]),
    });
  });

  it("should return success when novel's chapters are found", async () => {
    const { id } = chapterTest.data;
    const res = await app.request(`/api/v1/chapters/${id}`);
    expect(res.status).toBe(200);
    const chapter = await res.json();

    expect(chapter).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          chapter: {
            id: expect.stringMatching(/ch_/),
            title: expect.any(String),
            content: expect.any(String),
            novelId: expect.stringMatching(/nvl_/),
            createdAt: expect.any(String),
            chapterNum: expect.any(Number),
          },
          novel: {
            id: expect.stringMatching(/nvl_/),
            title: expect.any(String),
            synopsis: expect.any(String),
            banner: null,
          },
          prev: expect.any(String),
          next: null,
        }),
      })
    );
  });

  test("should delete a chapter ", async () => {
    const { id } = chapterTest.data;
    const res = await app.request(`/api/v1/admin/chapter/${id}`, {
      method: "DELETE",
      headers: new Headers({
        Cookie: cookieTest,
      }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      expect.objectContaining({
        success: true,
        data: `Chapter ${id} Deleted.`,
      })
    );
  });
});
