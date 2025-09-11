import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

type Body = { ids: string[] };

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 400 });

  const { ids } = (await req.json().catch(() => ({}))) as Body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No ids provided" }, { status: 400 });
  }

  // Delete only reservations belonging to this user
  const result = await prisma.reservation.deleteMany({
    where: { id: { in: ids }, userId: user.id },
  });

  return NextResponse.json({ ok: true, deleted: result.count });
}
