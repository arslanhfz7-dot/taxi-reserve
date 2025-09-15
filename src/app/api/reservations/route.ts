// …imports + helpers unchanged…
function parseStartAt(value: any): Date {
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    throw new Error("Invalid startAt date");
  }
  return d;
}


import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const { startAt, pickupText, dropoffText, pax, priceEuro, phone, flight, notes, status } = body || {};

  let startAtUtc: Date;
  try { startAtUtc = parseStartAt(startAt); }
  catch (e: any) { return NextResponse.json({ error: e?.message || "Invalid startAt" }, { status: 400 }); }

  const paxNum = Number(pax ?? 1);
  if (!Number.isFinite(paxNum) || paxNum < 1 || paxNum > 99)
    return NextResponse.json({ error: "Invalid pax" }, { status: 400 });

  const priceNum = typeof priceEuro === "number" ? priceEuro : priceEuro != null ? Number(priceEuro) : null;
  if (priceNum !== null && !Number.isFinite(priceNum))
    return NextResponse.json({ error: "Invalid priceEuro" }, { status: 400 });

  const created = await prisma.reservation.create({
    data: {
      user: { connect: { email } }, // schema-agnostic
      startAt: startAtUtc,
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

  return NextResponse.json({ ok: true, reservation: created }, { status: 201 });
}
