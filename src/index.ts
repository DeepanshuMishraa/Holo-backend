import { Hono } from "hono";
import { authRouter } from "./routes/user";
import { characterRouter } from "./routes/character";
import { handle } from "hono/vercel";

export const runtime = 'edge'

const app = new Hono().basePath("/api").route("/auth", authRouter).route("/character", characterRouter);

app.get("/health", (c) => {
  return c.json({
    message: "OK"
  }, 200);
})


export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
export const OPTIONS = handle(app);
export const HEAD = handle(app);

export default app;

