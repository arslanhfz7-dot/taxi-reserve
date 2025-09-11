// src/app/api/reservations/route.ts

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route"; // ✅ correct path

// POST /api/reservations
// Create a new reservation
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    startAt,
    pickupText,
    dropoffText,
    pax,
    priceEuro,
    notes,
    status,
  } = body ?? {};

  // Validate startAt
  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "Invalid startAt" }, { status: 400 });
  }

  // Validate pax
  const paxNum = Number(pax ?? 1);
  if (!Number.isFinite(paxNum) || paxNum < 1 || paxNum > 99) {
    return NextResponse.json({ error: "Invalid pax" }, { status: 400 });
  }

  // Validate price
  const priceNum =
    typeof priceEuro === "number"
      ? priceEuro
      : priceEuro
      ? Number(priceEuro)
      : null;
  if (priceNum !== null && !Number.isFinite(priceNum)) {
    return NextResponse.json({ error: "Invalid priceEuro" }, { status: 400 });
  }

  // Get user ID
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Create reservation
  const created = await prisma.reservation.create({
    data: {
      userId: user.id,
      startAt: start,
      pickupText: pickupText ?? null,
      dropoffText: dropoffText ?? null,
      pax: paxNum,
      priceEuro: priceNum,
      notes: (notes ?? "")?.toString().slice(0, 2000) || null,
      status: status ?? "PENDING", // default if not passed
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
