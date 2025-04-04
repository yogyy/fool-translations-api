import { encodeBase32LowerCaseNoPadding } from "@oslojs/encoding";

export const generateRandId = (prefix = "", length = 10) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  const rand = encodeBase32LowerCaseNoPadding(bytes);

  return prefix ? `${prefix}_${rand}` : rand;
};

export const FOREIGN_KEY_CONSTRAINT = "FOREIGN KEY constraint failed";
export const UNIQUE_CONSTRAINT = "UNIQUE constraint failed:";
