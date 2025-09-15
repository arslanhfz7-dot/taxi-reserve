// src/lib/mailer.ts
import nodemailer from "nodemailer";

export function getMailer() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    EMAIL_FROM,
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) {
    throw new Error("Missing SMTP environment variables");
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true", // true if port 465
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
}

export async function sendReminder(to: string, subject: string, html: string) {
  const transporter = getMailer();
  const from = process.env.EMAIL_FROM!;
  await transporter.sendMail({ from, to, subject, html });
}
