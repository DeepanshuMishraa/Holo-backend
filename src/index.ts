import { Hono } from "hono";
import { characterRouter } from "./routes/character";
import { chatRouter } from "./routes/chat";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";
import { logger } from "hono/logger";
import { authMiddleware } from "./lib/middleware";

export const runtime = 'edge'

const app = new Hono();

app.use("*", logger())

// Apply CORS before any routes
app.use(
  "/api/auth/*",
  cors({
    origin: (origin) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL || "http://localhost:3001",
      ];
      return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    },
    allowMethods: ["POST", "GET", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposeHeaders: ["Content-Length"],
    credentials: true,
    maxAge: 600,
  })
);

app.use("*", authMiddleware);

// Mount the auth handler with the correct pattern
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api/character", characterRouter).route("/api/chat", chatRouter);

let lastPingTime = Date.now();

async function keepAlive() {
  try {
    const response = await fetch(process.env.RENDER_EXTERNAL_URL + '/api/ping');
    if (response.status === 204) {
      lastPingTime = Date.now();
      console.log('Server kept alive at:', new Date(lastPingTime).toISOString());
    }
  } catch (error) {
    console.error('Keep-alive ping failed:', error);
  }
}

// Start the keep-alive mechanism if we're in production and have the URL
if (process.env.RENDER_EXTERNAL_URL) {
  // Ping every 10 minutes
  setInterval(keepAlive, 10 * 60 * 1000);
  keepAlive();
}

app.get("/api/health", (c) => {
  return c.json({
    message: "OK",
    lastPing: new Date(lastPingTime).toISOString()
  }, 200);
})

app.get("/api/ping", (c) => {
  return new Response("", { status: 204 });
})

export default app;

