import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import type { CookieOptions } from 'better-auth';

const prisma = new PrismaClient();
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    }
  }, advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.NODE_ENV === "production"
        ? ".holo-ai-one.vercel.app"
        : "localhost"
    },
  },
  trustedOrigins: [
    "https://holo-ai-one.vercel.app",
    "https://your-backend.vercel.app",
    "http://localhost:3001",
    "http://localhost:3000"
  ]
});
