// src/lib/mailer.ts
import nodemailer from "nodemailer";

export function getMailer() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    !process.env.EMAIL_FROM
  ) {
    throw new Error("Missing SMTP environment variables");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true", // true if port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendReminder(to: string, subject: string, html: string) {
  const transporter = getMailer();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM, // e.g. '"Taxi Reserve" <no-reply@yourdomain.com>'
    to,
    subject,
    html,
  });
}
