export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Parse startAt safely:
 * - Handles <input type="datetime-local"> as local time (no UTC shift)
 * - Handles EU format "DD/MM/YYYY, HH:mm"
 * - Fallback to Date(...)
 */
function parseStartAt(input: unknown): Date {
  const raw = String(input ?? "").trim();
  if (!raw) throw new Error("startAt is required");

  // 1) datetime-local: "2025-09-15T23:30"
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
    const [datePart, timePart] = raw.split("T");
    const [y, m, d] = datePart.split("-").map(Number);
    const [H, M] = timePart.split(":").map(Number);
    return new Date(y, m - 1, d, H, M); // ✅ local time
  }

  // 2) EU format: "15/09/2025, 23:30"
  const eu = raw.replace(",", "");
  const m = eu.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (m) {
    const [, dd, mm, yyyy, hh, mi] = m;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(mi));
  }

  // 3) Fallback
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid startAt");
  return d;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({} as any));
    const { startAt, pickupText, dropoffText, pax, priceEuro, phone, flight, notes, status } = body || {};

    // Parse & validate startAt
    let startAtDate: Date;
    try {
      startAtDate = parseStartAt(startAt);
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || "Invalid startAt" }, { status: 400 });
    }

    const paxNum = Number(pax ?? 1);
    if (!Number.isFinite(paxNum) || paxNum < 1 || paxNum > 99) {
      return NextResponse.json({ error: "Invalid pax" }, { status: 400 });
    }

    const rawPrice = priceEuro;
    const priceNum =
      rawPrice === "" || rawPrice === null || rawPrice === undefined ? null : Number(rawPrice);
    if (priceNum !== null && !Number.isFinite(priceNum)) {
      return NextResponse.json({ error: "Invalid priceEuro" }, { status: 400 });
    }

    // Auto-reminder T-30min
    const dueAt = new Date(startAtDate.getTime() - 30 * 60 * 1000);

    const created = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.create({
        data: {
          user: { connect: { email } },
          startAt: startAtDate,
          pickupText: pickupText || null,
          dropoffText: dropoffText || null,
          pax: paxNum,
          priceEuro: priceNum,
          phone: phone || null,
          flight: flight || null,
          notes: (notes ?? "")?.toString().slice(0, 2000) || null,
          status: status ?? "PENDING",
        },
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
        },
      });

      await tx.reminder.create({
        data: {
          user: { connect: { email } },
          reservation: { connect: { id: reservation.id } },
          title: "Upcoming reservation",
          note: `Pickup: ${pickupText ?? "-"} → Drop-off: ${dropoffText ?? "-"}`,
          dueAt,
          isDone: false,
        },
      });

      return reservation;
    });

    return NextResponse.json({ ok: true, reservation: created }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/reservations error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
