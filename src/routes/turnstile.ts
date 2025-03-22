import { Hono } from "hono";

export const turnstileRouter = new Hono();

turnstileRouter.post("/verify-turnstile", async (c) => {
  const { token } = await c.req.json();

  const formData = new FormData();
  formData.append('secret', process.env.TURNSTILE_SECRET_KEY as string);
  formData.append('response', token);

  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });

  const outcome = await result.json();

  if (outcome.success) {
    return c.json({ verified: true });
  } else {
    return c.json({ verified: false, errors: outcome["error-codes"] }, 400);
  }
}); 
