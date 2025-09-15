import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure the reservation belongs to the signed-in user (schema uses relation via email)
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
