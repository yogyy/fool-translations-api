import { Session, User } from "./db/schema/user";

export interface AppContext extends Env {
  Bindings: {
    DB: D1Database;
    NODE_ENV: "development" | "production";
  };
  Variables: {
    user: Omit<User, "passwordHash"> | null;
    session: Session | null;
  };
}
