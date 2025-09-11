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
 * Compute Europe/Madrid (Spain mainland) offset *in minutes* for a given
 * LOCAL date-time (y,m,d,hh,mm). Handles DST:
 *  - Standard time: UTC+1 (60 minutes)
 *  - Summer time:   UTC+2 (120 minutes)
 *
 * DST local rules:
 *  - starts at 02:00 local on the last Sunday of March
 *  - ends   at 03:00 local on the last Sunday of October
 */
function madridOffsetMinutesLocal(
  y: number, m: number, d: number, hh: number, mm: number
) {
  // helper: last Sunday (date number) of a given month (1-12)
  function lastSunday(yy: number, month1to12: number) {
    const last = new Date(yy, month1to12, 0); // local time, last day of month
    const dow = last.getDay(); // 0=Sun
    return last.getDate() - dow; // date number of last Sunday
  }

  const lastSunMarch = lastSunday(y, 3);   // March
  const lastSunOct   = lastSunday(y, 10);  // October

  // Build comparable "tuples" for local comparisons
  const cur = [m, d, hh, mm] as const;

  // DST start threshold: March last Sunday 02:00 local
  const dstStart = [3, lastSunMarch, 2, 0] as const;
  // DST end threshold: October last Sunday 03:00 local
  const dstEnd   = [10, lastSunOct, 3, 0] as const;

  // compare [m,d,hh,mm] lexicographically
  function ge(a: readonly number[], b: readonly number[]) {
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return a[i] > b[i];
    }
    return true; // equal
  }
  function lt(a: readonly number[], b: readonly number[]) {
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return a[i] < b[i];
    }
    return false; // equal is not less
  }

  const inDST = ge(cur, dstStart) && lt(cur, dstEnd);
  return inDST ? 120 : 60; // minutes
}

/**
 * Convert a "YYYY-MM-DDTHH:mm" (no timezone) which is intended to be
 * Europe/Madrid local time into a UTC Date.
 */
function barcelonaLocalToUtc(local: string) {
  const [date, time] = local.split("T");
  if (!date || !time) return new Date(local); // let JS try

  const [y, m, d] = date.split("-").map((n) => Number(n));
  // support "HH:mm" or "HH:mm:ss"
  const parts = time.split(":").map((n) => Number(n));
  const hh = parts[0] ?? 0;
  const mm = parts[1] ?? 0;

  const offsetMin = madridOffsetMinutesLocal(y, m, d, hh, mm);
  const offsetHours = Math.trunc(offsetMin / 60);

  // Local Madrid time (y-m-d hh:mm) corresponds to UTC (hh - offset)
  const utcMs = Date.UTC(y, (m - 1), d, hh - offsetHours, mm);
  return new Date(utcMs);
}

/**
 * Robust parser:
 * - If the string already has timezone info → use Date(s) as absolute.
 * - Else treat it as Europe/Madrid local and convert to UTC.
 */
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

// POST /api/reservations  (create)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const {
    startAt,
    pickupText,
    dropoffText,
    pax,
    priceEuro,
    notes,
    status,
  } = body || {};

  // startAt → UTC Date
  let startAtUtc: Date;
  try {
    startAtUtc = parseStartAt(startAt);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Invalid startAt" }, { status: 400 });
  }

  // pax
  const paxNum = Number(pax ?? 1);
  if (!Number.isFinite(paxNum) || paxNum < 1 || paxNum > 99) {
    return NextResponse.json({ error: "Invalid pax" }, { status: 400 });
  }

  // price
  const priceNum =
    typeof priceEuro === "number" ? priceEuro :
    priceEuro != null ? Number(priceEuro) : null;
  if (priceNum !== null && !Number.isFinite(priceNum)) {
    return NextResponse.json({ error: "Invalid priceEuro" }, { status: 400 });
  }

  // user id
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // create
  const created = await prisma.reservation.create({
    data: {
      userId: user.id,
      startAt: startAtUtc,                // ✅ correct UTC instant
      pickupText: pickupText ?? null,
      dropoffText: dropoffText ?? null,
      pax: paxNum,
      priceEuro: priceNum,
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
      notes: true,
      status: true,
    },
  });

  return NextResponse.json({ ok: true, reservation: created }, { status: 201 });
}
