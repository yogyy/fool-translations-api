import { createDB } from "@/db";
import { userTable } from "@/db/schema/user";
import { AppContext } from "@/types";
import { eq } from "drizzle-orm";

export async function createUser(
  env: AppContext["Bindings"],
  email: string,
  id: string,
  name: string,
  password: string
) {
  await createDB(env).insert(userTable).values({ email, id, name, passwordHash: password });
}

export async function findUserByEmail(env: AppContext["Bindings"], email: string) {
  return await createDB(env).query.userTable.findFirst({
    where: eq(userTable.email, email.toLowerCase()),
  });
}

export async function deleteUser(env: AppContext["Bindings"], email: string) {
  await createDB(env).delete(userTable).where(eq(userTable.email, email));
}
