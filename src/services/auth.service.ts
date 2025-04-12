import { createDB } from "@/db";
import { userTable } from "@/db/schema/user";
import { AppContext } from "@/types";
import { and, eq } from "drizzle-orm";

type Provider = "credentials" | "google" | "discord";

interface User {
  env: AppContext["Bindings"];
  email: string;
  id: string;
  name: string;
  password?: string;
  avatar?: string;
  provider: Provider;
  providerId?: string;
}

export async function createUser({
  env,
  email,
  id,
  name,
  password = "",
  avatar,
  provider,
  providerId,
}: User) {
  await createDB(env)
    .insert(userTable)
    .values({ email, id, name, password, provider, avatar, providerId });
}

export async function findUserByEmail(
  env: AppContext["Bindings"],
  email: string,
  provider: Provider
) {
  return await createDB(env).query.userTable.findFirst({
    where: and(eq(userTable.email, email.toLowerCase()), eq(userTable.provider, provider)),
  });
}

export async function getUserFromProviderId(env: AppContext["Bindings"], id: string) {
  return await createDB(env).query.userTable.findFirst({
    where: eq(userTable.providerId, id),
  });
}

export async function deleteUser(env: AppContext["Bindings"], email: string) {
  await createDB(env).delete(userTable).where(eq(userTable.email, email));
}
