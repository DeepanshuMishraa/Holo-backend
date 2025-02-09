import { Hono } from "hono";
import { authRouter } from "./routes/user";
import { characterRouter } from "./routes/character";

const app = new Hono().basePath("/api").route("/auth", authRouter).route("/character",characterRouter);

app.get("/health", (c) => {
  return c.json({
    message: "OK"
  }, 200);
})


export default app;
