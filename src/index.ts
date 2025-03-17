import { Hono } from "hono";
import { characterRouter } from "./routes/character";
import { chatRouter } from "./routes/chat";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authMiddleware, type AuthHonoEnv } from "./lib/middleware";
import { sendEmail } from "./lib/resend";
import { createAuth } from "./lib/auth";

const app = new Hono<AuthHonoEnv>();

app.use("*", logger())

app.use(
  "*",
  cors({
    origin: ["https://holo-ai-one.vercel.app", "https://holo.deepanshumishra.me", "http://localhost:3001"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposeHeaders: ["Set-Cookie", "Content-Length"],
    credentials: true,
    maxAge: 600,
  })
);

// Create auth instance with environment first
app.use("*", (c, next) => {
  const auth = createAuth(c.env);
  c.set('auth', auth);
  return next();
});

// Then use the auth middleware
app.use("*", authMiddleware);

app.on(["POST", "GET"], "/api/auth/*", async (c) => {
  const auth = c.get('auth');
  return auth.handler(c.req.raw);
});

app.route("/api/character", characterRouter).route("/api/chat", chatRouter);

let lastPingTime = Date.now();

app.get("/api/health", (c) => {
  return c.json({
    message: "OK",
    lastPing: new Date(lastPingTime).toISOString()
  }, 200);
});

app.get("/api/ping", (c) => {
  lastPingTime = Date.now();
  return new Response("", { status: 204 });
});

app.post("/api/send-email", async (c) => {
  const body = await c.req.json()
  if (!body.email) {
    return c.json({ error: "Email is required" }, 400)
  }
  await sendEmail(body.email)
  return c.json({ message: "Email sent" }, 200)
});

export default app;
