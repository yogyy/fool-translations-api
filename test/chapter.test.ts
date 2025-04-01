import { describe, expect, it, test } from "vitest";
import { cookieTest, localURL, newChapter } from "./test-helper";
import { Chapter } from "@/db/schema/novel";

describe("chapters test", () => {
  let chapterTest: { success: boolean; data: Chapter };

  test("POST /admin/chapter, should success add new chapter", async () => {
    const res = await fetch(`${localURL}/admin/chapter`, {
      method: "POST",
      body: JSON.stringify(newChapter),
      headers: new Headers({ "Content-Type": "application/json", Cookie: cookieTest }),
    });

    chapterTest = await res.json();
    expect(res.status).toBe(200);
    expect(chapterTest).toEqual({
      success: true,
      data: {
        id: expect.stringMatching(/ch_/),
        chapterNum: expect.any(Number),
        title: expect.any(String),
        createdAt: expect.any(String),
        content: expect.any(String),
        novelId: expect.stringMatching(/nvl_/),
      },
    });
  });

  it("GET /chapters?novelId, should return 400 if novelId is missing", async () => {
    const res = await fetch(`${localURL}/chapters`);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data).toEqual({
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

  it("GET /chapters?novelId, should return 404 if no novel's chapter are found", async () => {
    const res = await fetch(`${localURL}/chapters?novelId=nvl_wrongnovelid0000`);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data).toEqual({ success: false, error: "Novel Not Found" });
  });

  it("GET /chapters?novelId, should return 200 when novel's chapters are found", async () => {
    const { novelId } = chapterTest.data;
    const res = await fetch(`${localURL}/chapters?novelId=${novelId}`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      data: expect.arrayContaining([
        {
          id: expect.stringMatching(/ch_/),
          title: expect.any(String),
          createdAt: expect.any(String),
          chapterNum: expect.any(Number),
        },
      ]),
    });
  });

  it("GET /chapters/:id, should return success when novel's chapters are found", async () => {
    const { id } = chapterTest.data;
    const res = await fetch(`${localURL}/chapters/${id}`);
    expect(res.status).toBe(200);
    const chapter = await res.json();

    expect(chapter).toEqual(
      expect.objectContaining({
        success: true,
        data: {
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
        },
      })
    );
  });

  test("DELETE /admin/chapter/:id, should delete a chapter ", async () => {
    const { id } = chapterTest.data;
    const res = await fetch(`${localURL}/admin/chapter/${id}`, {
      method: "DELETE",
      headers: new Headers({ Cookie: cookieTest }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      expect.objectContaining({ success: true, data: `Chapter ${id} Deleted.` })
    );
  });
});
