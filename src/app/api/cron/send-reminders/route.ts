// src/app/api/cron/send-reminders/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMailer } from "@/lib/mailer";

export const dynamic = "force-dynamic"; // cron should always run fresh

export async function GET() {
  // fetch a small batch to avoid long executions
  const now = new Date();

  // join the user to get the email we will send to
  const due = await prisma.reminder.findMany({
    where: { isDone: false, dueAt: { lte: now } },
    orderBy: { dueAt: "asc" },
    take: 25,
    include: {
      user: { select: { email: true, name: true } },
      reservation: {
        select: { startAt: true, pickupText: true, dropoffText: true, pax: true, phone: true, flight: true, priceEuro: true },
      },
    },
  });

  if (due.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const mailer = getMailer();
  let sent = 0;

  for (const r of due) {
    try {
      const to = r.user?.email;
      if (!to) continue;

      const resv = r.reservation;
      const start = resv?.startAt ? new Date(resv.startAt) : null;
      const when =
        start?.toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) ??
        "(unknown time)";

      const subject = "Reminder: reservation in ~30 minutes";
      const html = `
        <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica">
          <h2 style="margin:0 0 8px">Upcoming reservation</h2>
          <p style="margin:0 0 12px">Scheduled at <strong>${when}</strong></p>
          <ul style="margin:0 0 12px; padding-left:18px">
            <li><strong>Pickup</strong>: ${resv?.pickupText ?? "-"}</li>
            <li><strong>Drop-off</strong>: ${resv?.dropoffText ?? "-"}</li>
            <li><strong>Pax</strong>: ${resv?.pax ?? "-"}</li>
            ${resv?.phone ? `<li><strong>Phone</strong>: ${resv.phone}</li>` : ""}
            ${resv?.flight ? `<li><strong>Flight</strong>: ${resv.flight}</li>` : ""}
            ${typeof resv?.priceEuro === "number" ? `<li><strong>Price</strong>: ${resv.priceEuro}€</li>` : ""}
          </ul>
          ${r.note ? `<p style="margin:0 0 8px"><strong>Note:</strong> ${r.note}</p>` : ""}
        </div>
      `;

      await mailer.sendMail({
        to,
        from: process.env.MAIL_FROM!,
        subject,
        html,
      });

      await prisma.reminder.update({ where: { id: r.id }, data: { isDone: true } });
      sent++;
    } catch {
      // swallow to continue batch; you could log to a table
    }
  }

  return NextResponse.json({ ok: true, sent });
}
