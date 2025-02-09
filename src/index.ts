import { Hono } from "hono";
import { authRouter } from "./routes/user";

const app = new Hono().basePath("/api").route("/auth", authRouter);

app.get("/health", (c) => {
  return c.json({
    message: "OK"
  }, 200);
})


export default app;
