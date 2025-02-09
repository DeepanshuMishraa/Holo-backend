import { Hono } from "hono";
import { getUser, kindeClient, sessionManager } from "../lib/auth";



export const authRouter = new Hono();



authRouter.get("/login", async (c) => {
  const loginUrl = await kindeClient.login(sessionManager(c));
  console.log('Login URL:', loginUrl.toString());
  return c.redirect(loginUrl.toString());
})


authRouter.get("/register", async (c) => {
  const registerUrl = await kindeClient.register(sessionManager(c));
  return c.redirect(registerUrl.toString());
})


authRouter.get("/callback", async (c) => {
  try {
    const url = new URL(c.req.url);
    await kindeClient.handleRedirectToApp(sessionManager(c), url);
    return c.redirect("/");
  } catch (error) {
    console.error('Authentication error:', error);
    return c.redirect('/api/auth/login');
  }
})


authRouter.get("/logout", async (c) => {
  const url = await kindeClient.logout(sessionManager(c));
  return c.redirect(url.toString());
});


authRouter.get("/me", getUser, async (c) => {
  const user = c.var.user;
  return c.json({ user });
})

