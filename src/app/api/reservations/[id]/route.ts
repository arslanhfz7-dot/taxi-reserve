import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// --- PATCH: update a reservation ---
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure ownership
  const owns = await prisma.reservation.findFirst({
    where: { id: params.id, user: { email } },
    select: { id: true },
  });
  if (!owns) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Read/validate JSON
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Whitelist fields (status removed)
  const allowed = [
    "pickupText",
    "dropoffText",
    "startAt",
    "endAt",
    "pax",
    "priceEuro",
    "phone",
    "flight",
    "driver",
    "notes",
  ];
  const data: any = {};
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, k)) data[k] = body[k];
  }

  // Coerce types / sanitize
  if ("startAt" in data) data.startAt = data.startAt ? new Date(data.startAt) : null;
  if ("endAt" in data) data.endAt = data.endAt ? new Date(data.endAt) : null;

  if ("pax" in data) {
    const n = Number(data.pax);
    data.pax = Number.isFinite(n) ? Math.max(1, Math.min(99, n)) : 1;
  }

  if ("priceEuro" in data) {
    const v = data.priceEuro;
    data.priceEuro = v === "" || v == null ? null : Number(v);
    if (Number.isNaN(data.priceEuro)) data.priceEuro = null;
  }

  if ("notes" in data) data.notes = (data.notes ?? "").toString().slice(0, 2000) || null;
  if ("pickupText" in data) data.pickupText = (data.pickupText ?? "").toString().slice(0, 500) || null;
  if ("dropoffText" in data) data.dropoffText = (data.dropoffText ?? "").toString().slice(0, 500) || null;
  if ("phone" in data) data.phone = (data.phone ?? "").toString().slice(0, 100) || null;
  if ("flight" in data) data.flight = (data.flight ?? "").toString().slice(0, 50) || null;
  if ("driver" in data) data.driver = (data.driver ?? "").toString().slice(0, 100) || null;

  await prisma.reservation.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({ ok: true });
}

// --- DELETE: unchanged ---
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.reservation.findFirst({
    where: { id: params.id, user: { email } },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.reservation.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
