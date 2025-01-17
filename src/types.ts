import { Env } from "hono";
import { Session, User } from "./db/schema/user";

export interface AuthContext extends Env {
  Variables: {
    user: Omit<User, "passwordHash"> | null;
    session: Session | null;
  };
}
