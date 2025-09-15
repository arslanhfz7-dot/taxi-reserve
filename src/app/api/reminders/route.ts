export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.reminder.findMany({
    where: { userEmail: session.user.email },
    orderBy: [{ isDone: "asc" }, { dueAt: "asc" }],
    take: 500,
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, note, dueAt, reservationId } = body ?? {};
  if (!title || !dueAt) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const item = await prisma.reminder.create({
    data: {
      userEmail: session.user.email,
      title: String(title).slice(0, 120),
      note: note ? String(note).slice(0, 2000) : null,
      dueAt: new Date(dueAt),
      reservationId: reservationId ?? null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
