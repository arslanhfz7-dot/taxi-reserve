// src/app/api/reminders/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/reminders  -> list current user's reminders
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reminders = await prisma.reminder.findMany({
    where: { user: { email } }, // ✅ relation filter (schema-agnostic)
    orderBy: { dueAt: "asc" },
    select: {
      id: true,
      title: true,
      note: true,
      dueAt: true,
      isDone: true,
      reservationId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(
    reminders.map(r => ({ ...r, dueAt: r.dueAt.toISOString() }))
  );
}

// POST /api/reminders  -> create new reminder
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const { title, note, dueAt, reservationId, isDone } = body || {};

  if (!title || !String(title).trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) {
    return NextResponse.json({ error: "Invalid dueAt" }, { status: 400 });
  }

  const created = await prisma.reminder.create({
    data: {
      user: { connect: { email } }, // ✅ relation connect (schema-agnostic)
      title: String(title).trim(),
      note: note ? String(note) : null,
      dueAt: due,
      isDone: !!isDone,
      ...(reservationId ? { reservation: { connect: { id: String(reservationId) } } } : {}),
    },
    select: {
      id: true,
      title: true,
      note: true,
      dueAt: true,
      isDone: true,
      reservationId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(
    { ...created, dueAt: created.dueAt.toISOString() },
    { status: 201 }
  );
}
