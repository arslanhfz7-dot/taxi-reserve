import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminder } from "@/lib/mailer";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (key !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  console.log("CRON triggered at:", now.toISOString());

  const due = await prisma.reservation.findMany({
    where: {
      reminderAt: { lte: now },
      status: "CONFIRMED",
    },
    orderBy: { startAt: "asc" },
  });

  console.log("DUE RESERVATIONS:", due.length);
  if (due[0]) {
    console.log("First due row:", {
      id: due[0].id,
      reminderAt: due[0].reminderAt?.toISOString(),
      status: due[0].status,
    });
  }

  let sent = 0;
  for (const r of due) {
    try {
      const to = process.env.TEST_REMINDER_TO || "you@example.com";
      const when = new Date(r.startAt).toLocaleString();
      const html = `
        <h3>Upcoming taxi reservation</h3>
        <p><b>${when}</b></p>
        <p>${r.pax} pax — ${r.pickupText} → ${r.dropoffText}</p>
        ${r.notes ? `<p><i>${r.notes}</i></p>` : ""}
      `;
      await sendReminder(to, "Reminder: upcoming reservation", html);
      await prisma.reservation.update({
        where: { id: r.id },
        data: { reminderAt: null },
      });
      sent++;
    } catch (e) {
      console.error("Email send failed", r.id, e);
    }
  }

  return NextResponse.json({ ok: true, sent });
}
