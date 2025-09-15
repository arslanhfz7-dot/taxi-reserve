// src/app/api/reservations/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

/**
 * Return true if the input string has timezone info (Z or ±HH:MM at the end)
 */
function hasTZ(s: string) {
  return /[zZ]|[+-]\d{2}:\d{2}$/.test(s);
}

/**
 * Compute Europe/Madrid offset (minutes) with DST
 */
function madridOffsetMinutesLocal(
  y: number, m: number, d: number, hh: number, mm: number
) {
  function lastSunday(yy: number, month1to12: number) {
    const last = new Date(yy, month1to12, 0);
    const dow = last.getDay();
    return last.getDate() - dow;
  }
  const lastSunMarch = lastSunday(y, 3);
  const lastSunOct = lastSunday(y, 10);

  const cur = [m, d, hh, mm] as const;
  const dstStart = [3, lastSunMarch, 2, 0] as const;
  const dstEnd = [10, lastSunOct, 3, 0] as const;

  function ge(a: readonly number[], b: readonly number[]) {
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return a[i] > b[i];
    }
    return true;
  }
  function lt(a: readonly number[], b: readonly number[]) {
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return a[i] < b[i];
    }
    return false;
  }

  const inDST = ge(cur, dstStart) && lt(cur, dstEnd);
  return inDST ? 120 : 60;
}

/**
 * Convert a YYYY-MM-DDTHH:mm string (Madrid local) into UTC Date
 */
function barcelonaLocalToUtc(local: string) {
  const [date, time] = local.split("T");
  if (!date || !time) return new Date(local);

  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);

  const offsetMin = madridOffsetMinutesLocal(y, m, d, hh, mm);
  const offsetHours = Math.trunc(offsetMin / 60);

  const utcMs = Date.UTC(y, m - 1, d, hh - offsetHours, mm);
  return new Date(utcMs);
}

function parseStartAt(input: unknown): Date {
  const s = String(input ?? "");
  if (!s) throw new Error("startAt is required");

  if (hasTZ(s)) {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) throw new Error("Invalid startAt");
    return d;
  }
  const d = barcelonaLocalToUtc(s);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid startAt");
  return d;
}

// POST /api/reservations
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const {
    startAt,
    endAt,
    pickupText,
    dropoffText,
    pax,
    priceEuro,
    notes,
    phone,
    flight,
    status,
  } = body || {};

  // startAt → UTC
  let startAtUtc: Date;
  try {
    startAtUtc = parseStartAt(startAt);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Invalid startAt" }, { status: 400 });
  }

  const paxNum = Number(pax ?? 1);
  if (!Number.isFinite(paxNum) || paxNum < 1 || paxNum > 99) {
    return NextResponse.json({ error: "Invalid pax" }, { status: 400 });
  }

  const priceNum =
    typeof priceEuro === "number" ? priceEuro :
    priceEuro != null ? Number(priceEuro) : null;
  if (priceNum !== null && !Number.isFinite(priceNum)) {
    return NextResponse.json({ error: "Invalid priceEuro" }, { status: 400 });
  }

  // create reservation
  const created = await prisma.reservation.create({
    data: {
      userEmail: email,
      startAt: startAtUtc,
      endAt: endAt ? new Date(endAt) : null,
      pickupText: pickupText || null,
      dropoffText: dropoffText || null,
      pax: paxNum,
      priceEuro: priceNum,
      notes: (notes ?? "")?.toString().slice(0, 2000) || null,
      phone: phone || null,
      flight: flight || null,
      status: status ?? "PENDING",
    },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      pickupText: true,
      dropoffText: true,
      pax: true,
      priceEuro: true,
      notes: true,
      phone: true,
      flight: true,
      status: true,
    },
  });

  return NextResponse.json({ ok: true, reservation: created }, { status: 201 });
}
