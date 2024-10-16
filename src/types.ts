import { Env } from "hono";
import type { Session, User } from "lucia";

export interface AuthContext extends Env {
  Variables: {
    user: User | null;
    session: Session | null;
  };
}
