import { z } from "zod";

export const userSigninDTO = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password needs to be at least 8 characters"),
});

export const userSignupDTO = userSigninDTO.extend({
  name: z
    .string()
    .min(4, "Name needs to be at least 4 characters")
    .regex(/^[a-zA-Z0-9]+$/, "name can only contain letters and numbers"),
});

const CustomID = (param: string, name = "ID") =>
  z
    .string()
    .min(10, { message: `${name} must be at least 10 characters long.` })
    .max(20, { message: `Invalid ${name}` })
    .startsWith(param, { message: `${name} must start with '${param}'.` });

export const novelPayloadDTO = z.object({
  author: z.string(),
  title: z.string(),
  synopsis: z.string(),
  genres: z.array(z.string()),
  cover: z.string().url().optional().or(z.literal("")),
  banner: z.string().url().optional().or(z.literal("")),
});

export const editNovelPayloadDTO = novelPayloadDTO.extend({
  status: z.enum(["ongoing", "completed"]).optional(),
});

export const chapterPayloadDTO = z.object({
  title: z.string(),
  novelId: CustomID("nvl_", "Novel ID"),
  chapterNum: z.number(),
  content: z.string(),
});

export const byIdParam = (param: string) => {
  return z.object({
    id: CustomID(param),
  });
};

export const AllNovelParams = z.object({
  status: z.enum(["ongoing", "completed", "all"]).default("all"),
  sort: z.enum(["popular", "recent", "views"]).default("popular"),
  genre: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).default(10),
});

export const RatingDTO = z.object({
  novelId: CustomID("nvl_", "Novel ID"),
  rating: z.number().min(1).max(10),
});

export const AllChapterParam = z.object({
  novelId: CustomID("nvl_", "novelid"),
});
