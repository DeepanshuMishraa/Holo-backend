import { createKindeServerClient, GrantType, type SessionManager, type UserType } from "@kinde-oss/kinde-typescript-sdk";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";


export const kindeClient = createKindeServerClient(GrantType.AUTHORIZATION_CODE, {
  authDomain: process.env.KINDE_DOMAIN!,
  clientId: process.env.KINDE_CLIENT_ID!,
  clientSecret: process.env.KINDE_CLIENT_SECRET!,
  redirectURL: process.env.KINDE_CALLBACK_URL!,
  logoutRedirectURL: process.env.KINDE_LOGOUT_REDIRECT_URL!
});


export const kindeApiClient = createKindeServerClient(GrantType.CLIENT_CREDENTIALS, {
  authDomain: process.env.KINDE_DOMAIN!,
  clientId: process.env.KINDE_CLIENT_ID!,
  clientSecret: process.env.KINDE_CLIENT_SECRET!,
  logoutRedirectURL: process.env.KINDE_LOGOUT_REDIRECT_URL!
});


let store: Record<string, unknown> = {};

export const sessionManager = (c: Context): SessionManager => ({
  async getSessionItem(key: string) {
    console.log('Getting session item:', key);
    const result = getCookie(c, key);
    console.log('Session item value:', result);
    return result;
  },
  async setSessionItem(key: string, value: unknown) {
    console.log('Setting session item:', key);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? "none" as const : "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    };

    if (typeof value === "string") {
      console.log('Setting cookie:', key, value);
      setCookie(c, key, value, cookieOptions);
    } else {
      console.log('Setting stringified cookie:', key, JSON.stringify(value));
      setCookie(c, key, JSON.stringify(value), cookieOptions);
    }
  },
  async removeSessionItem(key: string) {
    console.log('Removing session item:', key);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? "none" as const : "lax" as const,
      path: "/"
    };
    deleteCookie(c, key, cookieOptions);
  },
  async destroySession() {
    console.log('Destroying session');
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? "none" as const : "lax" as const,
      path: "/"
    };
    const sessionKeys = ["id_token", "access_token", "user", "refresh_token", "oauth_state"];
    sessionKeys.forEach((key) => {
      console.log('Deleting cookie:', key);
      deleteCookie(c, key, cookieOptions);
    });
  },
});


type Env = {
  Variables: {
    user: UserType
  }
}

export const getUser = createMiddleware<Env>(async (c, next) => {
  try {
    const manager = sessionManager(c);
    console.log('Checking authentication...');

    const isAuthenticated = await kindeClient.isAuthenticated(manager);
    console.log('Is authenticated:', isAuthenticated);

    if (!isAuthenticated) {
      console.log('User not authenticated');
      return c.json({ error: "Unauthorized" }, 401);
    }

    const user = await kindeClient.getUser(manager);
    console.log('User found:', user);

    if (!user || !user.id) {
      console.log('No user data found');
      return c.json({ error: "No user data found" }, 401);
    }

    c.set("user", user);
    await next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return c.json({ error: "Authentication failed" }, 500);
  }
});
