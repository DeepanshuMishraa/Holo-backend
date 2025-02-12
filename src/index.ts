import { Hono } from "hono";
import { authRouter } from "./routes/user";
import { characterRouter } from "./routes/character";
import { handle } from "hono/vercel";

export const runtime = 'edge'

const app = new Hono().basePath("/api").route("/auth", authRouter).route("/character", characterRouter);

// Keep track of the last ping time
let lastPingTime = Date.now();

// Function to ping the server
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

app.get("/health", (c) => {
  return c.json({
    message: "OK",
    lastPing: new Date(lastPingTime).toISOString()
  }, 200);
})

app.get("/ping", (c) => {
  return new Response("", { status: 204 });
})

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
export const OPTIONS = handle(app);
export const HEAD = handle(app);

export default app;

