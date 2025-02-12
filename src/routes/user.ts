import { Hono } from "hono";
import { getUser, kindeClient, sessionManager } from "../lib/auth";
import { db } from "../lib/db";

export const authRouter = new Hono();

authRouter.get("/login", async (c) => {
  const loginUrl = await kindeClient.login(sessionManager(c));
  console.log('Login URL:', loginUrl.toString());
  return c.redirect(process.env.KINDE_POST_LOGIN_REDIRECT_URL!);
})


authRouter.get("/register", async (c) => {
  const registerUrl = await kindeClient.register(sessionManager(c));
  return c.redirect(registerUrl.toString());
})


authRouter.get("/callback", async (c) => {
  try {
    const url = new URL(c.req.url);
    await kindeClient.handleRedirectToApp(sessionManager(c), url);

    const isAuthenticated = await kindeClient.isAuthenticated(sessionManager(c));
    if (!isAuthenticated) {
      console.log("User not authenticated");
      return c.redirect("/api/auth/login");
    }

    const user = await kindeClient.getUserProfile(sessionManager(c));

    if (!user || !user.id) {
      console.error("Failed to get user profile");
      return c.redirect(process.env.KINDE_POST_LOGIN_REDIRECT_URL!);
    }

    const dbUser = await db.user.upsert({
      where: { kindeId: user.id },
      create: {
        kindeId: user.id,
        email: user.email || '',
        firstName: user.given_name || null,
        lastName: user.family_name || null,
        picture: user.picture || null,
      },
      update: {
        email: user.email || '',
        firstName: user.given_name || null,
        lastName: user.family_name || null,
        picture: user.picture || null,
      }
    });

    return c.redirect(process.env.KINDE_POST_LOGIN_REDIRECT_URL!);
  } catch (error) {
    return c.json({ error: "Failed to process authentication callback" }, 500);
  }
});


authRouter.get("/logout", async (c) => {
  const url = await kindeClient.logout(sessionManager(c));
  return c.redirect(url.toString());
});


authRouter.get("/me", async (c) => {
  try {
    console.log('GET /me - Checking session...');
    const manager = sessionManager(c);

    const isAuthenticated = await kindeClient.isAuthenticated(manager);
    console.log('Is authenticated:', isAuthenticated);

    if (!isAuthenticated) {
      console.log('User not authenticated');
      return c.json({ error: "Unauthorized" }, 401);
    }

    const user = await kindeClient.getUser(manager);
    console.log('User data:', user);

    if (!user || !user.id) {
      console.log('No user data found');
      return c.json({ error: "No user data found" }, 401);
    }

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { kindeId: user.id }
    });

    if (!dbUser) {
      console.log('User not found in database');
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({
      user: {
        id: dbUser.kindeId,
        email: dbUser.email,
        given_name: dbUser.firstName,
        family_name: dbUser.lastName,
        picture: dbUser.picture
      }
    });
  } catch (error) {
    console.error('Error in /me endpoint:', error);
    return c.json({ error: "Failed to get user data" }, 500);
  }
});

