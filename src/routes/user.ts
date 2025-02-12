import { Hono } from "hono";
import { getUser, kindeClient, sessionManager } from "../lib/auth";
import { db } from "../lib/db";

export const authRouter = new Hono();

authRouter.get("/login", async (c) => {
  const loginUrl = await kindeClient.login(sessionManager(c));
  console.log('Login URL:', loginUrl.toString());
  return c.redirect(loginUrl.toString());
})


authRouter.get("/register", async (c) => {
  const registerUrl = await kindeClient.register(sessionManager(c));
  return c.redirect(registerUrl.toString());
})


authRouter.get("/callback", async (c) => {
  try {
    if (!c.req.url) {
      console.error('No URL in request');
      return c.json({ error: "Invalid callback request" }, 400);
    }

    console.log('Processing callback with URL:', c.req.url);
    let url: URL;

    try {
      url = new URL(c.req.url);
      // Log query parameters for debugging
      console.log('Callback query parameters:',
        Object.fromEntries(url.searchParams.entries())
      );
    } catch (urlError) {
      console.error('Invalid URL:', urlError);
      return c.json({ error: "Invalid callback URL" }, 400);
    }

    const manager = sessionManager(c);

    try {
      await kindeClient.handleRedirectToApp(manager, url);
    } catch (handleRedirectError) {
      console.error('Error handling redirect:', handleRedirectError);
      return c.json({
        error: "Failed to process authentication callback",
        details: handleRedirectError instanceof Error ? handleRedirectError.message : 'Unknown error'
      }, 500);
    }

    let isAuthenticated;
    try {
      isAuthenticated = await kindeClient.isAuthenticated(manager);
      console.log('Authentication status:', isAuthenticated);
    } catch (authError) {
      console.error('Error checking authentication:', authError);
      return c.json({
        error: "Failed to verify authentication",
        details: authError instanceof Error ? authError.message : 'Unknown error'
      }, 500);
    }

    if (!isAuthenticated) {
      console.log("User not authenticated after redirect");
      return c.json({ error: "Authentication failed" }, 401);
    }

    let user;
    try {
      user = await kindeClient.getUserProfile(manager);
      console.log('Retrieved user profile:', user);
    } catch (profileError) {
      console.error('Error getting user profile:', profileError);
      return c.json({
        error: "Failed to get user profile",
        details: profileError instanceof Error ? profileError.message : 'Unknown error'
      }, 500);
    }

    if (!user || !user.id) {
      console.error("Failed to get user profile or missing ID");
      return c.json({ error: "Invalid user profile" }, 400);
    }

    try {
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
      console.log('User upserted to database:', dbUser);
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Log the error but continue with redirect
    }

    // If everything is successful, redirect to the post-login URL
    return c.redirect(process.env.KINDE_POST_LOGIN_REDIRECT_URL!);
  } catch (error) {
    console.error('Unhandled callback error:', error);
    // Log the full error details
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return c.json({
      error: "Failed to process authentication callback",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
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

