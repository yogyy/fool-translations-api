import { expect } from "bun:test";

export const loginBody = {
  email: "test@dev.local",
  password: "herobrine100",
};

export function getCookieValue(name: string, cookieString: string) {
  const value = `; ${cookieString}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
}

export const newNovel = {
  title: "title example 200",
  synopsis: "lorem200",
  author: "yogyy",
  banner: "", // must be valid url or empty string
  cover: "", // must be valid url or empty string
  genres: ["Action", "Fantasy", "Mysteries"],
};

export const updateNovel = {
  ...newNovel,
  title: "title updated 200",
};

export const newChapter = {
  title: "chapter test",
  novelId: "nvl_ybttnrfvjibegksk", // add novel id from seeding
  chapterNum: 5,
  content: "chapter 0000000000",
};

export const ExpectedNovel = expect.objectContaining({
  id: expect.any(String),
  title: expect.any(String),
  author: expect.any(String),
  genres: expect.any(Array),
  synopsis: expect.any(String),
  cover: expect.any(String) || null,
  banner: expect.any(String) || null,
  totalViews: expect.any(Number),
  status: expect.any(String),
  published_at: expect.any(String),
  last_updated: expect.any(String),
});

// run seeding to get new cookie for testing
export const cookieTest = "";

export const registerBody = { ...loginBody, name: "tester" };
