// src/app/api/reservations/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ResStatus } from "@prisma/client"; // <-- your Prisma enum

/** Parse LOCAL time from datetime-local or EU string. No offset hacks. */
function parseStartAt(input: unknown): Date {
  const raw = String(input ?? "").trim();
  if (!raw) throw new Error("startAt is required");

  // 1) 2025-09-15T23:30 (datetime-local)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) {
    const d = new Date(raw); // local
    if (Number.isNaN(d.getTime())) throw new Error("Invalid startAt");
    return d;
  }

  // 2) 15/09/2025, 23:30 (comma optional)
  const eu = raw.replace(",", "");
  const m = eu.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (m) {
    const [, dd, mm, yyyy, hh, mi] = m;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(mi)); // local
    if (Number.isNaN(d.getTime())) throw new Error("Invalid startAt");
    return d;
  }

  // 3) Fallback
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid startAt");
  return d;
}

/** Normalize UI labels / strings to Prisma enum ResStatus */
function normalizeStatus(input: unknown): ResStatus {
  if (!input) return ResStatus.PENDING;
  const s = String(input).trim();

  // Accept DB codes
  switch (s) {
    case "PENDING": return ResStatus.PENDING;
    case "ASSIGNED": return ResStatus.ASSIGNED;
    case "COMPLETED": return ResStatus.COMPLETED;
    case "R_RECEIVED": return ResStatus.R_RECEIVED;
  }

  // Accept pretty labels
  const label = s.toLowerCase();
  if (label === "pending") return ResStatus.PENDING;
  if (label === "assigned") return ResStatus.ASSIGNED;
  if (label === "completed") return ResStatus.COMPLETED;
  if (label === "r received" || label === "r_received" || label === "rreceived")
    return ResStatus.R_RECEIVED;

  return ResStatus.PENDING;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({} as any));
    const {
      startAt,
      pickupText,
      dropoffText,
      pax,
      priceEuro,
      phone,     // keep
      flight,    // keep
      notes,
      status,
    } = body || {};

    // LOCAL parse; no timezone math
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

    const priceNum =
      priceEuro === "" || priceEuro == null ? null : Number(priceEuro);
    if (priceNum !== null && !Number.isFinite(priceNum)) {
      return NextResponse.json({ error: "Invalid priceEuro" }, { status: 400 });
    }

    const phoneClean =
      phone == null ? null : String(phone).trim().slice(0, 32) || null;
    const flightClean =
      flight == null ? null : String(flight).trim().slice(0, 32) || null;

    const statusEnum = normalizeStatus(status);

    // Auto-reminder at T-30 minutes
    const dueAt = new Date(startAtDate.getTime() - 30 * 60 * 1000);

    const created = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.create({
        data: {
          userEmail: email,        // consistent with actions/page
          startAt: startAtDate,    // store as-is
          pickupText: pickupText || null,
          dropoffText: dropoffText || null,
          pax: paxNum,
          priceEuro: priceNum,
          phone: phoneClean,
          flight: flightClean,
          notes: (notes ?? "")?.toString().slice(0, 2000) || null,
          status: statusEnum,      // <-- Prisma enum, TS-safe
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

      // Adjust to your Reminder schema if different
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
