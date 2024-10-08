import { generateIdFromEntropySize } from "lucia";

export const generateRandId = (prefix = "", length = 10) => {
  const str = generateIdFromEntropySize(length);
  return prefix ? `${prefix}_${str}` : str;
};
