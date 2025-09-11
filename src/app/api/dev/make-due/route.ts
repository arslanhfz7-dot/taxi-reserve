import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const latest = await prisma.reservation.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (!latest) {
    return NextResponse.json({ ok: false, error: "no reservations" }, { status: 404 });
  }

  const updated = await prisma.reservation.update({
    where: { id: latest.id },
    data: {
      status: "CONFIRMED",
      reminderAt: new Date(Date.now() - 60 * 1000), // 1 min in the past (already due)
    },
  });

  return NextResponse.json({ ok: true, id: updated.id, reminderAt: updated.reminderAt });
}
