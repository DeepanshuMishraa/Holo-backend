import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

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
  },
  secret: process.env.BETTER_AUTH_SECRET as string,
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
    crossSubDomainCookies: {
      enabled: true,

    }
  },
  trustedOrigins: [
    "https://holo-ai-one.vercel.app",
    "https://chat-backend-vve1.onrender.com",
    "http://localhost:3001",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://holo.deepanshumishra.xyz",
    "https://api-holo.deepanshumishra.xyz"
  ]
});
