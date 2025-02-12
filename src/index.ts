import { Hono } from "hono";
import { authRouter } from "./routes/user";
import { characterRouter } from "./routes/character";
import { chatRouter } from "./routes/chat";
import { cors } from "hono/cors";

export const runtime = 'edge'

const app = new Hono();

// Apply CORS before any routes
app.use("*", cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3001", // Restrict to frontend URL
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposeHeaders: ["Set-Cookie"],
  credentials: true,
  maxAge: 86400, // 24 hours
}));

// Apply routes after CORS
app.route("/api/auth", authRouter)
  .route("/api/character", characterRouter)
  .route("/api/chat", chatRouter);

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

