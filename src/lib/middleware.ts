import type { MiddlewareHandler } from "hono";
import { auth } from "./auth";

// Define the type for our auth middleware
export type AuthHonoEnv = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};

// Create the authentication middleware
export const authMiddleware: MiddlewareHandler<AuthHonoEnv> = async (c, next) => {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      c.set("user", null);
      c.set("session", null);
      return next();
    }

    c.set("user", session.user);
    c.set("session", session.session);
    return next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    c.set("user", null);
    c.set("session", null);
    return next();
  }
};

// Create a protected route middleware that requires authentication
export const requireAuth: MiddlewareHandler<AuthHonoEnv> = async (c, next) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  return next();
}; 
