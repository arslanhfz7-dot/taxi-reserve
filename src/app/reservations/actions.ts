"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Helper: get current user
async function getUserIdBySession() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}

// Update a reservation (driver, notes, pax, status)
export async function updateReservationField(
  id: string,
  patch: { notes?: string | null; pax?: number; driver?: string | null; status?: string }
) {
  const userId = await getUserIdBySession();
  if (!userId) throw new Error("Unauthorized");

  const owned = await prisma.reservation.findFirst({ where: { id, userId }, select: { id: true } });
  if (!owned) throw new Error("Not found");

  const data: Record<string, unknown> = {};

  if ("notes" in patch) {
    data.notes = (patch.notes ?? "").toString().slice(0, 2000) || null;
  }

  if ("pax" in patch) {
    const n = Number(patch.pax);
    if (!Number.isFinite(n) || n < 1 || n > 99) throw new Error("Invalid pax");
    data.pax = n;
  }

  if ("driver" in patch) {
    const v = (patch.driver ?? "").toString().trim();
    if (v.length > 100) throw new Error("Driver too long");
    data.driver = v || null;
  }

  if ("status" in patch) {
    const allowed = new Set(["PENDING", "ASSIGNED", "COMPLETED", "R_RECEIVED"]);
    if (!allowed.has(patch.status)) throw new Error("Invalid status");
    data.status = patch.status;
  }

  await prisma.reservation.update({ where: { id }, data });
  return { ok: true };
}
