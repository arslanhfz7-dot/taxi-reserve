export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ResStatus } from "@prisma/client"; // <- Prisma enum (names may differ in your schema)

/* ------------------------------------------------------------------ */
/* Time parsing – bulletproof                                          */
/* ------------------------------------------------------------------ */
/**
 * Prefer epoch milliseconds from the client (`startAtMs`).
 * Otherwise, accept:
 *   - <input type="datetime-local"> => "YYYY-MM-DDTHH:mm"  (treated as LOCAL time)
 *   - "DD/MM/YYYY, HH:mm" (comma optional)                 (treated as LOCAL time)
 *   - Any other string that Date can parse (Z/offset ok)
 */
function parseStartAtFromBody(body: any): Date {
  // 1) Preferred: exact epoch milliseconds from the browser
  if (typeof body?.startAtMs === "number" && Number.isFinite(body.startAtMs)) {
    const d = new Date(body.startAtMs);
    if (!Number.isFinite(d.getTime())) throw new Error("Invalid startAtMs");
    return d;
  }

  const raw = String(body?.startAt ?? "").trim();
  if (!raw) throw new Error("startAt is required");

  // 2) datetime-local: "YYYY-MM-DDTHH:mm" (construct **local** Date explicitly)
  const m1 = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (m1) {
    const [, y, mo, d, H, M] = m1.map(Number);
    return new Date(y, mo - 1, d, H, M, 0); // LOCAL time; no UTC shift
  }

  // 3) EU format: "DD/MM/YYYY, HH:mm" (comma optional) -> LOCAL
  const eu = raw.replace(",", "");
  const m2 = eu.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (m2) {
    const [, dd, mm, yyyy, hh, mi] = m2.map(Number);
    return new Date(yyyy, mm - 1, dd, hh, mi, 0); // LOCAL
  }

  // 4) Fallback – allow ISO with Z/offset, etc.
  const d = new Date(raw);
  if (!Number.isFinite(d.getTime())) throw new Error("Invalid startAt");
  return d;
}

/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({} as any));
    const {
      pickupText,
      dropoffText,
      pax,
      priceEuro,
      phone,
      flight,
      notes,
      status, // may be string like "PENDING" | "ASSIGNED" | ...
    } = body || {};

    // Parse start time (LOCAL safe)
    let startAtDate: Date;
    try {
      startAtDate = parseStartAtFromBody(body);
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || "Invalid startAt" }, { status: 400 });
    }

    // Validate pax
    const paxNum = Number(pax ?? 1);
    if (!Number.isFinite(paxNum) || paxNum < 1 || paxNum > 99) {
      return NextResponse.json({ error: "Invalid pax" }, { status: 400 });
    }

    // Validate/normalize price
    const priceNum =
      priceEuro === "" || priceEuro == null ? null : Number(priceEuro);
    if (priceNum !== null && !Number.isFinite(priceNum)) {
      return NextResponse.json({ error: "Invalid priceEuro" }, { status: 400 });
    }

    // Status: coerce to Prisma enum (defaults to PENDING)
    const statusEnum: ResStatus = (Object.values(ResStatus) as string[]).includes(
      String(status)
    )
      ? (status as ResStatus)
      : ResStatus.PENDING;

    // Auto-reminder at T-30 minutes
    const dueAt = new Date(startAtDate.getTime() - 30 * 60 * 1000);

    const created = await prisma.$transaction(async (tx) => {
      // Create reservation
      const reservation = await tx.reservation.create({
        data: {
          userEmail: email,                  // uses userEmail field
          startAt: startAtDate,              // store the exact instant
          pickupText: pickupText || null,
          dropoffText: dropoffText || null,
          pax: paxNum,
          priceEuro: priceNum,
          phone: phone || null,
          flight: flight || null,
          notes: (notes ?? "")?.toString().slice(0, 2000) || null,
          status: statusEnum,                // Prisma enum, not a bare string
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
          userEmail: true,
        },
      });

      // Create reminder (adjust to your schema if different)
      await tx.reminder.create({
        data: {
          userEmail: email,
          reservationId: reservation.id,
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
