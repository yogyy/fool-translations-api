import { Env } from "hono";
import { Session, User } from "./db/schema/user";

export interface AuthContext extends Env {
  Variables: {
    user: User | null;
    session: Session | null;
  };
}
