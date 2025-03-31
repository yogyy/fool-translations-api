import { Env } from "hono";
import { Session, User } from "./db/schema/user";

export interface AppContext extends Env {
  Variables: {
    user: Omit<User, "passwordHash"> | null;
    session: Session | null;
  };
}
