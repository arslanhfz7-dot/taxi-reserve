export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: any = {};
  if (typeof body.title !== "undefined") data.title = String(body.title).slice(0, 120);
  if (typeof body.note !== "undefined") data.note = body.note ? String(body.note).slice(0, 2000) : null;
  if (typeof body.dueAt !== "undefined") data.dueAt = new Date(body.dueAt);
  if (typeof body.isDone !== "undefined") data.isDone = !!body.isDone;

  const item = await prisma.reminder.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(item);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.reminder.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
