import { expect } from "vitest";

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
  novelId: "nvl_x3pzgwcjld3236cz", // add novel id from seeding
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

export const localURL = "http://127.0.0.1:8787/api/v1";

// run seeding to get new cookie for testing
// or make sure add session of a admin user
export const cookieTest = "session=zq4opx5wgqtxcyzvcbi7hyy7yewkz4gk";

export const registerBody = { ...loginBody, name: "tester" };
