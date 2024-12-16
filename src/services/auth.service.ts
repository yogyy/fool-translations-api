import { db } from "@/db";
import { userTable } from "@/db/schema/user";
import { eq } from "drizzle-orm";

export async function createUser(email: string, id: string, name: string, hash: string) {
  await db.insert(userTable).values({ email, id, name, passwordHash: hash });
}

export async function findUserByEmail(email: string) {
  return await db.query.userTable.findFirst({ where: eq(userTable.email, email) });
}
