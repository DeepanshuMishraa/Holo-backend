import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import type { Env } from "../types/env";

const prisma = new PrismaClient();

export const createAuth = (env: Env) => betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET
    }
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.NODE_ENV === "production"
    ? "https://holo-backend.d4deepanshu723.workers.dev"
    : "http://localhost:3000",
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
    // crossSubDomainCookies: {
    //   enabled: true,
    // }
  },
  trustedOrigins: [
    "https://holo-ai-one.vercel.app",
    "https://chat-backend-vve1.onrender.com",
    "http://localhost:3001",
    "http://localhost:3000",
    "https://holo.deepanshumishra.me",
    "https://api-holo.deepanshumishra.me"
  ]
});
