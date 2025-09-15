// src/app/api/send-reminders/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminder } from "@/lib/mailer";

/**
 * GET /api/send-reminders?dryRun=1
 * Finds reservations starting in ~30 minutes and emails the signed-in user.
 * Runs fine when called by Vercel Cron too (no auth required).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";

  // window: [now+29m, now+31m]
  const now = new Date();
  const in29 = new Date(now.getTime() + 29 * 60 * 1000);
  const in31 = new Date(now.getTime() + 31 * 60 * 1000);

  // pull upcoming reservations in that window
  const upcoming = await prisma.reservation.findMany({
    where: { startAt: { gte: in29, lte: in31 } },
    select: {
      id: true,
      startAt: true,
      pickupText: true,
      dropoffText: true,
      pax: true,
      priceEuro: true,
      phone: true,
      flight: true,
      notes: true,
      status: true,
      user: { select: { email: true, name: true } },
    },
    take: 200,
  });

  // prepare payload
  const jobs = upcoming.map((r) => {
    const when = r.startAt.toLocaleString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    const html = `
      <div style="font-family:system-ui,Segoe UI,Roboto,Arial">
        <h2>⏰ Upcoming reservation (in ~30m)</h2>
        <p><b>When:</b> ${when}</p>
        ${r.pickupText ? `<p><b>Pickup:</b> ${r.pickupText}</p>` : ""}
        ${r.dropoffText ? `<p><b>Drop-off:</b> ${r.dropoffText}</p>` : ""}
        <p><b>Pax:</b> ${r.pax}</p>
        ${r.priceEuro != null ? `<p><b>Price:</b> ${r.priceEuro}€</p>` : ""}
        ${r.phone ? `<p><b>Phone:</b> ${r.phone}</p>` : ""}
        ${r.flight ? `<p><b>Flight:</b> ${r.flight}</p>` : ""}
        ${r.notes ? `<p><b>Notes:</b> ${r.notes}</p>` : ""}
        <p><b>Status:</b> ${r.status}</p>
        <p style="color:#888">#${r.id}</p>
      </div>
    `;

    return {
      to: r.user.email,
      subject: "⏰ Reminder: reservation in ~30 minutes",
      html,
    };
  });

  if (dryRun) {
    // Don’t send, just show what would be sent
    return NextResponse.json({ count: jobs.length, preview: jobs.slice(0, 5) });
  }

  // send emails
  let sent = 0;
  for (const j of jobs) {
    try {
      await sendReminder(j.to, j.subject, j.html);
      sent++;
    } catch (e) {
      console.error("sendReminder error:", e);
    }
  }

  return NextResponse.json({ found: jobs.length, sent });
}
