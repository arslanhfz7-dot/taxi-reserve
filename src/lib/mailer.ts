import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST!,                 // e.g. smtp.mailtrap.io / smtp.elasticemail.com / smtp.gmail.com
  port: Number(process.env.EMAIL_SERVER_PORT || 587),   // 2525/587 (STARTTLS) or 465 (SSL)
  secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
  auth: {
    user: process.env.EMAIL_SERVER_USER!,
    pass: process.env.EMAIL_SERVER_PASSWORD!,
  },
});

export async function sendReminder(to: string, subject: string, html: string) {
  return mailer.sendMail({
    from: process.env.EMAIL_FROM!,  // "Taxi Reserve <no-reply@yourdomain.com>"
    to,
    subject,
    html,
  });
}
