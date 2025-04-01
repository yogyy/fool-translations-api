import { generateRandId } from "@/lib/utils";
import { expect, test } from "vitest";

test("should generate random string with 16 length", () => {
  const id = generateRandId();
  expect(id).toBeTypeOf("string");
  expect(id).toHaveLength(16);
});

test("should generate random string start with", () => {
  const novelId = generateRandId("nvl");
  expect(novelId.startsWith("nvl_")).toBe(true);
  expect(novelId).toHaveLength(20);

  const chapterId = generateRandId("ch");
  expect(chapterId.startsWith("ch_")).toBe(true);
  expect(chapterId).toHaveLength(19);

  const userId = generateRandId("usr");
  expect(userId.startsWith("usr_")).toBe(true);
  expect(userId).toHaveLength(20);
});
