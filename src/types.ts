import { Session, User } from "./db/schema/user";

export interface AppContext extends Env {
  Bindings: {
    NODE_ENV: "development" | "production";
  };
  Variables: {
    user: Omit<User, "passwordHash"> | null;
    session: Session | null;
  };
}
