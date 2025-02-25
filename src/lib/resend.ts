import { Resend } from "resend"
import { EmailTemplate } from "./email-template"
import type { ReactElement } from "react"
import { db } from "./db"

export const sendEmail = async (email: string) => {
  if (!email || typeof email !== 'string') {
    throw new Error("Invalid email address")
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM as string,
    to: email,
    subject: "Welcome to the holo.ai waitlist",
    react: EmailTemplate({ email }) as ReactElement
  })

  if (error) {
    console.error(error)
    throw new Error("Failed to send email")
  }


  return data
}


