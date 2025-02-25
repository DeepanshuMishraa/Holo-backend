import { Hono } from "hono";
import { characterRouter } from "./routes/character";
import { chatRouter } from "./routes/chat";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";
import { logger } from "hono/logger";
import { authMiddleware } from "./lib/middleware";
import { sendEmail } from "./lib/resend";

const app = new Hono();

app.use("*", logger())

app.use(
  "*",
  cors({
    origin: process.env.NODE_ENV === "production"
      ? ["https://holo-ai-one.vercel.app", "https://holo.deepanshumishra.me"]
      : "http://localhost:3001",
    allowMethods: ["POST", "GET", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposeHeaders: ["Set-Cookie", "Content-Length"],
    credentials: true,
    maxAge: 600,
  })
);

// //debug 
// app.get("/api/debug-cookie", (c) => {
//   const cookie = c.req.header("Cookie")
//   console.log("Received Cookie Header:", cookie)
//   return c.json({ cookie })
// });

app.use("*", authMiddleware);

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

app.post("/api/send-email", async (c) => {
  const body = await c.req.json()
  if (!body.email) {
    return c.json({ error: "Email is required" }, 400)
  }
  await sendEmail(body.email)
  return c.json({ message: "Email sent" }, 200)
})

export default app;
