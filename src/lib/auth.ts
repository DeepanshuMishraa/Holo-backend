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
    const result = getCookie(c, key);
    return result;
  },
  async setSessionItem(key: string, value: unknown) {
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      path: "/",
      domain: process.env.COOKIE_DOMAIN || undefined
    };
    if (typeof value === "string") {
      setCookie(c, key, value, cookieOptions);
    } else {
      setCookie(c, key, JSON.stringify(value), cookieOptions);
    }
  },
  async removeSessionItem(key: string) {
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      path: "/",
      domain: process.env.COOKIE_DOMAIN || undefined
    };
    deleteCookie(c, key, cookieOptions);
  },
  async destroySession() {
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      path: "/",
      domain: process.env.COOKIE_DOMAIN || undefined
    };
    ["id_token", "access_token", "user", "refresh_token"].forEach((key) => {
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
