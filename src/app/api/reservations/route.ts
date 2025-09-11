import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
// @ts-ignore – typings can be finicky in some setups
import { zonedTimeToUtc } from "date-fns-tz";

function parseStartAt(input: unknown) {
  const s = String(input ?? "");
  if (!s) throw new Error("startAt is required");

  // If the string already has timezone info (Z or ±HH:MM), treat it as absolute.
  const hasTZ = /[zZ]|[+-]\d{2}:\d{2}$/.test(s);
  return hasTZ ? new Date(s) : zonedTimeToUtc(s, "Europe/Madrid");
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const { startAt, pickupText, dropoffText, pax, priceEuro, notes, status } = body || {};

  let startAtUtc: Date;
  try {
    startAtUtc = parseStartAt(startAt);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Invalid startAt" }, { status: 400 });
  }
  if (Number.isNaN(startAtUtc.getTime())) {
    return NextResponse.json({ error: "Invalid startAt" }, { status: 400 });
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

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const created = await prisma.reservation.create({
    data: {
      userId: user.id,
      startAt: startAtUtc,                 // ✅ always a correct UTC instant
      pickupText: pickupText ?? null,
      dropoffText: dropoffText ?? null,
      pax: paxNum,
      priceEuro: priceNum,
      notes: (notes ?? "")?.toString().slice(0, 2000) || null,
      status: status ?? "PENDING",
    },
    select: {
      id: true, startAt: true, pickupText: true, dropoffText: true,
      pax: true, priceEuro: true, notes: true, status: true,
    },
  });

  return NextResponse.json({ ok: true, reservation: created }, { status: 201 });
}
